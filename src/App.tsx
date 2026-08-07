import React, { useState } from 'react';
import { PageId, ProductionOrder, Product, CustomerFile, ToolInventory, MaterialStock, FinanceTransaction, AnnualProcurement, SystemSettings, OrderStatus, InboxFile, InboxFileStatus, CustomOrder, CustomOrderStatus } from './types';
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
  initialCustomOrders,
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { DashboardView } from './components/views/DashboardView';
import { KasirView } from './components/views/KasirView';
import { CustomOrderView } from './components/views/CustomOrderView';
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
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>(initialCustomOrders);

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
  const pendingCustomOrdersCount = customOrders.filter(o => o.status !== 'Selesai' && o.status !== 'Sudah Diambil').length;

  // Handlers for Orders
  const handleAddOrder = (newOrder: ProductionOrder) => {
    setOrders(prev => [newOrder, ...prev]);

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
      setTransactions(prev => [newTrx, ...prev]);
    }

    setShowNewOrderModal(false);
    // Trigger thermal receipt
    setActiveReceiptOrder(newOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const now = new Date();
    setOrders(prev =>
      prev.map((o) => {
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
    setOrders(prev =>
      prev.map((o) => {
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
    setTransactions(prev => {
      const orderObj = prev.find((o) => o.id === orderId);
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
        return [newTrx, ...prev];
      }
      return prev;
    });
  };

  // Product Handlers
  const handleAddProduct = (p: Product) => {
    setProducts(prev => [p, ...prev]);
  };

  const handleUpdateProduct = (updatedP: Product) => {
    setProducts(prev => prev.map((p) => (p.id === updatedP.id ? updatedP : p)));
  };

  // Finance Handlers
  const handleAddTransaction = (trx: FinanceTransaction) => {
    setTransactions(prev => [trx, ...prev]);
  };

  // File Inbox Handlers
  const handleUpdateInboxFileStatus = (id: string, newStatus: InboxFileStatus) => {
    setInboxFiles(prev =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
  };

  const handleCreateTransactionFromFile = (file: InboxFile) => {
    handleUpdateInboxFileStatus(file.id, 'Menjadi Order');
    setPrefilledFile(file);
    setCurrentPage('kasir');
  };

  const handleAddInboxFile = (newFile: InboxFile) => {
    setInboxFiles(prev => [newFile, ...prev]);
  };

  // Procurement Handlers
  const handleAddProcurement = (prc: AnnualProcurement) => {
    setProcurements(prev => [prc, ...prev]);
  };

  const handleDeleteProcurement = (proc: AnnualProcurement) => {
    triggerDeleteModal(
      {
        id: proc.id,
        category: 'Pengadaan Tahunan',
        title: proc.title,
        customerName: `TA ${proc.year}`,
        date: proc.year,
        amount: 'Rp ' + proc.totalBudget.toLocaleString('id-ID'),
      },
      () => {
        setProcurements(prev => prev.filter((p) => p.id !== proc.id));
      }
    );
  };

  const handleUpdateProcurementStatus = (id: string, newStatus: string) => {
    setProcurements(prev =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus as any } : p
      )
    );
  };

  // Custom Order Handlers
  const handleAddCustomOrder = (order: CustomOrder) => {
    setCustomOrders(prev => [order, ...prev]);

    // Auto add transaction if paid (assuming payment is made upfront)
    if (order.sellingPrice > 0) {
      const now = new Date();
      const transNo = 'TRX-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.floor(10 + Math.random() * 90);
      const newTrx: FinanceTransaction = {
        id: 'TRX-' + Date.now(),
        transNo,
        date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'Pemasukan',
        category: 'Penjualan Cetak',
        description: `Custom Order: ${order.orderName} - ${order.customerName}`,
        amount: order.sellingPrice,
        refOrderNo: order.orderNo,
        paymentMethod: 'Cash',
        operator: settings.activeShiftOperator,
        status: 'Berhasil',
      };
      setTransactions(prev => [newTrx, ...prev]);
    }
  };

  const handleUpdateCustomOrderStatus = (orderId: string, newStatus: CustomOrderStatus, note?: string) => {
    const now = new Date();
    setCustomOrders(prev =>
      prev.map((o) => {
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

  const handleDeleteCustomOrder = (order: CustomOrder) => {
    triggerDeleteModal(
      {
        id: order.id,
        category: 'Custom Order',
        title: order.orderName,
        customerName: order.customerName,
        date: order.orderDate,
        amount: 'Rp ' + order.sellingPrice.toLocaleString('id-ID'),
      },
      () => {
        setCustomOrders(prev => prev.filter((o) => o.id !== order.id));
      }
    );
  };

  // Helper to trigger delete confirmation modal
  const triggerDeleteModal = (details: DeleteModalItemDetails, action: () => void) => {
    setDeleteModalDetails(details);
    setDeleteConfirmAction(() => action);
    setDeleteModalOpen(true);
  };

  // Delete Handlers per Category (menggunakan functional updates agar selalu dapat state terkini)
  const handleDeleteOrder = (order: ProductionOrder) => {
    triggerDeleteModal(
      {
        id: order.id,
        category: 'Pesanan Produksi',
        title: order.orderNo,
        customerName: order.customerName,
        date: order.orderDate,
        amount: 'Rp ' + order.totalAmount.toLocaleString('id-ID'),
        warningNote: order.status === 'Selesai' ? 'Order yang sudah selesai akan dihapus permanen.' : undefined,
      },
      () => {
        setOrders(prev => prev.filter((o) => o.id !== order.id));
      }
    );
  };

  const handleDeleteTransaction = (trx: FinanceTransaction) => {
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
        setTransactions(prev => prev.filter((t) => t.id !== trx.id));
      }
    );
  };

  const handleDeleteInboxFile = (file: InboxFile) => {
    triggerDeleteModal(
      {
        id: file.id,
        category: 'File Inbox / Upload',
        title: file.fileName,
        customerName: file.customerName,
        date: file.uploadDate,
      },
      () => {
        setInboxFiles(prev => prev.filter((f) => f.id !== file.id));
      }
    );
  };

  const handleDeleteCustomerFolder = (folder: CustomerFile) => {
    triggerDeleteModal(
      {
        id: folder.id,
        category: 'Customer & File',
        title: folder.customerName,
        customerName: folder.category,
        date: new Date().toLocaleDateString('id-ID'),
      },
      () => {
        setCustomerFiles(prev => prev.filter((c) => c.id !== folder.id));
      }
    );
  };

  const handleDeleteProduct = (product: Product) => {
    triggerDeleteModal(
      {
        id: product.id,
        category: 'Produk / Jasa',
        title: product.name,
        customerName: `Kode: ${product.code}`,
        amount: 'Rp ' + product.basePrice.toLocaleString('id-ID'),
      },
      () => {
        setProducts(prev => prev.filter((p) => p.id !== product.id));
      }
    );
  };

  const handleDeleteTool = (tool: ToolInventory) => {
    triggerDeleteModal(
      {
        id: tool.id,
        category: 'Inventaris Alat / Mesin',
        title: tool.name,
        customerName: `Lokasi: ${tool.location} • PIC: ${tool.picName}`,
      },
      () => {
        setTools(prev => prev.filter((t) => t.id !== tool.id));
      }
    );
  };

  const handleDeleteMaterial = (material: MaterialStock) => {
    triggerDeleteModal(
      {
        id: material.id,
        category: 'Stok Bahan',
        title: material.name,
        customerName: `Supplier: ${material.supplier}`,
        amount: 'Rp ' + material.unitPrice.toLocaleString('id-ID'),
      },
      () => {
        setMaterials(prev => prev.filter((m) => m.id !== material.id));
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
        customOrdersCount={pendingCustomOrdersCount}
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
              orders={orders}
              materials={materials}
              inboxFiles={inboxFiles}
              onPageChange={setCurrentPage}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
            />
          )}

          {currentPage === 'kasir' && (
            <KasirView
              products={products}
              onCheckoutOrder={handleAddOrder}
              operatorName={settings.activeShiftOperator}
              prefilledFile={prefilledFile}
              onClearPrefilledFile={() => setPrefilledFile(null)}
            />
          )}

          {currentPage === 'custom_order' && (
            <CustomOrderView
              customOrders={customOrders}
              onAddCustomOrder={handleAddCustomOrder}
              onUpdateCustomOrderStatus={handleUpdateCustomOrderStatus}
              onDeleteCustomOrder={handleDeleteCustomOrder}
              operatorName={settings.activeShiftOperator}
            />
          )}

          {currentPage === 'file_inbox' && (
            <FileInboxView
              inboxFiles={inboxFiles}
              onUpdateFileStatus={handleUpdateInboxFileStatus}
              onCreateTransactionFromFile={handleCreateTransactionFromFile}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onDeleteFile={handleDeleteInboxFile}
            />
          )}

          {currentPage === 'pesanan' && (
            <PesananView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRecordPayment={handleRecordPayment}
              onOpenOrderReceipt={(ord) => setActiveReceiptOrder(ord)}
              onOpenNewOrderModal={() => setShowNewOrderModal(true)}
              onOpenPublicUpload={() => setCurrentPage('public_upload')}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {currentPage === 'produk' && (
            <ProdukView
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {currentPage === 'customer_file' && (
            <CustomerFileView
              customerFiles={customerFiles}
              onDeleteCustomerFolder={handleDeleteCustomerFolder}
            />
          )}

          {currentPage === 'inventaris_alat' && (
            <InventarisAlatView
              tools={tools}
              onDeleteTool={handleDeleteTool}
            />
          )}

          {currentPage === 'stok_bahan' && (
            <StokBahanView
              materials={materials}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {currentPage === 'keuangan' && (
            <KeuanganView
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              operatorName={settings.activeShiftOperator}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanView
              orders={orders}
              transactions={transactions}
            />
          )}

          {currentPage === 'pengadaan' && (
            <PengadaanView
              procurements={procurements}
              onAddProcurement={handleAddProcurement}
              onUpdateProcurementStatus={handleUpdateProcurementStatus}
            />
          )}

          {currentPage === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              onSaveSettings={setSettings}
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
          products={products}
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
          onCancel={() => {
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
