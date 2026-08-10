import React, { useState, useEffect, useCallback } from 'react'
import {
  PageId,
  ProductionOrder,
  Product,
  CustomerFile,
  ToolInventory,
  MaterialStock,
  FinanceTransaction,
  AnnualProcurement,
  OrderStatus,
  InboxFile,
  InboxFileStatus,
  CustomOrder,
  CustomOrderStatus,
} from './types'
import { useDatabase } from './lib/useDatabase'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'

import { DashboardView } from './components/views/DashboardView'
import { KasirView } from './components/views/KasirView'
import { CustomOrderView } from './components/views/CustomOrderView'
import { FileInboxView } from './components/views/FileInboxView'
import { PublicUploadView } from './components/views/PublicUploadView'
import { PesananView } from './components/views/PesananView'
import { ProdukView } from './components/views/ProdukView'
import { CustomerFileView } from './components/views/CustomerFileView'
import { InventarisAlatView } from './components/views/InventarisAlatView'
import { StokBahanView } from './components/views/StokBahanView'
import { KeuanganView } from './components/views/KeuanganView'
import { LaporanView } from './components/views/LaporanView'
import { PengadaanView } from './components/views/PengadaanView'
import { PengaturanView } from './components/views/PengaturanView'

import { ReceiptModal } from './components/modals/ReceiptModal'
import { NewOrderModal } from './components/modals/NewOrderModal'
import { AiAssistantModal } from './components/modals/AiAssistantModal'
import { GlobalDeleteModal, DeleteModalItemDetails } from './components/GlobalDeleteModal'

