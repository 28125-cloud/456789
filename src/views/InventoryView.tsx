import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, StockTransaction } from '../types';
import { getStockTransactions, recordStockAdjustment } from '../services/db';
import {
  Boxes,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  X,
  PlusCircle,
  MinusCircle,
  FileText,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, currentUser, refreshData, showToast, isAdmin } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'stocks' | 'logs'>('stocks');

  // Audit transactions state
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [selectedProductForLogs, setSelectedProductForLogs] = useState<string>('');

  // Adjustment modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  useEffect(() => {
    loadTransactions();
  }, [selectedProductForLogs]);

  const loadTransactions = async () => {
    try {
      const data = await getStockTransactions(selectedProductForLogs || undefined);
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [products, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalItems = products.length;
    const available = products.filter((p) => p.status === 'AVAILABLE').length;
    const lowStock = products.filter((p) => p.status === 'LOW_STOCK').length;
    const outOfStock = products.filter((p) => p.status === 'OUT_OF_STOCK').length;
    const totalWeight = products.reduce((acc, p) => acc + p.stock_quantity, 0);

    return { totalItems, available, lowStock, outOfStock, totalWeight };
  }, [products]);

  const handleOpenAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setNewStockInput(product.stock_quantity);
    setAdjustReason('ตรวจนับสต็อกตามรอบ / ตักแต่งสูญเสีย');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !currentUser) return;

    if (newStockInput < 0) {
      showToast('จำนวนสต็อกต้องไม่ติดลบ', 'error');
      return;
    }

    setIsAdjusting(true);
    try {
      await recordStockAdjustment({
        product_id: adjustingProduct.id,
        new_quantity: Number(newStockInput),
        note: adjustReason || 'ปรับปรุงสต็อกหน้าร้าน',
        created_by: currentUser.id,
        created_by_name: currentUser.full_name,
      });

      await refreshData();
      await loadTransactions();
      showToast(`ปรับสต็อกสินค้า "${adjustingProduct.name}" เป็น ${newStockInput} ${adjustingProduct.unit} เรียบร้อย`, 'success');
      setAdjustingProduct(null);
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการปรับสต็อก', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบคลังสินค้าเนื้อสัตว์ (Inventory)</h2>
          <p className="text-xs text-slate-500">ตรวจสอบปริมาณคงเหลือ จุดแจ้งเตือน และประวัติการเคลื่อนไหวสต็อก</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stocks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายการคงเหลือ
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ประวัติการเคลื่อนไหว (Audit Logs)
          </button>
        </div>
      </div>

      {/* Overview Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">น้ำหนักเนื้อสัตว์รวมในคลัง</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalWeight.toFixed(1)} กก.</p>
          <span className="text-[11px] text-slate-400">จากสินค้า {stats.totalItems} รายการ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-emerald-700 font-medium">🟢 มีสินค้าเพียงพอ</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.available}</p>
          <span className="text-[11px] text-slate-400">สต็อก &gt; จุดเตือนขั้นต่ำ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-amber-700 font-medium">🟡 สินค้าใกล้หมด</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStock}</p>
          <span className="text-[11px] text-slate-400">สต็อก ≤ จุดเตือนขั้นต่ำ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-rose-700 font-medium">🔴 สินค้าหมดคลัง</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.outOfStock}</p>
          <span className="text-[11px] text-slate-400">สต็อก = 0 กก.</span>
        </div>
      </div>

      {activeTab === 'stocks' ? (
        <>
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า หรือรหัสสินค้า..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกสถานะ ({products.length})</option>
                <option value="AVAILABLE">🟢 มีสินค้าเพียงพอ ({stats.available})</option>
                <option value="LOW_STOCK">🟡 ใกล้หมด ({stats.lowStock})</option>
                <option value="OUT_OF_STOCK">🔴 หมดคลัง ({stats.outOfStock})</option>
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">รหัสสินค้า</th>
                    <th className="px-4 py-3.5">ชื่อสินค้า</th>
                    <th className="px-4 py-3.5 text-center">คงเหลือ (Balance)</th>
                    <th className="px-4 py-3.5 text-center">จุดเตือนสต็อกต่ำ</th>
                    <th className="px-4 py-3.5 text-center">สถานะ</th>
                    <th className="px-4 py-3.5 text-right">มูลค่าคงเหลือ (ทุน)</th>
                    {isAdmin && <th className="px-4 py-3.5 text-center">ปรับสต็อก</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        ไม่พบรายการสินค้าในคลัง
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const totalStockCost = p.stock_quantity * p.cost_price;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900">{p.product_code}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span
                              className={`text-sm font-bold ${
                                p.stock_quantity <= 0
                                  ? 'text-rose-600'
                                  : p.stock_quantity <= p.minimum_stock
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {p.stock_quantity}
                            </span>{' '}
                            <span className="text-slate-500">{p.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">
                            {p.minimum_stock} {p.unit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.status === 'AVAILABLE' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                🟢 มีสินค้า
                              </span>
                            )}
                            {p.status === 'LOW_STOCK' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                🟡 ใกล้หมด
                              </span>
                            )}
                            {p.status === 'OUT_OF_STOCK' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                                🔴 หมดคลัง
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                            ฿{totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleOpenAdjust(p)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>ปรับยอด</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* AUDIT TRANSACTIONS LOGS TAB */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">ประวัติการเคลื่อนไหวสต็อก (Stock Transactions)</h3>
              <p className="text-xs text-slate-500">บันทึกอัตโนมัติเมื่อมีการขาย, รับสินค้าเข้า, หรือปรับปรุงสต็อก</p>
            </div>

            <select
              value={selectedProductForLogs}
              onChange={(e) => setSelectedProductForLogs(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="">-- กรองตามสินค้าทั้งหมด --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.product_code})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">วันที่-เวลา</th>
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3 text-center">จำนวนการเปลี่ยนแปลง</th>
                  <th className="px-4 py-3 text-center">คงเหลือหลังทำรายการ</th>
                  <th className="px-4 py-3">เลขอ้างอิง / บิล</th>
                  <th className="px-4 py-3">ผู้ทำรายการ</th>
                  <th className="px-4 py-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      ยังไม่มีรายการประวัติสต็อก
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {new Date(tx.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {tx.type === 'IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <ArrowDownLeft className="w-3 h-3" /> รับเข้า (IN)
                          </span>
                        )}
                        {tx.type === 'OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <ArrowUpRight className="w-3 h-3" /> จ่ายออก (OUT)
                          </span>
                        )}
                        {tx.type === 'ADJUSTMENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            <SlidersHorizontal className="w-3 h-3" /> ปรับยอด (ADJ)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{tx.product_name}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        <span className={tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {tx.balance_after !== undefined ? tx.balance_after : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{tx.reference_id || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{tx.created_by_name || tx.created_by}</td>
                      <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">{tx.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">ปรับปรุงจำนวนสต็อก (Adjust Stock)</h3>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">สินค้า:</p>
                <p className="font-bold text-sm text-slate-900">{adjustingProduct.name}</p>
                <div className="flex justify-between text-xs text-slate-600 mt-2">
                  <span>สต็อกเดิมในระบบ:</span>
                  <span className="font-mono font-bold">
                    {adjustingProduct.stock_quantity} {adjustingProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนคงเหลือจริงที่ตรวจนับได้ ({adjustingProduct.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  ผลต่าง: {(newStockInput - adjustingProduct.stock_quantity).toFixed(2)} {adjustingProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สาเหตุการปรับปรุง *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  placeholder="เช่น ตัดแต่งสูญเสีย, ตรวจนับสต็อกสิ้นเดือน"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isAdjusting ? 'กำลังบันทึก...' : 'ยืนยันปรับสต็อก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
