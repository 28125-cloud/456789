import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StockInRecord } from '../types';
import { recordStockIn, getStockInRecords } from '../services/db';
import {
  PackagePlus,
  Scale,
  DollarSign,
  Building,
  Calendar,
  CheckCircle2,
  FileText,
  History,
  Truck,
  Sparkles,
} from 'lucide-react';

export const StockInView: React.FC = () => {
  const { products, currentUser, refreshData, showToast } = useApp();

  const [records, setRecords] = useState<StockInRecord[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(20);
  const [costPrice, setCostPrice] = useState<number>(180);
  const [supplier, setSupplier] = useState<string>('ฟาร์มมาตรฐานสุพรรณบุรี');
  const [lotNumber, setLotNumber] = useState<string>(`LOT-${Date.now().toString().slice(-6)}`);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadRecords();
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setCostPrice(products[0].cost_price);
    }
  }, [products]);

  const loadRecords = async () => {
    const list = await getStockInRecords();
    setRecords(list);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setCostPrice(prod.cost_price);
    }
  };

  const totalCost = Number((quantity * costPrice).toFixed(2));
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('กรุณาเลือกสินค้าที่ต้องการรับเข้า', 'error');
      return;
    }

    if (quantity <= 0) {
      showToast('จำนวนที่รับเข้าต้องมากกว่า 0', 'error');
      return;
    }

    if (costPrice < 0) {
      showToast('ราคาทุนต้องไม่ต่ำกว่า 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordStockIn({
        product_id: selectedProductId,
        quantity: Number(quantity),
        cost_price: Number(costPrice),
        supplier: supplier.trim() || undefined,
        lot_number: lotNumber.trim() || undefined,
        note: note.trim() || undefined,
        created_by: currentUser?.id,
        created_by_name: currentUser?.full_name,
      });

      await refreshData();
      await loadRecords();
      showToast(`รับสินค้า "${selectedProduct?.name}" จำนวน ${quantity} ${selectedProduct?.unit} เข้าสต็อกสำเร็จ!`, 'success');

      // Reset form
      setQuantity(20);
      setLotNumber(`LOT-${Date.now().toString().slice(-6)}`);
      setNote('');
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการรับสินค้าเข้า', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">รับสินค้าเข้าสต็อก (Stock In)</h2>
        <p className="text-xs text-slate-500">
          บันทึกการรับเนื้อสัตว์จากซัพพลายเออร์หรือโรงชำแหละ อัปเดตราคาทุน และเพิ่มยอดสต็อกอัตโนมัติ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">ฟอร์มบันทึกรับเข้า</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกสินค้าเนื้อสัตว์ *</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (คงเหลือปัจจุบัน {p.stock_quantity} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock Preview */}
            {selectedProduct && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-500">สต็อกคงเหลือปัจจุบัน:</span>
                <span className="font-bold text-slate-800">
                  {selectedProduct.stock_quantity} {selectedProduct.unit}
                </span>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวน/น้ำหนักที่รับเข้า ({selectedProduct?.unit || 'กก.'}) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Scale className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-9 pr-4 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ราคาทุนต่อหน่วย (บาท/{selectedProduct?.unit || 'กก.'}) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-9 pr-4 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Total Cost Calculation Display */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-emerald-800 block">มูลค่าทุนรวมของรอบนี้:</span>
                <span className="text-xs text-emerald-700">
                  {quantity} {selectedProduct?.unit} × ฿{costPrice}
                </span>
              </div>
              <span className="text-lg font-bold text-emerald-900">
                ฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ซัพพลายเออร์ / แหล่งที่มา</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Truck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="เช่น ฟาร์มโชคชัย, เบทาโกร"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Lot Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเลข Lot สินค้า</label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="LOT-2026-001"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น เนื้อเกรด A แช่เย็น 0-4 องศา"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-submit-stock-in"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันรับสินค้าเข้าสต็อก'}</span>
            </button>
          </form>
        </div>

        {/* History of Stock In Records */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-sm text-slate-900">ประวัติการรับสินค้าเข้าสต็อกล่าสุด</h3>
            </div>
            <span className="text-xs text-slate-500">{records.length} รายการ</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3 text-center">จำนวนที่รับ</th>
                  <th className="px-4 py-3 text-right">ทุน/หน่วย</th>
                  <th className="px-4 py-3 text-right">มูลค่ารวม</th>
                  <th className="px-4 py-3">ซัพพลายเออร์</th>
                  <th className="px-4 py-3">Lot No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      ยังไม่มีประวัติการรับสินค้าเข้า
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {new Date(rec.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{rec.product_name}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        +{rec.quantity} กก.
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ฿{rec.cost_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ฿{rec.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rec.supplier || '-'}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{rec.lot_number || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
