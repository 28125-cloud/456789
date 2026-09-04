import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Download,
  Printer,
  Scale,
  Percent,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { sales, products, showToast } = useApp();

  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');

  const completedSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return sales.filter((s) => {
      if (s.status !== 'completed') return false;
      if (dateRange === 'today') return s.created_at.startsWith(todayStr);
      if (dateRange === '7days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        return new Date(s.created_at) >= d7;
      }
      if (dateRange === '30days') {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        return new Date(s.created_at) >= d30;
      }
      return true;
    });
  }, [sales, dateRange]);

  // Calculations
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = completedSales.reduce((sum, s) => sum + s.cost, 0);
  const totalProfit = completedSales.reduce((sum, s) => sum + s.profit, 0);
  const marginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const totalWeightSold = completedSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0);
  }, 0);

  // Top Selling Table
  const topProducts = useMemo(() => {
    const map: {
      [id: string]: {
        name: string;
        weight: number;
        revenue: number;
        cost: number;
        profit: number;
      };
    } = {};

    completedSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!map[item.product_id]) {
          map[item.product_id] = {
            name: item.product_name,
            weight: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        const itemCost = (item.cost_price || 0) * item.quantity;
        const itemProfit = item.total - itemCost;

        map[item.product_id].weight += item.quantity;
        map[item.product_id].revenue += item.total;
        map[item.product_id].cost += itemCost;
        map[item.product_id].profit += itemProfit;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [completedSales]);

  // Payment Breakdown Pie
  const paymentBreakdown = useMemo(() => {
    const map: { [key: string]: number } = { cash: 0, qr: 0, transfer: 0 };
    completedSales.forEach((s) => {
      map[s.payment_method] = (map[s.payment_method] || 0) + s.total;
    });

    return [
      { name: 'เงินสด (Cash)', value: map.cash, color: '#10b981' },
      { name: 'พร้อมเพย์ QR', value: map.qr, color: '#3b82f6' },
      { name: 'โอนเงินธนาคาร', value: map.transfer, color: '#8b5cf6' },
    ];
  }, [completedSales]);

  // Inventory valuation
  const inventoryValuation = useMemo(() => {
    const totalCostValue = products.reduce((acc, p) => acc + p.stock_quantity * p.cost_price, 0);
    const totalSalesValue = products.reduce((acc, p) => acc + p.stock_quantity * p.selling_price, 0);
    const potentialProfit = totalSalesValue - totalCostValue;
    return { totalCostValue, totalSalesValue, potentialProfit };
  }, [products]);

  const handleExportCSV = () => {
    const headers = ['ชื่อสินค้า', 'น้ำหนักขายได้ (กก.)', 'ยอดขายรวม (บาท)', 'ต้นทุนรวม (บาท)', 'กำไรรวม (บาท)', 'อัตรากำไร %'];
    const rows = topProducts.map((p) => [
      p.name,
      p.weight.toFixed(2),
      p.revenue.toFixed(2),
      p.cost.toFixed(2),
      p.profit.toFixed(2),
      p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meat_shop_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ดาวน์โหลดรายงานฉบับสมบูรณ์เรียบร้อยแล้ว', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">รายงานและการวิเคราะห์ (Reports)</h2>
          <p className="text-xs text-slate-500">สรุปผลประกอบการ กำไรสุทธิ สินค้าขายดี และมูลค่าสินค้าคงคลัง</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range filter */}
          <select
            value={dateRange}
            onChange={(e: any) => setDateRange(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">ข้อมูลทั้งหมด</option>
            <option value="today">วันนี้</option>
            <option value="7days">7 วันล่าสุด</option>
            <option value="30days">30 วันล่าสุด</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ยอดขายรวม</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">จาก {completedSales.length} บิลที่สำเร็จ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ต้นทุนขายรวม</span>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            ฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">คำนวณจากต้นทุนสินค้า</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-emerald-700 font-medium">กำไรสุทธิ (Gross Profit)</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ฿{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">อัตรากำไร: {marginPercent}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">น้ำหนักเนื้อสัตว์ที่ขายได้</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalWeightSold.toFixed(1)} กก.</p>
          <span className="text-[11px] text-slate-400">เฉลี่ยต่อบิล {(totalWeightSold / (completedSales.length || 1)).toFixed(1)} กก.</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">มูลค่าสต็อกในคลัง</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            ฿{inventoryValuation.totalCostValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-400">ขายหมดได้ ฿{inventoryValuation.totalSalesValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Chart Row: Top 5 Sellers & Payment method breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top selling revenue chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">ยอดขายแยกตามสินค้า (Top Selling Meat)</h3>
          <p className="text-xs text-slate-500 mb-4">เปรียบเทียบยอดขายรวม (บาท) และกำไรของแต่ละรายการ</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.slice(0, 6)} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="ยอดขาย" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="กำไร" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">สัดส่วนการชำระเงิน</h3>
            <p className="text-xs text-slate-500 mb-2">ช่องทางที่ลูกค้าเลือกจ่าย</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {paymentBreakdown.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900">฿{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Detailed Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">ตารางวิเคราะห์กำไรรายสินค้า (Product Profitability)</h3>
            <p className="text-xs text-slate-500">เรียงตามยอดขายรวม และแสดงสัดส่วนกำไรต่อชิ้น</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">อันดับ</th>
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3 text-center">น้ำหนักรวมที่ขาย</th>
                <th className="px-4 py-3 text-right">ยอดขายรวม</th>
                <th className="px-4 py-3 text-right">ต้นทุนรวม</th>
                <th className="px-4 py-3 text-right">กำไรสุทธิ</th>
                <th className="px-4 py-3 text-center">มาร์จิ้น (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ยังไม่มีข้อมูลยอดขาย
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => {
                  const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={p.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-center font-mono font-medium text-slate-800">
                        {p.weight.toFixed(2)} กก.
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ฿{p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ฿{p.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        +฿{p.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
