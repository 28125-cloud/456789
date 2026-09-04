import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sale } from '../types';
import {
  Banknote,
  Receipt,
  TrendingUp,
  Package,
  AlertTriangle,
  XCircle,
  PlusCircle,
  ArrowUpRight,
  ShoppingCart,
  Boxes,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (page: any) => void;
  onViewReceipt: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onViewReceipt }) => {
  const { sales, products, categories, customers } = useApp();

  // Today calculations
  const todayDateStr = new Date().toISOString().split('T')[0];

  const todaySales = useMemo(() => {
    return sales.filter((s) => s.created_at.startsWith(todayDateStr) && s.status === 'completed');
  }, [sales, todayDateStr]);

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayCost = todaySales.reduce((sum, s) => sum + s.cost, 0);
  const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
  const todayBillsCount = todaySales.length;

  // Stock inventory metrics
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.stock_quantity <= 0);
  }, [products]);

  // Graph 1: 7-day sales and profit
  const last7DaysData = useMemo(() => {
    const days: { [key: string]: { date: string; displayDate: string; sales: number; profit: number; cost: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      days[iso] = { date: iso, displayDate: display, sales: 0, profit: 0, cost: 0 };
    }

    sales.forEach((s) => {
      if (s.status !== 'completed') return;
      const dayKey = s.created_at.split('T')[0];
      if (days[dayKey]) {
        days[dayKey].sales += s.total;
        days[dayKey].profit += s.profit;
        days[dayKey].cost += s.cost;
      }
    });

    return Object.values(days);
  }, [sales]);

  // Graph 2: Top selling products by revenue and weight
  const topSellingProductsData = useMemo(() => {
    const map: { [prodId: string]: { name: string; quantity: number; revenue: number } } = {};

    sales.forEach((s) => {
      if (s.status !== 'completed') return;
      s.items.forEach((item) => {
        if (!map[item.product_id]) {
          map[item.product_id] = {
            name: item.product_name.length > 14 ? item.product_name.slice(0, 14) + '...' : item.product_name,
            quantity: 0,
            revenue: 0,
          };
        }
        map[item.product_id].quantity += item.quantity;
        map[item.product_id].revenue += item.total;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  // Graph 3: Monthly trend comparison (last 4 months)
  const monthlyData = useMemo(() => {
    const months = [
      { month: 'มิ.ย.', sales: 45000, profit: 13500 },
      { month: 'ก.ค.', sales: 58000, profit: 18200 },
      { month: 'ส.ค.', sales: 62400, profit: 19800 },
      { month: 'ก.ย. (ปัจจุบัน)', sales: Math.max(38000, todayRevenue * 15), profit: Math.max(12000, todayProfit * 15) },
    ];
    return months;
  }, [todayRevenue, todayProfit]);

  // Recent 5 sales
  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  }, [sales]);

  const COLORS = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick POS Launch */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-rose-800/30">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            ระบบขายหน้าร้านพร้อมทำงาน
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Meat Shop POS & Inventory</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            จัดการยอดขาย ชั่งน้ำหนักเนื้อสัตว์ ออกใบเสร็จ ตัดสต็อกอัตโนมัติ และดูสรุปกำไรแบบเรียลไทม์
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('pos')}
            id="btn-dash-quick-pos"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-950 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>เปิดหน้าขาย POS</span>
          </button>
          <button
            onClick={() => onNavigate('stock-in')}
            id="btn-dash-quick-stockin"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>รับสินค้าเข้า</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Alert Banner (if any) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                แจ้งเตือน: สินค้าใกล้หมดสต็อก {lowStockProducts.length} รายการ!
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockProducts.map((p) => `${p.name} (เหลือ ${p.stock_quantity} ${p.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('stock-in')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
          >
            ไปหน้ารับสินค้าเข้าด่วน
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Today Sales */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ยอดขายวันนี้</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">
              ฿{todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>จากบิลสำเร็จ {todayBillsCount} บิล</span>
            </p>
          </div>
        </div>

        {/* Today Bills */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">จำนวนบิลวันนี้</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{todayBillsCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">รายการขายวันนี้</p>
          </div>
        </div>

        {/* Today Profit */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">กำไรสุทธิวันนี้</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-600">
              ฿{todayProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              ต้นทุนวันนี้: ฿{todayCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">สินค้าในระบบ</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">รายการ</p>
          </div>
        </div>

        {/* Stock Status (Low & Out) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">สถานะสต็อก</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-700 font-medium">🟡 ใกล้หมด:</span>
              <span className="font-bold text-amber-900">{lowStockProducts.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-700 font-medium">🔴 หมด:</span>
              <span className="font-bold text-rose-900">{outOfStockProducts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Row 1: 7-Day Trend & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales & Profit Line/Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">ยอดขายและกำไร 7 วันล่าสุด</h3>
              <p className="text-xs text-slate-500">เปรียบเทียบยอดขายสุทธิและกำไรรายวัน</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> ยอดขาย
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> กำไร
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sales" name="ยอดขาย" stroke="#e11d48" strokeWidth={2.5} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="profit" name="กำไร" stroke="#10b981" strokeWidth={2.5} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Meat Products Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">สินค้าขายดี (Top Sellers)</h3>
            <p className="text-xs text-slate-500 mb-4">จัดอันดับตามยอดขายรวม (บาท)</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellingProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'ยอดขาย']}
                    contentStyle={{ borderRadius: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#e11d48" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="w-full mt-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-center cursor-pointer"
          >
            ดูรายงานสินค้าขายดีทั้งหมด →
          </button>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">รายการขายล่าสุด (Recent Sales)</h3>
            <p className="text-xs text-slate-500">บิลที่เกิดขึ้นล่าสุดในระบบ</p>
          </div>
          <button
            onClick={() => onNavigate('sales-history')}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            ดูประวัติทั้งหมด <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">เลขที่บิล</th>
                <th className="px-4 py-3">วันที่-เวลา</th>
                <th className="px-4 py-3">ลูกค้า</th>
                <th className="px-4 py-3">จำนวนสินค้า</th>
                <th className="px-4 py-3 text-right">ยอดรวม</th>
                <th className="px-4 py-3 text-center">วิธีชำระ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    ยังไม่มีรายการขายในระบบ
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{sale.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(sale.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(sale.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{sale.customer_name || 'ลูกค้าทั่วไป'}</td>
                    <td className="px-4 py-3">
                      {sale.items.reduce((sum, i) => sum + i.quantity, 0).toFixed(1)} กก. ({sale.items.length} ชิ้น)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ฿{sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {sale.payment_method === 'cash' ? 'เงินสด' : sale.payment_method === 'qr' ? 'พร้อมเพย์' : 'โอนเงิน'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          sale.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.status === 'completed' ? 'สำเร็จ' : 'ยกเลิก'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ดูใบเสร็จ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
