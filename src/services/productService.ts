import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import type { Database } from '../lib/database.types';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

type ProductRow = Database['public']['Tables']['products']['Row'];
type RecipeRow = Database['public']['Tables']['product_recipes']['Row'];
type VariantRow = Database['public']['Tables']['product_variants']['Row'];

/**
 * Maps a Supabase product row to the existing Product interface
 */
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

/**
 * Execute a Supabase query with retry on network errors.
 */
async function execWithRetry<T>(
  query: PostgrestFilterBuilder<any, any, T[], any, any>,
  retries = 2
): Promise<T[] | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await query;
    if (!error && data !== null) return data;
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  return null;
}

export async function fetchProducts(): Promise<Product[]> {
  // Fetch all data in PARALLEL (reduces total exposure to connection resets)
  const [productRows, recipes, variants] = await Promise.all([
    execWithRetry<ProductRow>(
      supabase.from('products').select('*').order('created_at', { ascending: false })
    ),
    execWithRetry<RecipeRow>(
      supabase.from('product_recipes').select('*')
    ),
    execWithRetry<VariantRow>(
      supabase.from('product_variants').select('*').eq('is_active', true)
    ),
  ]);

  if (!productRows || productRows.length === 0) return [];

  return productRows.map(row => {
    const product = mapProductRow(row);
    const productRecipes = (recipes || [])
      .filter((r: RecipeRow) => r.product_id === row.id)
      .map((r: RecipeRow) => ({ materialId: r.material_id, qtyRequired: Number(r.qty_required) }));
    if (productRecipes.length > 0) {
      product.recipe = productRecipes;
    }

    // Attach variants
    const productVariants = (variants || [])
      .filter((v: VariantRow) => v.product_id === row.id)
      .map((v: VariantRow) => ({
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
  const { data, error } = await supabase
    .from('products')
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  // Insert recipes if present
  if (product.recipe && product.recipe.length > 0) {
    const recipeInserts = product.recipe.map(r => ({
      product_id: data.id,
      material_id: r.materialId,
      qty_required: r.qtyRequired,
    }));
    await supabase.from('product_recipes').insert(recipeInserts);
  }

  return mapProductRow(data);
}

export async function updateProduct(product: Product): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({
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
    })
    .eq('id', product.id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }

  // Update recipes: delete old, insert new
  if (product.recipe) {
    await supabase.from('product_recipes').delete().eq('product_id', product.id);
    if (product.recipe.length > 0) {
      const recipeInserts = product.recipe.map(r => ({
        product_id: product.id,
        material_id: r.materialId,
        qty_required: r.qtyRequired,
      }));
      await supabase.from('product_recipes').insert(recipeInserts);
    }
  }

  return true;
}

export async function archiveProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ is_archived: true })
    .eq('id', productId);

  if (error) {
    console.error('Error archiving product:', error);
    return false;
  }
  return true;
}

export async function restoreProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ is_archived: false })
    .eq('id', productId);

  if (error) {
    console.error('Error restoring product:', error);
    return false;
  }
  return true;
}
