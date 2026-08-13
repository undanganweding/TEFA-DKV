import { supabase } from '../lib/supabase';
import type { AnnualProcurement } from '../types';
import type { Database } from '../lib/database.types';

type ProcurementRow = Database['public']['Tables']['annual_procurements']['Row'];

export function mapProcurementRow(row: ProcurementRow): AnnualProcurement {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    category: row.category as AnnualProcurement['category'],
    targetItem: row.target_item,
    qty: Number(row.qty),
    estimatedUnitPrice: Number(row.estimated_unit_price),
    totalBudget: Number(row.budget),
    actualCost: row.actual_cost ? Number(row.actual_cost) : undefined,
    remainingBudget: row.actual_cost ? Number(row.budget) - Number(row.actual_cost) : undefined,
    priority: row.priority as AnnualProcurement['priority'],
    status: row.status as AnnualProcurement['status'],
    requestedBy: row.requested_by || '',
    justification: row.justification || '',
    isArchived: row.is_archived,
  };
}

export async function fetchProcurements(): Promise<AnnualProcurement[]> {
  const { data, error } = await supabase
    .from('annual_procurements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching procurements:', error);
    return [];
  }
  return (data || []).map(mapProcurementRow);
}

export async function createProcurement(proc: Omit<AnnualProcurement, 'id'>): Promise<AnnualProcurement | null> {
  const { data, error } = await supabase
    .from('annual_procurements')
    .insert({
      year: proc.year,
      title: proc.title,
      category: proc.category,
      target_item: proc.targetItem,
      qty: proc.qty,
      estimated_unit_price: proc.estimatedUnitPrice,
      budget: proc.totalBudget,
      actual_cost: proc.actualCost || null,
      priority: proc.priority,
      status: proc.status,
      requested_by: proc.requestedBy || null,
      justification: proc.justification || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating procurement:', error);
    return null;
  }
  return mapProcurementRow(data);
}
