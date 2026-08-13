import { supabase } from '../lib/supabase';
import type { FinanceTransaction } from '../types';
import type { Database } from '../lib/database.types';

type FinanceRow = Database['public']['Tables']['finance_transactions']['Row'];

export function mapFinanceRow(row: FinanceRow): FinanceTransaction {
  return {
    id: row.id,
    transNo: row.trans_no,
    date: row.date,
    type: row.type as FinanceTransaction['type'],
    category: row.category as FinanceTransaction['category'],
    description: row.description || '',
    amount: Number(row.amount),
    cogsAmount: Number(row.cogs_amount),
    profitAmount: Number(row.profit_amount),
    refOrderNo: row.ref_order_no || undefined,
    paymentMethod: (row.payment_method || 'Cash') as FinanceTransaction['paymentMethod'],
    operator: row.operator || '',
    status: (row.status || 'Berhasil') as FinanceTransaction['status'],
    isArchived: row.is_archived,
  };
}

export async function fetchTransactions(): Promise<FinanceTransaction[]> {
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return (data || []).map(mapFinanceRow);
}

export async function createTransaction(transaction: Omit<FinanceTransaction, 'id'>): Promise<FinanceTransaction | null> {
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      trans_no: transaction.transNo,
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      cogs_amount: transaction.cogsAmount || 0,
      profit_amount: transaction.profitAmount || 0,
      ref_order_no: transaction.refOrderNo || null,
      category: transaction.category,
      description: transaction.description,
      payment_method: transaction.paymentMethod,
      operator: transaction.operator,
      status: transaction.status || 'Berhasil',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  return mapFinanceRow(data);
}

export async function archiveTransaction(transactionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('finance_transactions')
    .update({ is_archived: true })
    .eq('id', transactionId);
  return !error;
}
