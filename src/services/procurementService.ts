/**
 * Procurement Service — Direct REST API client.
 */

import { restCall } from '../lib/restClient';
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
  const result = await restCall<ProcurementRow[]>('GET', 'annual_procurements?select=*&order=created_at.desc');
  if (!result.data) return [];
  return result.data.map(mapProcurementRow);
}

export async function createProcurement(proc: Omit<AnnualProcurement, 'id'>): Promise<AnnualProcurement | null> {
  const result = await restCall<ProcurementRow[]>('POST', 'annual_procurements', {
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
  });
  if (!result.data || result.data.length === 0) return null;
  return mapProcurementRow(result.data[0]);
}
