import React from 'react';
import { ProductionOrder, SystemSettings } from '../../types';

interface ReceiptModalProps {
  order: ProductionOrder | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">receipt_long</span>
            <h3 className="font-extrabold text-sm tracking-tight">Cetak Nota Transaksi</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Receipt Content Container (Scrollable Preview) */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          {/* Paper Thermal Receipt Box */}
          <div
            id="printable-receipt"
            className="bg-white p-5 rounded-xl shadow-md border border-slate-200 text-slate-800 text-xs w-[80mm] min-h-[400px] font-mono leading-tight"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-extrabold text-sm uppercase text-slate-900">
                {settings.tefaName}
              </h2>
              <p className="font-bold text-[10px] text-slate-600">{settings.schoolName}</p>
              <p className="text-[9px] text-slate-500 mt-1 leading-tight">{settings.address}</p>
              <p className="text-[9px] text-slate-500">Telp/WA: {settings.phone}</p>
            </div>

            {/* Order Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{order.orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold truncate max-w-[150px]">{order.customerName}</span>
              </div>
              {order.institution && (
                <div className="flex justify-between">
                  <span>Instansi:</span>
                  <span className="truncate max-w-[150px]">{order.institution}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Kasir/Operator:</span>
                <span>{order.operatorName}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <p className="font-bold text-[10px] uppercase mb-1">Rincian Pesanan:</p>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-[10px]">
                    <p className="font-bold">{item.productName}</p>
                    {item.calculatedArea ? (
                      <p className="text-[9px] text-slate-500">
                        Dimensi: {item.lengthMeters}m x {item.widthMeters}m = {item.calculatedArea} m²
                      </p>
                    ) : null}
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {item.qty} {item.unit} x {formatRupiah(item.unitPrice)}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatRupiah(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Payment Status */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Metode Bayar:</span>
                <span className="font-bold">{order.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar/DP:</span>
                <span>{formatRupiah(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Sisa/Piutang:</span>
                <span className={order.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  {formatRupiah(order.balanceDue)}
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 pt-1">
                <span>Status Pembayaran:</span>
                <span className="font-bold uppercase tracking-wider">{order.paymentStatus}</span>
              </div>
            </div>

            {/* Footer Text */}
            <div className="pt-3 text-center text-[9px] text-slate-600 leading-tight space-y-1">
              <p className="italic">{settings.receiptFooterText}</p>
              <p className="font-bold pt-1">*** SIMPAN NOTA INI SAAT PENGAMBILAN BARANG ***</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Tutup
          </button>
          <button
            id="btn-trigger-print-receipt"
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Cetak Nota Thermal (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
