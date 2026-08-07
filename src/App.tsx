import React, { useState } from 'react';
import { PageId, ProductionOrder, Product, CustomerFile, ToolInventory, MaterialStock, FinanceTransaction, AnnualProcurement, SystemSettings, OrderStatus, InboxFile, InboxFileStatus } from './types';
import {
  initialSettings,
  initialProducts,
  initialOrders,
  initialCustomerFiles,
  initialTools,
  initialMaterials,
  initialTransactions,
  initialProcurements,
  initialInboxFiles,
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { DashboardView } from './components/views/DashboardView';
import { KasirView } from './components/views/KasirView';
import { FileInboxView } from './components/views/FileInboxView';
import { PublicUploadView } from './components/views/PublicUploadView';
import { PesananView } from './components/views/PesananView';
import { ProdukView } from './components/views/ProdukView';
import { CustomerFileView } from './components/views/CustomerFileView';
import { InventarisAlatView } from './components/views/InventarisAlatView';
import { StokBahanView } from './components/views/StokBahanView';
import { KeuanganView } from './components/views/KeuanganView';
import { LaporanView } from './components/views/LaporanView';
import { PengadaanView } from './components/views/PengadaanView';
import { PengaturanView } from './components/views/PengaturanView';

import { ReceiptModal } from './components/modals/ReceiptModal';
import { NewOrderModal } from './components/modals/NewOrderModal';
import { AiAssistantModal } from './components/modals/AiAssistantModal';
import { GlobalDeleteModal, DeleteModalItemDetails } from './components/GlobalDeleteModal';

export function App() {
  // Global State
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [inboxFiles, setInboxFiles] = useState<InboxFile[]>(initialInboxFiles);
  const [prefilledFile, setPrefilledFile] = useState<InboxFile | null>(null);
  const [customerFiles, setCustomerFiles] = useState<CustomerFile[]>(initialCustomerFiles);
  const [tools, setTools] = useState<ToolInventory[]>(initialTools);
  const [materials, setMaterials] = useState<MaterialStock[]>(initialMaterials);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions);
  const [procurements, setProcurements] = useState<AnnualProcurement[]>(initialProcurements);

  // Global Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteModalDetails, setDeleteModalDetails] = useState<DeleteModalItemDetails | null>(null);
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<(() => void) | null>(null);

  // Global Search Query
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Modals Control State
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<ProductionOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState<boolean>(false);

  // Active Orders Count & Low Stock Count
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan'
  ).length;

  const lowStockCount = materials.filter((m) => m.status !== 'Aman').length;

  // Handlers for Orders
  const handleAddOrder = (newOrder: ProductionOrder) => {
    setOrders([newOrder, ...orders]);
    
    // Auto add transaction if paid
    if (newOrder.paidAmount > 0) {
      const now = new Date();
      const transNo = 'TRX-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.floor(10 + Math.random() * 90);
      const newTrx: FinanceTransaction = {
        id: 'TRX-' + Date.now(),
        transNo,
        date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'Pemasukan',
        category: 'Penjualan Cetak',
        description: `Pembayaran ${newOrder.paymentStatus} Order No ${newOrder.orderNo} (${newOrder.customerName})`,
        amount: newOrder.paidAmount,
        refOrderNo: newOrder.orderNo,
        paymentMethod: newOrder.paymentMethod || 'Cash',
        operator: settings.activeShiftOperator,
        status: 'Berhasil',
      };
      setTransactions([newTrx, ...transactions]);
    }

    setShowNewOrderModal(false);
    // Trigger thermal receipt
    setActiveReceiptOrder(newOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const now = new Date();
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            statusHistory: [
              ...o.statusHistory,
              {
                status: newStatus,
                timestamp: now.toLocaleString('id-ID'),
                updatedBy: settings.activeShiftOperator,
                note,
              },
            ],
          };
        }
        return o;
      })
    );
  };

  const handleRecordPayment = (orderId: string, amount: number) => {
    const now = new Date();
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          const newPaid = o.paidAmount + amount;
          const newBalance = Math.max(0, o.totalAmount - newPaid);
          const newPaymentStatus = newBalance === 0 ? 'Lunas' : 'DP';
          return {
            ...o,
            paidAmount: newPaid,
            balanceDue: newBalance,
            paymentStatus: newPaymentStatus,
          };
        }
        return o;
      })
    );

    // Record Finance Transaction
    const orderObj = orders.find((o) => o.id === orderId);
    if (orderObj) {
      const transNo = 'TRX-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.floor(10 + Math.random() * 90);
      const newTrx: FinanceTransaction = {
        id: 'TRX-' + Date.now(),
        transNo,
        date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'Pemasukan',
        category: 'Penjualan Cetak',
        description: `Pelunasan/DP Tambahan Order ${orderObj.orderNo} (${orderObj.customerName})`,
        amount,
        refOrderNo: orderObj.orderNo,
        paymentMethod: 'Cash',
        operator: settings.activeShiftOperator,
        status: 'Berhasil',
      };
      setTransactions([newTrx, ...transactions]);
    }
  };

  // Product Handlers
  const handleAddProduct = (p: Product) => {
    setProducts([p, ...products]);
  };

  const handleUpdateProduct = (updatedP: Product) => {
    setProducts(products.map((p) => (p.id === updatedP.id ? updatedP : p)));
  };

  // Finance Handlers
  const handleAddTransaction = (trx: FinanceTransaction) => {
    setTransactions([trx, ...transactions]);
  };

  // File Inbox Handlers
  const handleUpdateInboxFileStatus = (id: string, newStatus: InboxFileStatus) => {
    setInboxFiles(
      inboxFiles.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
  };

  const handleCreateTransactionFromFile = (file: InboxFile) => {
    handleUpdateInboxFileStatus(file.id, 'Menjadi Order');
    setPrefilledFile(file);
    setCurrentPage('kasir');
  };

  const handleAddInboxFile = (newFile: InboxFile) => {
    setInboxFiles([newFile, ...inboxFiles]);
  };

  // Procurement Handlers
  const handleAddProcurement = (prc: AnnualProcurement) => {
    setProcurements([prc, ...procurements]);
  };

  // Helper to trigger delete confirmation modal
  const triggerDeleteModal = (details: DeleteModalItemDetails, action: () => void) => {
    setDeleteModalDetails(details);
    setDeleteConfirmAction(() => action);
    setDeleteModalOpen(true);
  };

  // Archive (Soft Delete) Handlers per Category
  const handleArchiveOrder = (order: ProductionOrder) => {
    triggerDeleteModal(
      {
        id: order.id,
        category: 'Pesanan Produksi',
        title: order.orderNo,
        customerName: order.customerName,
        date: order.orderDate,
        amount: 'Rp ' + order.totalAmount.toLocaleString('id-ID'),
        note: order.status === 'Selesai' ? 'Order yang sudah selesai disarankan diarsipkan untuk kerapihan dashboard.' : undefined,
      },
      () => {
        const now = new Date().toISOString();
        setOrders(
          orders.map((o) =>
            o.id === order.id
              ? { ...o, isArchived: true, archivedAt: now, archivedBy: settings.currentUserRole }
              : o
          )
        );
      }
    );
  };

  const handleArchiveTransaction = (trx: FinanceTransaction) => {
    triggerDeleteModal(
      {
        id: trx.id,
        category: 'Transaksi / Kasir',
        title: trx.transNo,
        customerName: trx.description,
        date: trx.date,
        amount: 'Rp ' + trx.amount.toLocaleString('id-ID'),
      },
      () => {
        const now = new Date().toISOString();
        setTransactions(
          transactions.map((t) =>
            t.id === trx.id
              ? { ...t, isArchived: true, archivedAt: now, archivedBy: settings.currentUserRole }
              : t
          )
        );
      }
    );
  };

  const handleArchiveInboxFile = (file: InboxFile) => {
    triggerDeleteModal(
      {
        id: file.id,
        category: 'File Inbox / Upload',
        title: file.fileName,
        customerName: file.customerName,
        date: file.uploadDate,
      },
      () => {
        const now = new Date().toISOString();
        setInboxFiles(
          inboxFiles.map((f) =>
            f.id === file.id
              ? { ...f, isArchived: true, archivedAt: now, archivedBy: settings.currentUserRole }
              : f
          )
        );
      }
    );
  };

  const handleArchiveCustomerFolder = (folder: CustomerFile) => {
    triggerDeleteModal(
      {
        id: folder.id,
        category: 'Customer & File',
        title: folder.customerName,
        customerName: folder.category,
        date: new Date().toLocaleDateString('id-ID'),
      },
      () => {
        const now = new Date().toISOString();
        setCustomerFiles(
          customerFiles.map((c) =>
            c.id === folder.id
              ? { ...c, isArchived: true, archivedAt: now, archivedBy: settings.currentUserRole }
              : c
          )
        );
      }
    );
  };

  const handleArchiveProduct = (product: Product) => {
    triggerDeleteModal(
      {
        id: product.id,
        category: 'Produk / Jasa',
        title: product.name,
        customerName: `Kode: ${product.code}`,
        amount: 'Rp ' + product.basePrice.toLocaleString('id-ID'),
      },
      () => {
        const now = new Date().toISOString();
        setProducts(
          products.map((p) =>
            p.id === product.id
              ? { ...p, isArchived: true, status: 'Nonaktif', archivedAt: now, archivedBy: settings.currentUserRole }
              : p
          )
        );
      }
    );
  };

  const handleArchiveTool = (tool: ToolInventory) => {
    triggerDeleteModal(
      {
        id: tool.id,
        category: 'Inventaris Alat / Mesin',
        title: tool.name,
        customerName: `Lokasi: ${tool.location} • PIC: ${tool.picName}`,
      },
      () => {
        const now = new Date().toISOString();
        setTools(
          tools.map((t) =>
            t.id === tool.id
              ? { ...t, isArchived: true, archivedAt: now, archivedBy: settings.currentUserRole }
              : t
          )
        );
      }
    );
  };

  const handleArchiveMaterial = (material: MaterialStock) => {
    triggerDeleteModal(
      {
        id: material.id,
        category: 'Stok Bahan',
        title: material.name,
        customerName: `Supplier: ${material.supplier}`,
        amount: 'Rp ' + material.unitPrice.toLocaleString('id-ID'),
      },
      () => {
        const now = new Date().toISOString();
        setMaterials(
          materials.map((m) =>
            m.id === material.id
              ? { ...m, isArchived: true, archivedAt: now, archivedBy: settings.currentUserRole }
              : m
          )
        );
      }
    );
  };

  // Centralized Restore Handler
  const handleRestoreItem = (category: string, id: string) => {
    if (category === 'Pesanan Produksi') {
      setOrders(orders.map((o) => (o.id === id ? { ...o, isArchived: false } : o)));
    } else if (category === 'Transaksi / Kasir') {
      setTransactions(transactions.map((t) => (t.id === id ? { ...t, isArchived: false } : t)));
    } else if (category === 'File Inbox / Upload') {
      setInboxFiles(inboxFiles.map((f) => (f.id === id ? { ...f, isArchived: false } : f)));
    } else if (category === 'Customer & File') {
      setCustomerFiles(customerFiles.map((c) => (c.id === id ? { ...c, isArchived: false } : c)));
    } else if (category === 'Produk / Jasa') {
      setProducts(products.map((p) => (p.id === id ? { ...p, isArchived: false, status: 'Aktif' } : p)));
    } else if (category === 'Inventaris Alat / Mesin') {
      setTools(tools.map((t) => (t.id === id ? { ...t, isArchived: false } : t)));
    } else if (category === 'Stok Bahan') {
      setMaterials(materials.map((m) => (m.id === id ? { ...m, isArchived: false } : m)));
    }
  };

  // Centralized Permanent Delete Handler
  const handlePermanentDeleteItem = (category: string, id: string) => {
    triggerDeleteModal(
      {
        id,
        category,
        title: `Hapus Permanen ${category}`,
        customerName: `ID: ${id}`,
        actionType: 'permanent_delete',
      },
      () => {
        if (category === 'Pesanan Produksi') {
          setOrders(orders.filter((o) => o.id !== id));
        } else if (category === 'Transaksi / Kasir') {
          setTransactions(transactions.filter((t) => t.id !== id));
        } else if (category === 'File Inbox / Upload') {
          setInboxFiles(inboxFiles.filter((f) => f.id !== id));
        } else if (category === 'Customer & File') {
          setCustomerFiles(customerFiles.filter((c) => c.id !== id));
        } else if (category === 'Produk / Jasa') {
          setProducts(products.filter((p) => p.id !== id));
        } else if (category === 'Inventaris Alat / Mesin') {
          setTools(tools.filter((t) => t.id !== id));
        } else if (category === 'Stok Bahan') {
          setMaterials(materials.filter((m) => m.id !== id));
        }
      }
    );
  };

  // Check if current page is standalone public upload page
  if (currentPage === 'public_upload') {
    return (
      <PublicUploadView
        onAddInboxFile={handleAddInboxFile}
        onGoToInbox={() => setCurrentPage('file_inbox')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F8FC] font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        activeOrdersCount={activeOrdersCount}
        lowStockCount={lowStockCount}
        activeOperator={settings.activeShiftOperator}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onOpenAiAssistant={() => setShowAiAssistantModal(true)}
          onOpenNewOrderModal={() => setShowNewOrderModal(true)}
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          notificationsCount={lowStockCount}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentPage === 'dashboard' && (
            <DashboardView
              orders={orders.filter((o) => !o.isArchived)}
              materials={materials.filter((m) => !m.isArchived)}
              inboxFiles={inboxFiles.filter((f) => !f.isArchived)}
              onPageChange={setCurrentPage}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
            />
          )}

          {currentPage === 'kasir' && (
            <KasirView
              products={products.filter((p) => !p.isArchived)}
              onCheckoutOrder={handleAddOrder}
              operatorName={settings.activeShiftOperator}
              prefilledFile={prefilledFile}
              onClearPrefilledFile={() => setPrefilledFile(null)}
            />
          )}

          {currentPage === 'file_inbox' && (
            <FileInboxView
              inboxFiles={inboxFiles.filter((f) => !f.isArchived)}
              onUpdateFileStatus={handleUpdateInboxFileStatus}
              onCreateTransactionFromFile={handleCreateTransactionFromFile}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onArchiveFile={handleArchiveInboxFile}
            />
          )}

          {currentPage === 'pesanan' && (
            <PesananView
              orders={orders.filter((o) => !o.isArchived)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRecordPayment={handleRecordPayment}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onArchiveOrder={handleArchiveOrder}
            />
          )}

          {currentPage === 'produk' && (
            <ProdukView
              products={products.filter((p) => !p.isArchived)}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onArchiveProduct={handleArchiveProduct}
            />
          )}

          {currentPage === 'customer_file' && (
            <CustomerFileView
              customerFiles={customerFiles.filter((c) => !c.isArchived)}
              onArchiveCustomerFolder={handleArchiveCustomerFolder}
            />
          )}

          {currentPage === 'inventaris_alat' && (
            <InventarisAlatView
              tools={tools.filter((t) => !t.isArchived)}
              onArchiveTool={handleArchiveTool}
            />
          )}

          {currentPage === 'stok_bahan' && (
            <StokBahanView
              materials={materials.filter((m) => !m.isArchived)}
              onArchiveMaterial={handleArchiveMaterial}
            />
          )}

          {currentPage === 'keuangan' && (
            <KeuanganView
              transactions={transactions.filter((t) => !t.isArchived)}
              onAddTransaction={handleAddTransaction}
              operatorName={settings.activeShiftOperator}
              onArchiveTransaction={handleArchiveTransaction}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanView
              orders={orders.filter((o) => !o.isArchived)}
              transactions={transactions.filter((t) => !t.isArchived)}
            />
          )}

          {currentPage === 'pengadaan' && (
            <PengadaanView
              procurements={procurements}
              onAddProcurement={handleAddProcurement}
            />
          )}

          {currentPage === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              onSaveSettings={setSettings}
              orders={orders}
              transactions={transactions}
              inboxFiles={inboxFiles}
              customerFiles={customerFiles}
              products={products}
              tools={tools}
              materials={materials}
              onRestoreItem={handleRestoreItem}
              onPermanentDeleteItem={handlePermanentDeleteItem}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          settings={settings}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      {showNewOrderModal && (
        <NewOrderModal
          products={products.filter((p) => !p.isArchived)}
          onAddOrder={handleAddOrder}
          onClose={() => setShowNewOrderModal(false)}
          operatorName={settings.activeShiftOperator}
        />
      )}

      {showAiAssistantModal && (
        <AiAssistantModal onClose={() => setShowAiAssistantModal(false)} />
      )}

      {/* Global Delete Confirmation Modal */}
      {deleteModalOpen && deleteModalDetails && (
        <GlobalDeleteModal
          isOpen={deleteModalOpen}
          itemDetails={deleteModalDetails}
          currentUserRole={settings.currentUserRole}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteModalDetails(null);
            setDeleteConfirmAction(null);
          }}
          onConfirm={() => {
            if (deleteConfirmAction) {
              deleteConfirmAction();
            }
            setDeleteModalOpen(false);
            setDeleteModalDetails(null);
            setDeleteConfirmAction(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
