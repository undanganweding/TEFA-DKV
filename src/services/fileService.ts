import { supabase } from '../lib/supabase';
import type { InboxFile, CustomerFile } from '../types';

// ===== Types from Supabase =====
interface InboxFileRow {
  id: string;
  upload_date: string;
  customer_name: string;
  class_grade: string;
  major: string | null;
  phone: string;
  service_type: string;
  print_size: string | null;
  qty: number;
  notes: string | null;
  file_name: string;
  file_type: string;
  file_size: string;
  preview_url: string | null;
  storage_path: string | null;
  folder_path: string;
  status: string;
  linked_order_no: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
}

interface CustomerFileRow {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  category: string;
  total_orders_count: number;
  folder_path: string;
  last_updated: string;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
}

interface CustomerFileItemRow {
  id: string;
  customer_file_id: string;
  file_name: string;
  file_size: string;
  file_type: string;
  upload_date: string;
  order_no: string | null;
  download_url: string | null;
  thumbnail_url: string | null;
}

function mapInboxFileRow(row: InboxFileRow): InboxFile {
  return {
    id: row.id,
    uploadDate: row.upload_date,
    customerName: row.customer_name,
    classGrade: row.class_grade,
    major: row.major || undefined,
    phone: row.phone,
    serviceType: row.service_type,
    printSize: row.print_size || undefined,
    qty: row.qty,
    notes: row.notes || undefined,
    fileName: row.file_name,
    fileType: row.file_type as InboxFile['fileType'],
    fileSize: row.file_size,
    previewUrl: row.preview_url || undefined,
    folderPath: row.folder_path,
    status: row.status as InboxFile['status'],
    linkedOrderNo: row.linked_order_no || undefined,
    isArchived: row.is_archived,
    archivedAt: row.archived_at || undefined,
    archivedBy: row.archived_by || undefined,
  };
}

// ===== INBOX FILES =====

export async function fetchInboxFiles(): Promise<InboxFile[]> {
  const { data, error } = await supabase
    .from('inbox_files')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inbox files:', error);
    return [];
  }

  return ((data as InboxFileRow[]) || []).map(mapInboxFileRow);
}

export async function addInboxFile(file: Omit<InboxFile, 'id'>): Promise<InboxFile | null> {
  const { data, error } = await supabase
    .from('inbox_files')
    .insert({
      upload_date: file.uploadDate,
      customer_name: file.customerName,
      class_grade: file.classGrade,
      major: file.major || null,
      phone: file.phone,
      service_type: file.serviceType,
      print_size: file.printSize || null,
      qty: file.qty,
      notes: file.notes || null,
      file_name: file.fileName,
      file_type: file.fileType,
      file_size: file.fileSize,
      preview_url: file.previewUrl || null,
      folder_path: file.folderPath,
      status: file.status || 'Menunggu Pemeriksaan',
      linked_order_no: file.linkedOrderNo || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding inbox file:', error);
    return null;
  }

  return mapInboxFileRow(data as InboxFileRow);
}

export async function updateInboxFileStatus(fileId: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('inbox_files')
    .update({ status })
    .eq('id', fileId);
  return !error;
}

export async function archiveInboxFile(fileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('inbox_files')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', fileId);
  return !error;
}

// ===== CUSTOMER FILES =====

export async function fetchCustomerFiles(): Promise<CustomerFile[]> {
  const { data: foldersData, error } = await supabase
    .from('customer_files')
    .select('*')
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('Error fetching customer files:', error);
    return [];
  }

  const folders = (foldersData as CustomerFileRow[]) || [];
  if (folders.length === 0) return [];

  // Fetch file items for all customer folders
  const folderIds = folders.map(f => f.id);
  const { data: itemsData } = await supabase
    .from('customer_file_items')
    .select('*')
    .in('customer_file_id', folderIds);

  const allItems = (itemsData as CustomerFileItemRow[]) || [];

  return folders.map(folder => ({
    id: folder.id,
    customerName: folder.customer_name,
    phone: folder.phone,
    email: folder.email || undefined,
    category: folder.category as CustomerFile['category'],
    totalOrdersCount: folder.total_orders_count,
    folderPath: folder.folder_path,
    lastUpdated: folder.last_updated,
    files: allItems
      .filter(item => item.customer_file_id === folder.id)
      .map(item => ({
        id: item.id,
        fileName: item.file_name,
        fileSize: item.file_size,
        fileType: item.file_type as any,
        uploadDate: item.upload_date,
        orderNo: item.order_no || undefined,
        downloadUrl: item.download_url || undefined,
        thumbnailUrl: item.thumbnail_url || undefined,
      })),
    isArchived: folder.is_archived,
    archivedAt: folder.archived_at || undefined,
    archivedBy: folder.archived_by || undefined,
  }));
}

export async function archiveCustomerFile(fileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('customer_files')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', fileId);
  return !error;
}

// ===== SUPABASE STORAGE FILE UPLOAD =====

export async function uploadFile(
  bucket: 'profile-images' | 'product-images' | 'inventory-images' | 'design-files',
  path: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  // Get public URL for public buckets, signed URL for private
  if (bucket === 'product-images') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  } else {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    return data ? { url: data.signedUrl, path } : null;
  }
}

export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