export function AppWithDatabase() {
  const {
    isLoading,
    isConnected,
    error,
    products,
    orders,
    transactions,
    materials,
    tools,
    inboxFiles,
    customOrders,
    procurements,
    customerFiles,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    updateOrder,
    updateOrderStatus,
    recordPayment,
    deleteOrder,
    addTransaction,
    deleteTransaction,
    deleteMaterial,
    deleteTool,
    updateInboxFileStatus,
    addInboxFile,
    deleteInboxFile,
    addCustomOrder,
    updateCustomOrderStatus,
    deleteCustomOrder,
    addProcurement,
    updateProcurementStatus,
    deleteCustomerFolder,
    saveSettings,
  } = useDatabase()

  // UI State
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [prefilledFile, setPrefilledFile] = useState<InboxFile | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('')
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<ProductionOrder | null>(null)
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false)
  const [showAiAssistantModal, setShowAiAssistantModal] = useState<boolean>(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [deleteModalDetails, setDeleteModalDetails] = useState<DeleteModalItemDetails | null>(null)
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<(() => void) | null>(null)

  // Counts
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan'
  ).length
  const lowStockCount = materials.filter((m) => m.status !== 'Aman').length
  const pendingCustomOrdersCount = customOrders.filter(
    (o) => o.status !== 'Selesai' && o.status !== 'Sudah Diambil'
  ).length

  // Handlers
  const handleAddOrder = useCallback(
    async (newOrder: ProductionOrder) => {
      await addOrder(newOrder)

      if (newOrder.paidAmount > 0) {
        const now = new Date()
        const newTrx: FinanceTransaction = {
          id: 'TRX-' + Date.now(),
          transNo:
            'TRX-' +
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            '-' +
            Math.floor(10 + Math.random() * 90),
          date:
            now.toISOString().split('T')[0] +
            ' ' +
            now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          type: 'Pemasukan',
          category: 'Penjualan Cetak',
          description: `Pembayaran ${newOrder.paymentStatus} Order No ${newOrder.orderNo} (${newOrder.customerName})`,
          amount: newOrder.paidAmount,
          refOrderNo: newOrder.orderNo,
          paymentMethod: newOrder.paymentMethod || 'Cash',
          operator: settings.activeShiftOperator,
          status: 'Berhasil',
        }
        await addTransaction(newTrx)
      }

      setShowNewOrderModal(false)
      setActiveReceiptOrder(newOrder)
    },
    [addOrder, addTransaction, settings.activeShiftOperator]
  )

  const handleUpdateInboxFileStatus = useCallback(
    async (id: string, newStatus: InboxFileStatus) => {
      await updateInboxFileStatus(id, newStatus)
    },
    [updateInboxFileStatus]
  )

  const handleRecordPayment = useCallback(
    async (orderId: string, amount: number) => {
      await recordPayment(orderId, amount)
    },
    [recordPayment]
  )

  const handleUpdateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus, note?: string) => {
      await updateOrderStatus(orderId, newStatus, note)
    },
    [updateOrderStatus]
  )

  const handleCreateTransactionFromFile = useCallback(
    (file: InboxFile) => {
      handleUpdateInboxFileStatus(file.id, 'Menjadi Order')
      setPrefilledFile(file)
      setCurrentPage('kasir')
    },
    [handleUpdateInboxFileStatus]
  )

  const handleAddInboxFile = useCallback(
    async (newFile: InboxFile) => {
      await addInboxFile(newFile)
    },
    [addInboxFile]
  )

  const handleAddCustomOrder = useCallback(
    async (order: CustomOrder) => {
      await addCustomOrder(order)

      if (order.sellingPrice > 0) {
        const now = new Date()
        const newTrx: FinanceTransaction = {
          id: 'TRX-' + Date.now(),
          transNo:
            'TRX-' +
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            '-' +
            Math.floor(10 + Math.random() * 90),
          date:
            now.toISOString().split('T')[0] +
            ' ' +
            now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          type: 'Pemasukan',
          category: 'Penjualan Cetak',
          description: `Custom Order: ${order.orderName} - ${order.customerName}`,
          amount: order.sellingPrice,
          refOrderNo: order.orderNo,
          paymentMethod: 'Cash',
          operator: settings.activeShiftOperator,
          status: 'Berhasil',
        }
        await addTransaction(newTrx)
      }
    },
    [addCustomOrder, addTransaction, settings.activeShiftOperator]
  )

  const handleUpdateCustomOrderStatus = useCallback(
    async (orderId: string, newStatus: CustomOrderStatus, note?: string) => {
      await updateCustomOrderStatus(orderId, newStatus, note)
    },
    [updateCustomOrderStatus]
  )

  const triggerDeleteModal = (details: DeleteModalItemDetails, action: () => void) => {
    setDeleteModalDetails(details)
    setDeleteConfirmAction(() => action)
    setDeleteModalOpen(true)
  }

  const handleDeleteOrder = (order: ProductionOrder) => {
    triggerDeleteModal(
      {
        id: order.id,
        category: 'Pesanan Produksi',
        title: order.orderNo,
        customerName: order.customerName,
        date: order.orderDate,
        amount: 'Rp ' + order.totalAmount.toLocaleString('id-ID'),
        warningNote:
          order.status === 'Selesai' ? 'Order yang sudah selesai akan dihapus permanen.' : undefined,
      },
      async () => {
        await deleteOrder(order.id)
      }
    )
  }

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
      async () => {
        await deleteTransaction(trx.id)
      }
    )
  }

  const handleDeleteInboxFile = (file: InboxFile) => {
    triggerDeleteModal(
      {
        id: file.id,
        category: 'File Inbox / Upload',
        title: file.fileName,
        customerName: file.customerName,
        date: file.uploadDate,
      },
      async () => {
        await deleteInboxFile(file.id)
      }
    )
  }

  const handleDeleteCustomerFolder = (folder: CustomerFile) => {
    triggerDeleteModal(
      {
        id: folder.id,
        category: 'Customer & File',
        title: folder.customerName,
        customerName: folder.category,
        date: new Date().toLocaleDateString('id-ID'),
      },
      async () => {
        await deleteCustomerFolder(folder.id)
      }
    )
  }

  const handleDeleteProduct = (product: Product) => {
    triggerDeleteModal(
      {
        id: product.id,
        category: 'Produk / Jasa',
        title: product.name,
        customerName: `Kode: ${product.code}`,
        amount: 'Rp ' + product.basePrice.toLocaleString('id-ID'),
      },
      async () => {
        await deleteProduct(product.id)
      }
    )
  }

  const handleDeleteTool = (tool: ToolInventory) => {
    triggerDeleteModal(
      {
        id: tool.id,
        category: 'Inventaris Alat / Mesin',
        title: tool.name,
        customerName: `Lokasi: ${tool.location} • PIC: ${tool.picName}`,
      },
      async () => {
        await deleteTool(tool.id)
      }
    )
  }

  const handleDeleteMaterial = (material: MaterialStock) => {
    triggerDeleteModal(
      {
        id: material.id,
        category: 'Stok Bahan',
        title: material.name,
        customerName: `Supplier: ${material.supplier}`,
        amount: 'Rp ' + material.unitPrice.toLocaleString('id-ID'),
      },
      async () => {
        await deleteMaterial(material.id)
      }
    )
  }

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
      async () => {
        await deleteCustomOrder(order.id)
      }
    )
  }

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
        // Procurement deletion is not implemented in this version
      }
    )
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F8FC]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Memuat data dari Supabase...</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  // Public upload page
  if (currentPage === 'public_upload') {
    return (
      <PublicUploadView
        onAddInboxFile={handleAddInboxFile}
        onGoToInbox={() => setCurrentPage('file_inbox')}
      />
    )
  }

  return (
    <div className="flex h-screen bg-[#F8F8FC] font-sans text-slate-800 antialiased overflow-hidden">
      {/* Supabase connection indicator */}
      <div
        className={`fixed top-2 right-2 z-50 px-3 py-1 rounded-full text-xs font-medium ${
          isConnected
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        }`}
      >
        {isConnected ? '🟢 Supabase Connected' : '🟡 Using Local Data'}
      </div>

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
              onAddProduct={addProduct}
              onUpdateProduct={updateProduct}
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
              onAddTransaction={addTransaction}
              operatorName={settings.activeShiftOperator}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentPage === 'laporan' && <LaporanView orders={orders} transactions={transactions} />}

          {currentPage === 'pengadaan' && (
            <PengadaanView
              procurements={procurements}
              onAddProcurement={addProcurement}
              onUpdateProcurementStatus={updateProcurementStatus}
            />
          )}

          {currentPage === 'pengaturan' && <PengaturanView settings={settings} onSaveSettings={saveSettings} />}
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
            setDeleteModalOpen(false)
            setDeleteModalDetails(null)
            setDeleteConfirmAction(null)
          }}
          onConfirm={() => {
            if (deleteConfirmAction) {
              deleteConfirmAction()
            }
            setDeleteModalOpen(false)
            setDeleteModalDetails(null)
            setDeleteConfirmAction(null)
          }}
        />
      )}
    </div>
  )
}

export default AppWithDatabase
