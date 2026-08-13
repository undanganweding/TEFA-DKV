import { supabase } from '../lib/supabase';
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
  const { data, error } = await supabase
    .from('inventory_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
  return (data || []).map(mapInventoryRow);
}

export async function createInventoryAsset(tool: Omit<ToolInventory, 'id'>): Promise<ToolInventory | null> {
  const { data, error } = await supabase
    .from('inventory_assets')
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating inventory:', error);
    return null;
  }
  return mapInventoryRow(data);
}

export async function updateInventoryAsset(tool: ToolInventory): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_assets')
    .update({
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
    })
    .eq('id', tool.id);

  if (error) {
    console.error('Error updating inventory:', error);
    return false;
  }
  return true;
}

export async function archiveInventoryAsset(assetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_assets')
    .update({ is_archived: true })
    .eq('id', assetId);
  return !error;
}
