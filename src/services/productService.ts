/**
 * Product Service — Direct REST API client.
 * Uses native fetch() with retry to avoid Supabase JS HTTP/2 connection issues.
 */

import type { Product } from '../types';
import type { Database } from '../lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type RecipeRow = Database['public']['Tables']['product_recipes']['Row'];
type VariantRow = Database['public']['Tables']['product_variants']['Row'];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface RestResult<T> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

async function restCall<T = any>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: any,
  retries = 3,
  baseDelay = 500
): Promise<RestResult<T>> {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'GET' ? 'return=representation' : 'return=minimal',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const options: RequestInit = {
        method,
        headers,
        credentials: 'omit',
      };

      if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const text = await response.text().catch(() => '');
        return { data: null, error: { message: text || `HTTP ${response.status}`, status: response.status } };
      }

      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          const delay = response.status === 429
            ? parseInt(response.headers.get('retry-after') || '5', 10) * 1000
            : baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
      }

      if (response.status === 204) {
        return { data: {} as T, error: null };
      }

      const text = await response.text();
      if (!response.ok) {
        return { data: null, error: { message: text || `HTTP ${response.status}`, status: response.status } };
      }

      return { data: text ? JSON.parse(text) : ({} as T), error: null };

    } catch (err: any) {
      const isNetworkError =
        !err.status &&
        (err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('net::ERR_') ||
          err.name === 'TypeError');

      if (isNetworkError && attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }

      return { data: null, error: { message: err.message || 'Network error' } };
    }
  }

  return { data: null, error: { message: 'All retries exhausted' } };
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category as Product['category'],
    unit: row.unit as Product['unit'],
    basePrice: Number(row.base_price),
    costPrice: Number(row.cost_price),
    minQty: row.min_qty,
    description: row.description || '',
    isCustomDimension: row.is_custom_dimension,
    stock: row.stock ?? undefined,
    status: row.visibility ? 'Aktif' : 'Nonaktif',
    image: row.image || undefined,
    showInCustomerPlatform: row.show_in_customer_platform,
    isArchived: row.is_archived,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  // Fetch all data in parallel via REST
  const [productsResult, recipesResult, variantsResult] = await Promise.all([
    restCall<ProductRow[]>('GET', 'products?select=*&order=created_at.desc'),
    restCall<RecipeRow[]>('GET', 'product_recipes?select=*'),
    restCall<VariantRow[]>('GET', 'product_variants?select=*&is_active=eq.true'),
  ]);

  const productRows = productsResult.data || [];
  const recipes = recipesResult.data || [];
  const variants = variantsResult.data || [];

  if (productRows.length === 0) return [];

  return productRows.map(row => {
    const product = mapProductRow(row);

    const productRecipes = recipes
      .filter(r => r.product_id === row.id)
      .map(r => ({ materialId: r.material_id, qtyRequired: Number(r.qty_required) }));
    if (productRecipes.length > 0) {
      product.recipe = productRecipes;
    }

    const productVariants = variants
      .filter(v => v.product_id === row.id)
      .map(v => ({
        id: v.id,
        productId: v.product_id,
        name: v.name,
        code: v.code || undefined,
        unit: v.unit,
        basePrice: Number(v.base_price),
        isActive: v.is_active,
      }));

    product.variants = productVariants;
    return product;
  });
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  const result = await restCall<ProductRow>('POST', 'products', {
    code: product.code,
    name: product.name,
    category: product.category,
    unit: product.unit,
    base_price: product.basePrice,
    cost_price: product.costPrice || 0,
    min_qty: product.minQty,
    description: product.description,
    is_custom_dimension: product.isCustomDimension || false,
    stock: product.stock ?? null,
    visibility: product.status === 'Aktif',
    image: product.image || null,
    show_in_customer_platform: product.showInCustomerPlatform ?? true,
  });

  if (result.error || !result.data) {
    console.error('Error creating product:', result.error);
    return null;
  }

  // Insert recipes if present
  if (product.recipe && product.recipe.length > 0) {
    const recipeInserts = product.recipe.map(r => ({
      product_id: result.data!.id,
      material_id: r.materialId,
      qty_required: r.qtyRequired,
    }));
    await restCall('POST', 'product_recipes', recipeInserts, 2);
  }

  return mapProductRow(result.data);
}

export async function updateProduct(product: Product): Promise<boolean> {
  const result = await restCall('PATCH', `products?id=eq.${product.id}`, {
    code: product.code,
    name: product.name,
    category: product.category,
    unit: product.unit,
    base_price: product.basePrice,
    cost_price: product.costPrice || 0,
    min_qty: product.minQty,
    description: product.description,
    is_custom_dimension: product.isCustomDimension || false,
    stock: product.stock ?? null,
    visibility: product.status === 'Aktif',
    image: product.image || null,
    show_in_customer_platform: product.showInCustomerPlatform ?? true,
  });

  if (result.error) {
    console.error('Error updating product:', result.error);
    return false;
  }

  // Update recipes: delete old, insert new
  if (product.recipe) {
    await restCall('DELETE', `product_recipes?product_id=eq.${product.id}`, undefined, 2);
    if (product.recipe.length > 0) {
      const recipeInserts = product.recipe.map(r => ({
        product_id: product.id,
        material_id: r.materialId,
        qty_required: r.qtyRequired,
      }));
      await restCall('POST', 'product_recipes', recipeInserts, 2);
    }
  }

  return true;
}

export async function archiveProduct(productId: string): Promise<boolean> {
  const result = await restCall('PATCH', `products?id=eq.${productId}`, { is_archived: true }, 2);
  return !result.error;
}

export async function restoreProduct(productId: string): Promise<boolean> {
  const result = await restCall('PATCH', `products?id=eq.${productId}`, { is_archived: false }, 2);
  return !result.error;
}
