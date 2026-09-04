import React from 'react';
import { Sale } from '../types';
import { useApp } from '../context/AppContext';
import { Printer, Download, ArrowLeft, CheckCircle, Store, Calendar, User, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings } = useApp();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getPaymentMethodThai = (method: string) => {
    switch (method) {
      case 'cash':
        return 'เงินสด (Cash)';
      case 'transfer':
        return 'โอนเงิน (Bank Transfer)';
      case 'qr':
        return 'พร้อมเพย์ QR (PromptPay)';
      default:
        return method;
    }
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white"
    >
      <div
        id="receipt-modal-card"
        className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none"
      >
        {/* Modal Action Header (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">การชำระเงินสำเร็จ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-print-receipt"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ใบเสร็จ
            </button>
            <button
              onClick={onClose}
              id="btn-close-receipt"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปขายสินค้า
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="receipt-paper" className="p-6 md:p-8 font-mono text-sm leading-relaxed">
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600 mb-2">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900">
              {settings.shop_name}
            </h2>
            <p className="text-xs font-sans text-rose-700 font-semibold">{settings.shop_name_th}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{settings.address}</p>
            <p className="text-xs text-slate-500">โทร: {settings.phone} | เลขประจำตัวผู้เสียภาษี: {settings.tax_id}</p>
          </div>

          {/* Receipt Info */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">เลขที่ใบเสร็จ:</span>
              <span className="font-bold text-slate-900">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">วันที่-เวลา:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">พนักงานขาย:</span>
              <span>{sale.employee_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ลูกค้า:</span>
              <span className="font-medium text-slate-800">{sale.customer_name || 'ลูกค้าทั่วไป'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 pb-1.5 border-b border-slate-200">
              <span className="col-span-6">รายการ</span>
              <span className="col-span-2 text-right">นน./จน.</span>
              <span className="col-span-2 text-right">ราคา/กก.</span>
              <span className="col-span-2 text-right">รวม (฿)</span>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {sale.items.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 text-xs py-1.5 items-center">
                  <div className="col-span-6 pr-1">
                    <p className="font-medium text-slate-800 leading-tight">{item.product_name}</p>
                    {item.discount > 0 && (
                      <span className="text-[10px] text-rose-500">ลด -฿{item.discount.toLocaleString()}</span>
                    )}
                  </div>
                  <span className="col-span-2 text-right text-slate-600">
                    {item.quantity} {item.unit || 'กก.'}
                  </span>
                  <span className="col-span-2 text-right text-slate-600">{item.unit_price.toLocaleString()}</span>
                  <span className="col-span-2 text-right font-semibold text-slate-900">
                    {item.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary / Calculation */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>ยอดรวมสินค้า (Subtotal):</span>
              <span>฿{sale.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>ส่วนลดท้ายบิล (Discount):</span>
                <span>-฿{sale.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>ยอดชำระสุทธิ (Net Total):</span>
              <span className="text-rose-600">฿{sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>ช่องทางชำระเงิน:</span>
              <span className="font-semibold text-slate-800">{getPaymentMethodThai(sale.payment_method)}</span>
            </div>
            <div className="flex justify-between">
              <span>จำนวนเงินที่รับ:</span>
              <span>฿{sale.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-900">
              <span>เงินทอน:</span>
              <span className="text-emerald-600">
                ฿{sale.change_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 text-center text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">{settings.receipt_footer}</p>
            <p className="text-[10px]">*** ขอบคุณที่ไว้วางใจ Meat Shop POS ***</p>
          </div>
        </div>

        {/* Modal Bottom Buttons (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>บันทึกและตัดสต็อกสินค้าเรียบร้อย</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              พิมพ์
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              เปิดการขายใหม่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
