import React, { useState, useEffect } from 'react';
import { Customer, PaymentMethod, Sale } from '../types';
import { useApp } from '../context/AppContext';
import { recordSale } from '../services/db';
import {
  Banknote,
  Building2,
  QrCode,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Coins,
  Scale,
  ShoppingBag,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (sale: Sale) => void;
  selectedCustomer: Customer | null;
  overallDiscount: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  selectedCustomer,
  overallDiscount,
}) => {
  const { cart, cartTotals, currentUser, showToast, refreshData, settings } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saleNote, setSaleNote] = useState<string>('');

  const netTotal = Math.max(0, Number((cartTotals.subtotal - overallDiscount).toFixed(2)));

  // Preset cash buttons
  const cashAmount = parseFloat(cashReceivedInput) || 0;
  const changeAmount = Math.max(0, Number((cashAmount - netTotal).toFixed(2)));

  useEffect(() => {
    if (isOpen) {
      if (paymentMethod === 'cash') {
        setCashReceivedInput(netTotal.toString());
      } else {
        setCashReceivedInput(netTotal.toString());
      }
      setErrorMsg('');
      setIsProcessing(false);
    }
  }, [isOpen, netTotal, paymentMethod]);

  if (!isOpen) return null;

  const handleSetQuickCash = (amount: number) => {
    setCashReceivedInput(amount.toString());
    setErrorMsg('');
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      setErrorMsg('ไม่มีสินค้าในตะกร้า');
      return;
    }

    if (!currentUser) {
      setErrorMsg('กรุณาเข้าสู่ระบบพนักงานก่อนทำรายการขาย');
      return;
    }

    const paid = parseFloat(cashReceivedInput);
    if (isNaN(paid) || paid <= 0) {
      setErrorMsg('กรุณาระบุจำนวนเงินที่รับให้ถูกต้อง');
      return;
    }

    if (paid < netTotal) {
      setErrorMsg(`จำนวนเงินที่รับ (฿${paid.toLocaleString()}) น้อยกว่ายอดชำระสุทธิ (฿${netTotal.toLocaleString()})`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const recordedSale = await recordSale({
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'ลูกค้าทั่วไป (Walk-in)',
        customer_phone: selectedCustomer?.phone || '-',
        employee_id: currentUser.id,
        employee_name: currentUser.full_name,
        items: cart,
        payment_method: paymentMethod,
        paid_amount: paid,
        change_amount: changeAmount,
        discount: overallDiscount,
        note: saleNote.trim() || undefined,
      });

      await refreshData();
      showToast(`บันทึกการขายสำเร็จ! เลขที่ใบเสร็จ: ${recordedSale.invoice_number}`, 'success');
      onPaymentSuccess(recordedSale);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกการขาย');
      showToast('เกิดข้อผิดพลาดในการบันทึกการขาย', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="checkout-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">ชำระเงิน (Checkout)</h3>
              <p className="text-xs text-slate-400">
                ลูกค้า: {selectedCustomer ? selectedCustomer.name : 'ลูกค้าทั่วไป (Walk-in)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Order Summary Pill */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-rose-600" />
                รายการสินค้า {cartTotals.itemCount} รายการ
              </span>
              <span className="flex items-center gap-1">
                <Scale className="w-4 h-4 text-slate-600" />
                น้ำหนักรวม: <strong className="text-slate-800">{cartTotals.totalWeight} กก.</strong>
              </span>
            </div>

            <div className="space-y-1.5 text-xs divide-y divide-slate-200/60 max-h-32 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-1.5 first:pt-0 flex justify-between items-center">
                  <span className="text-slate-700 font-medium truncate max-w-[280px]">
                    {item.product.name} ({item.quantity} {item.product.unit})
                  </span>
                  <span className="text-slate-900 font-semibold">฿{item.total.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <div>
                <span className="text-xs text-slate-500">ยอดชำระสุทธิ:</span>
                {overallDiscount > 0 && (
                  <span className="ml-2 text-xs text-rose-600">(ลด ฿{overallDiscount.toLocaleString()})</span>
                )}
              </div>
              <span className="text-2xl font-bold text-rose-600">
                ฿{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              เลือกวิธีชำระเงิน
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setCashReceivedInput(netTotal.toString());
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1 text-emerald-600" />
                <span className="text-xs">เงินสด (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('qr');
                  setCashReceivedInput(netTotal.toString());
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'qr'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <QrCode className="w-6 h-6 mb-1 text-blue-600" />
                <span className="text-xs">พร้อมเพย์ QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transfer');
                  setCashReceivedInput(netTotal.toString());
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'transfer'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <Building2 className="w-6 h-6 mb-1 text-indigo-600" />
                <span className="text-xs">โอนเงินธนาคาร</span>
              </button>
            </div>
          </div>

          {/* QR Payment View if selected */}
          {paymentMethod === 'qr' && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col items-center text-center">
              <div className="bg-white p-3 rounded-xl shadow-inner mb-3">
                {/* Visual Thai QR Generator Representation */}
                <div className="w-44 h-44 bg-white flex flex-col items-center justify-center border-4 border-slate-900 relative">
                  <div className="absolute top-1 left-1 w-6 h-6 border-4 border-slate-900"></div>
                  <div className="absolute top-1 right-1 w-6 h-6 border-4 border-slate-900"></div>
                  <div className="absolute bottom-1 left-1 w-6 h-6 border-4 border-slate-900"></div>
                  <QrCode className="w-28 h-28 text-slate-900" />
                  <span className="text-[10px] font-bold text-blue-700 mt-1 uppercase tracking-widest">PROMPTPAY</span>
                </div>
              </div>
              <p className="text-xs text-slate-300">สแกนชำระผ่านแอปธนาคารใดก็ได้</p>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                พร้อมเพย์: {settings.promptpay_id} ({settings.shop_name})
              </p>
              <p className="text-base font-bold text-white mt-1">ยอดชำระ: ฿{netTotal.toLocaleString()}</p>
            </div>
          )}

          {/* Cash Received & Change Calculator */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">จำนวนเงินที่รับ (บาท):</label>
                {paymentMethod === 'cash' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(netTotal)}
                      className="px-2 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      พอดี (฿{netTotal.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(100)}
                      className="px-2 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(500)}
                      className="px-2 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(1000)}
                      className="px-2 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      1,000
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Coins className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  step="any"
                  id="input-cash-received"
                  value={cashReceivedInput}
                  onChange={(e) => {
                    setCashReceivedInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Change Display */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
              <span className="text-xs font-medium text-slate-600">เงินทอน (Change):</span>
              <span
                id="display-change-amount"
                className={`text-xl font-bold ${changeAmount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}
              >
                ฿{changeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">หมายเหตุการขาย (ถ้ามี):</label>
            <input
              type="text"
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder="เช่น ลูกค้าขอหั่นชิ้นหนา, แยกถุง 2 กก."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            id="btn-confirm-payment"
            onClick={handlePayment}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>กำลังบันทึกและตัดสต็อก...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันการชำระเงิน ฿{netTotal.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
