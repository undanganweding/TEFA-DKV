/**
 * File Service — Direct REST for database, Supabase JS for Storage.
 */

import { supabase } from '../lib/supabase';
import { restCall } from '../lib/restClient';
import type { InboxFile, CustomerFile } from '../types';

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
    storagePath: row.storage_path || undefined,
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
  const result = await restCall<InboxFileRow[]>('GET', 'inbox_files?select=*&order=created_at.desc');
  if (!result.data) return [];
  return result.data.map(mapInboxFileRow);
}

export async function addInboxFile(file: Omit<InboxFile, 'id'>): Promise<InboxFile | null> {
  const result = await restCall<InboxFileRow[]>('POST', 'inbox_files', {
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
  });
  if (!result.data || result.data.length === 0) return null;
  return mapInboxFileRow(result.data[0]);
}

export async function updateInboxFileStatus(fileId: string, status: string): Promise<boolean> {
  const result = await restCall('PATCH', `inbox_files?id=eq.${fileId}`, { status });
  return !result.error;
}

export async function archiveInboxFile(fileId: string): Promise<boolean> {
  const result = await restCall('PATCH', `inbox_files?id=eq.${fileId}`, {
    is_archived: true,
    archived_at: new Date().toISOString(),
  });
  return !result.error;
}

// ===== CUSTOMER FILES =====

export async function fetchCustomerFiles(): Promise<CustomerFile[]> {
  const foldersResult = await restCall<CustomerFileRow[]>('GET', 'customer_files?select=*&order=last_updated.desc');
  const folders = foldersResult.data || [];
  if (folders.length === 0) return [];

  const idsParam = folders.map(f => encodeURIComponent(f.id)).join(',');
  const itemsResult = await restCall<CustomerFileItemRow[]>(
    'GET',
    `customer_file_items?customer_file_id=in.(${idsParam})`
  );
  const allItems = itemsResult.data || [];

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
  const result = await restCall('PATCH', `customer_files?id=eq.${fileId}`, {
    is_archived: true,
    archived_at: new Date().toISOString(),
  });
  return !result.error;
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

// ===== GUEST ORDER FILE UPLOAD =====

export async function uploadGuestOrderFile(params: {
  orderId: string;
  guestAccessToken: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  file: File;
}): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  const { orderId, guestAccessToken, orderNo, customerName, customerPhone, productName, file } = params;

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${sanitizedName}`;
  const storagePath = `guest-orders/${orderId}/${guestAccessToken}/${uniqueName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('design-files')
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    console.error('Guest file upload error:', uploadError);
    return { success: false, error: 'Gagal mengupload file: ' + uploadError.message };
  }

  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const fileTypeLabel = ['JPG', 'JPEG', 'PNG', 'PDF', 'PSD', 'AI', 'CDR', 'ZIP'].includes(ext)
    ? (ext === 'JPEG' ? 'JPG' : ext)
    : 'PDF';

  const fileSizeStr = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  // Create inbox_files record via REST
  const inboxResult = await restCall('POST', 'inbox_files', {
    customer_name: customerName,
    class_grade: 'Guest Customer',
    phone: customerPhone,
    service_type: productName,
    file_name: file.name,
    file_type: file.type || 'application/octet-stream',
    file_size: fileSizeStr,
    storage_path: storagePath,
    folder_path: `design-files/${storagePath}`,
    status: 'Menunggu Pemeriksaan',
    linked_order_no: orderNo,
  });

  if (inboxResult.error) {
    console.error('Guest file inbox record error:', inboxResult.error);
    await supabase.storage.from('design-files').remove([storagePath]).catch(() => {});
    return { success: false, error: 'File terupload tetapi gagal membuat record: ' + inboxResult.error.message };
  }

  return { success: true, storagePath };
}

// ===== STUDENT ORDER FILE UPLOAD =====

export async function uploadStudentOrderFile(params: {
  orderId: string;
  studentId?: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  classGrade: string;
  major?: string;
  serviceType: string;
  printSize?: string;
  qty?: number;
  notes?: string;
  file: File;
}): Promise<{ success: boolean; storagePath?: string; publicUrl?: string; error?: string }> {
  const { orderId, studentId, orderNo, customerName, customerPhone, classGrade, major, serviceType, printSize, qty, notes, file } = params;

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${sanitizedName}`;
  const storagePath = `student-orders/${studentId || 'student'}/${orderId}/${uniqueName}`;

  // Upload to Supabase Storage bucket
  const { error: uploadError } = await supabase.storage
    .from('design-files')
    .upload(storagePath, file, { upsert: true });

  let downloadUrl = '';
  if (!uploadError) {
    const { data: signedData } = await supabase.storage.from('design-files').createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days
    downloadUrl = signedData?.signedUrl || '';
  }

  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const fileTypeLabel = ['JPG', 'JPEG', 'PNG', 'PDF', 'PSD', 'AI', 'CDR', 'ZIP'].includes(ext)
    ? (ext === 'JPEG' ? 'JPG' : ext)
    : 'PDF';

  const fileSizeStr = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  // Create inbox_files record via REST
  const inboxResult = await restCall('POST', 'inbox_files', {
    upload_date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    customer_name: customerName,
    class_grade: classGrade,
    major: major || null,
    phone: customerPhone,
    service_type: serviceType,
    print_size: printSize || 'Standard',
    qty: qty || 1,
    notes: notes || null,
    file_name: file.name,
    file_type: fileTypeLabel,
    file_size: fileSizeStr,
    preview_url: downloadUrl || null,
    storage_path: storagePath,
    folder_path: `/TEFA_FILES/2026/STUDENTS/${orderId}/${file.name}`,
    status: 'Menunggu Pemeriksaan',
    linked_order_no: orderNo,
  });

  if (inboxResult.error) {
    console.warn('[STUDENT_FILE] Inbox file record notice:', inboxResult.error);
  }

  return {
    success: !uploadError,
    storagePath,
    publicUrl: downloadUrl,
    error: uploadError ? uploadError.message : undefined,
  };
}

export async function getFileDownloadUrl(file: { previewUrl?: string | null; storagePath?: string | null }): Promise<string | null> {
  if (file.storagePath) {
    const signed = await getSignedUrl('design-files', file.storagePath);
    if (signed) return signed;
  }
  return file.previewUrl || null;
}

