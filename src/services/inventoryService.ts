/**
 * Inventory Service — Direct REST API client.
 */

import { restCall } from '../lib/restClient';
import type { ToolInventory } from '../types';
import type { Database } from '../lib/database.types';

type InventoryRow = Database['public']['Tables']['inventory_assets']['Row'];

export function mapInventoryRow(row: InventoryRow): ToolInventory {
  return {
    id: row.id,
    code: row.asset_code,
    name: row.name,
    category: row.category as ToolInventory['category'],
    location: (row.location || 'Lab Cetak 1') as ToolInventory['location'],
    condition: (row.condition || 'Baik') as ToolInventory['condition'],
    status: (row.status || 'Tersedia') as ToolInventory['status'],
    serialNumber: row.serial_number || '',
    purchaseDate: row.purchase_date || '',
    lastMaintenance: row.last_maintenance || '',
    picName: row.pic_name || '',
    specification: row.specifications || undefined,
    brand: row.brand || undefined,
    model: row.model || undefined,
    acquisitionCost: row.purchase_price ? Number(row.purchase_price) : undefined,
    images: row.image_path ? [row.image_path] : undefined,
    coverImage: row.image_path || undefined,
    isArchived: row.is_archived,
  };
}

export async function fetchInventory(): Promise<ToolInventory[]> {
  const result = await restCall<InventoryRow[]>('GET', 'inventory_assets?select=*&order=created_at.desc');
  if (!result.data) return [];
  return result.data.map(mapInventoryRow);
}

export async function createInventoryAsset(tool: Omit<ToolInventory, 'id'>): Promise<ToolInventory | null> {
  const result = await restCall<InventoryRow[]>('POST', 'inventory_assets', {
    asset_code: tool.code,
    name: tool.name,
    category: tool.category,
    location: tool.location,
    condition: tool.condition,
    status: tool.status,
    serial_number: tool.serialNumber,
    purchase_date: tool.purchaseDate || null,
    last_maintenance: tool.lastMaintenance || null,
    pic_name: tool.picName,
    specifications: tool.specification || null,
    brand: tool.brand || null,
    model: tool.model || null,
    purchase_price: tool.acquisitionCost || null,
    image_path: tool.coverImage || tool.images?.[0] || null,
  });
  if (!result.data || result.data.length === 0) return null;
  return mapInventoryRow(result.data[0]);
}

export async function updateInventoryAsset(tool: ToolInventory): Promise<boolean> {
  const result = await restCall('PATCH', `inventory_assets?id=eq.${tool.id}`, {
    asset_code: tool.code,
    name: tool.name,
    category: tool.category,
    location: tool.location,
    condition: tool.condition,
    status: tool.status,
    serial_number: tool.serialNumber,
    purchase_date: tool.purchaseDate || null,
    last_maintenance: tool.lastMaintenance || null,
    pic_name: tool.picName,
    specifications: tool.specification || null,
    brand: tool.brand || null,
    model: tool.model || null,
    purchase_price: tool.acquisitionCost || null,
    image_path: tool.coverImage || tool.images?.[0] || null,
  });
  return !result.error;
}

export async function archiveInventoryAsset(assetId: string): Promise<boolean> {
  const result = await restCall('PATCH', `inventory_assets?id=eq.${assetId}`, { is_archived: true });
  return !result.error;
}
