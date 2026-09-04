import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sale } from '../types';
import { cancelSale } from '../services/db';
import {
  ReceiptText,
  Search,
  Calendar,
  Eye,
  Ban,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface SalesHistoryViewProps {
  onViewReceipt: (sale: Sale) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onViewReceipt }) => {
  const { sales, refreshData, showToast, isAdmin } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return sales
      .filter((sale) => {
        // Search
        const matchesSearch =
          sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));

        // Payment
        const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter;

        // Date
        let matchesDate = true;
        if (dateFilter === 'today') {
          matchesDate = sale.created_at.startsWith(todayStr);
        } else if (dateFilter === '7days') {
          const d7 = new Date();
          d7.setDate(d7.getDate() - 7);
          matchesDate = new Date(sale.created_at) >= d7;
        } else if (dateFilter === '30days') {
          const d30 = new Date();
          d30.setDate(d30.getDate() - 30);
          matchesDate = new Date(sale.created_at) >= d30;
        }

        return matchesSearch && matchesPayment && matchesDate;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sales, searchQuery, paymentFilter, dateFilter]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredSales
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  const handleCancelSale = async (id: string) => {
    try {
      await cancelSale(id, 'ลูกค้ายกเลิกคำสั่งซื้อ / คืนสินค้า');
      await refreshData();
      showToast('ยกเลิกบิลและคืนสต็อกสินค้าเรียบร้อยแล้ว', 'success');
      setCancellingSaleId(null);
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถยกเลิกบิลได้', 'error');
    }
  };

  const exportCSV = () => {
    if (filteredSales.length === 0) {
      showToast('ไม่มีข้อมูลที่จะส่งออก', 'error');
      return;
    }

    const headers = ['เลขที่บิล', 'วันที่', 'ลูกค้า', 'ยอดรวม', 'ต้นทุน', 'กำไร', 'วิธีชำระ', 'สถานะ'];
    const rows = filteredSales.map((s) => [
      s.invoice_number,
      new Date(s.created_at).toLocaleString('th-TH'),
      s.customer_name || 'ลูกค้าทั่วไป',
      s.total,
      s.cost,
      s.profit,
      s.payment_method,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meat_sales_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ประวัติการขาย (Sales History)</h2>
          <p className="text-xs text-slate-500">ตรวจสอบรายการขายย้อนหลัง พิมพ์ซ้ำใบเสร็จ และจัดการยกเลิกบิล</p>
        </div>

        <button
          onClick={exportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกรายงาน (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามเลขที่บิล หรือชื่อลูกค้า..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range filter */}
          <select
            value={dateFilter}
            onChange={(e: any) => setDateFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">ช่วงเวลาทั้งหมด</option>
            <option value="today">วันนี้</option>
            <option value="7days">7 วันล่าสุด</option>
            <option value="30days">30 วันล่าสุด</option>
          </select>

          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกช่องทางชำระ</option>
            <option value="cash">เงินสด (Cash)</option>
            <option value="qr">พร้อมเพย์ (QR)</option>
            <option value="transfer">โอนเงินธนาคาร</option>
          </select>
        </div>
      </div>

      {/* Total Filtered Revenue Strip */}
      <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs">
        <span className="text-rose-950 font-medium">
          ผลลัพธ์: พบ {filteredSales.length} รายการบิล
        </span>
        <div className="text-right">
          <span className="text-slate-600 mr-2">ยอดขายสุทธิที่กรองได้:</span>
          <span className="text-base font-bold text-rose-700 font-mono">
            ฿{totalFilteredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">เลขที่บิล</th>
                <th className="px-4 py-3.5">วันที่-เวลา</th>
                <th className="px-4 py-3.5">ลูกค้า</th>
                <th className="px-4 py-3.5">รายการเนื้อสัตว์</th>
                <th className="px-4 py-3.5 text-right">ยอดชำระ</th>
                <th className="px-4 py-3.5 text-center">วิธีชำระ</th>
                <th className="px-4 py-3.5 text-center">สถานะ</th>
                <th className="px-4 py-3.5">พนักงานขาย</th>
                <th className="px-4 py-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    ไม่พบบิลการขายที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{sale.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {new Date(sale.created_at).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{sale.customer_name || 'ลูกค้าทั่วไป'}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                      {sale.items.map((i) => `${i.product_name} (${i.quantity} กก.)`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ฿{sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {sale.payment_method === 'cash'
                          ? 'เงินสด'
                          : sale.payment_method === 'qr'
                          ? 'พร้อมเพย์'
                          : 'โอนเงิน'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sale.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> สำเร็จ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> ยกเลิก
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{sale.employee_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ดูและพิมพ์ใบเสร็จ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && sale.status === 'completed' && (
                          <button
                            onClick={() => setCancellingSaleId(sale.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ยกเลิกบิลและคืนสต็อก"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM CANCEL SALE MODAL */}
      {cancellingSaleId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการยกเลิกบิลขาย</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              การยกเลิกบิลนี้จะคืนสต็อกสินค้าทั้งหมดในบิลกลับเข้าคลัง และปรับลดยอดขายและกำไร
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setCancellingSaleId(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                ไม่ยกเลิก
              </button>
              <button
                onClick={() => handleCancelSale(cancellingSaleId)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl cursor-pointer shadow-sm"
              >
                ยืนยันยกเลิกบิล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
