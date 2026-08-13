import { supabase } from '../lib/supabase';
import type { MaterialStock, StockMovement } from '../types';
import type { Database } from '../lib/database.types';

type MaterialRow = Database['public']['Tables']['materials']['Row'];
type StockMovementRow = Database['public']['Tables']['stock_movements']['Row'];

export function mapMaterialRow(row: MaterialRow): MaterialStock {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category as MaterialStock['category'],
    currentStock: Number(row.current_stock),
    minStock: Number(row.min_stock),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    costPrice: Number(row.cost_price),
    sellingRefPrice: row.selling_ref_price ? Number(row.selling_ref_price) : undefined,
    supplier: row.supplier || '',
    location: row.location || '',
    status: row.status as MaterialStock['status'],
    lastRestocked: row.last_restocked || '',
    image: row.image || undefined,
    isArchived: row.is_archived,
  };
}

export function mapStockMovementRow(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    materialId: row.material_id,
    materialName: row.material_name,
    date: row.created_at,
    type: row.type as StockMovement['type'],
    quantity: Number(row.quantity),
    beforeStock: Number(row.before_stock),
    afterStock: Number(row.after_stock),
    referenceId: row.reference_id || undefined,
    unit: row.unit,
    unitCost: Number(row.unit_cost),
    totalValue: Number(row.total_value),
    supplier: row.supplier || undefined,
    notes: row.notes || undefined,
    operator: row.operator || undefined,
  };
}

export async function fetchMaterials(): Promise<MaterialStock[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
  return (data || []).map(mapMaterialRow);
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }
  return (data || []).map(mapStockMovementRow);
}

export async function createMaterial(material: Omit<MaterialStock, 'id'>): Promise<MaterialStock | null> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      code: material.code,
      name: material.name,
      category: material.category,
      current_stock: material.currentStock,
      min_stock: material.minStock,
      unit: material.unit,
      unit_price: material.unitPrice,
      cost_price: material.costPrice || material.unitPrice,
      selling_ref_price: material.sellingRefPrice ?? null,
      supplier: material.supplier || null,
      location: material.location || null,
      status: material.status,
      last_restocked: material.lastRestocked || null,
      image: material.image || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating material:', error);
    return null;
  }
  return mapMaterialRow(data);
}

export async function updateMaterial(material: MaterialStock): Promise<boolean> {
  const { error } = await supabase
    .from('materials')
    .update({
      code: material.code,
      name: material.name,
      category: material.category,
      current_stock: material.currentStock,
      min_stock: material.minStock,
      unit: material.unit,
      unit_price: material.unitPrice,
      cost_price: material.costPrice || material.unitPrice,
      selling_ref_price: material.sellingRefPrice ?? null,
      supplier: material.supplier || null,
      location: material.location || null,
      status: material.status,
      last_restocked: material.lastRestocked || null,
      image: material.image || null,
    })
    .eq('id', material.id);

  if (error) {
    console.error('Error updating material:', error);
    return false;
  }
  return true;
}

export async function restockMaterial(
  materialId: string,
  addedQty: number,
  totalPrice: number,
  operator: string
): Promise<boolean> {
  // Fetch current material
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('*')
    .eq('id', materialId)
    .single();

  if (fetchError || !material) return false;

  const beforeStock = Number(material.current_stock);
  const newStock = beforeStock + addedQty;
  let newStatus: 'Aman' | 'Menipis' | 'Kritis' = 'Aman';
  if (newStock <= Number(material.min_stock) * 0.5) newStatus = 'Kritis';
  else if (newStock <= Number(material.min_stock)) newStatus = 'Menipis';

  // Update material stock
  const { error: updateError } = await supabase
    .from('materials')
    .update({
      current_stock: newStock,
      status: newStatus,
      last_restocked: new Date().toISOString().split('T')[0],
    })
    .eq('id', materialId);

  if (updateError) return false;

  // Log stock movement
  await supabase.from('stock_movements').insert({
    material_id: materialId,
    material_name: material.name,
    type: 'Masuk',
    quantity: addedQty,
    before_stock: beforeStock,
    after_stock: newStock,
    unit: material.unit,
    unit_cost: Number(material.unit_price),
    total_value: totalPrice,
    notes: 'Restock bahan',
    operator,
  });

  return true;
}

export async function archiveMaterial(materialId: string): Promise<boolean> {
  const { error } = await supabase
    .from('materials')
    .update({ is_archived: true })
    .eq('id', materialId);
  return !error;
}

export async function addStockMovement(movement: Omit<StockMovement, 'id'>): Promise<StockMovement | null> {
  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      material_id: movement.materialId,
      material_name: movement.materialName,
      type: movement.type,
      quantity: movement.quantity,
      before_stock: movement.beforeStock || 0,
      after_stock: movement.afterStock || 0,
      reference_id: movement.referenceId || null,
      unit: movement.unit,
      unit_cost: movement.unitCost,
      total_value: movement.totalValue,
      supplier: movement.supplier || null,
      notes: movement.notes || null,
      operator: movement.operator || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding stock movement:', error);
    return null;
  }
  return mapStockMovementRow(data);
}
