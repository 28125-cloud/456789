import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  setSupabaseConfig,
  getSupabaseConfig,
  checkSupabaseConnection,
} from '../services/supabase';
import { resetToDemoData } from '../services/db';
import {
  Settings as SettingsIcon,
  Store,
  Database,
  QrCode,
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Server,
  Terminal,
  Layers,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast, refreshData, isSupabaseConfigured } = useApp();

  const [activeTab, setActiveTab] = useState<'shop' | 'database' | 'deploy'>('shop');

  // Shop settings form
  const [shopName, setShopName] = useState(settings.shop_name);
  const [shopNameTh, setShopNameTh] = useState(settings.shop_name_th);
  const [shopAddress, setShopAddress] = useState(settings.address || settings.shop_address || '');
  const [shopPhone, setShopPhone] = useState(settings.phone || settings.shop_phone || '');
  const [taxId, setTaxId] = useState(settings.tax_id);
  const [promptpayId, setPromptpayId] = useState(settings.promptpay_id);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);

  // Supabase Config form
  const existingConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(existingConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(existingConfig.anonKey || '');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shop_name: shopName,
      shop_name_th: shopNameTh,
      address: shopAddress,
      phone: shopPhone,
      shop_address: shopAddress,
      shop_phone: shopPhone,
      tax_id: taxId,
      promptpay_id: promptpayId,
      receipt_footer: receiptFooter,
    });
    showToast('บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว', 'success');
  };

  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingDb(true);
    setDbTestResult(null);

    try {
      setSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
      const test = await checkSupabaseConnection();

      if (test.success) {
        setDbTestResult({
          success: true,
          message: 'เชื่อมต่อ Supabase สำเร็จ! ระบบกำลังซิงค์ข้อมูลกับ PostgreSQL จริง',
        });
        showToast('เชื่อมต่อ Supabase สำเร็จ!', 'success');
        await refreshData();
      } else {
        setDbTestResult({
          success: false,
          message: `การเชื่อมต่อไม่สำเร็จ: ${test.error || 'โปรดตรวจสอบ URL และ Anon Key หรือรัน SQL Schema'}`,
        });
        showToast('ไม่สามารถเชื่อมต่อ Supabase ได้', 'error');
      }
    } catch (err: any) {
      setDbTestResult({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleDisconnectSupabase = async () => {
    setSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setDbTestResult(null);
    await refreshData();
    showToast('ยกเลิกการเชื่อมต่อ Supabase แล้ว สลับกลับสู่โหมด Local Storage', 'info');
  };

  const handleResetData = async () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นของตัวอย่างหรือไม่?')) {
      await resetToDemoData();
      await refreshData();
      showToast('รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว', 'success');
    }
  };

  const sqlSample = `-- 1. เปิด Supabase Dashboard -> เลือกโปรเจกต์ของคุณ
-- 2. ไปที่เมนู "SQL Editor" ด้านซ้าย
-- 3. คัดลอกโค้ดจากไฟล์ supabase/schema.sql ในโปรเจกต์นี้
-- 4. วางลงใน SQL Editor แล้วกด "Run"
-- ระบบจะสร้างตาราง products, sales, sale_items, stock_transactions, customers อัตโนมัติ!`;

  const copySqlNotice = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showToast('คัดลอกคำแนะนำแล้ว', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">ตั้งค่าระบบ (Settings)</h2>
        <p className="text-xs text-slate-500">จัดการข้อมูลร้านค้า ข้อมูลใบเสร็จ และการเชื่อมต่อฐานข้อมูล Supabase</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'shop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4 text-rose-600" />
          <span>ข้อมูลร้านค้า &amp; ใบเสร็จ</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'database' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-blue-600" />
          <span>เชื่อมต่อ Supabase</span>
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'deploy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4 text-emerald-600" />
          <span>คู่มือ Deploy บน Vercel</span>
        </button>
      </div>

      {/* TAB 1: Shop & Receipt Settings */}
      {activeTab === 'shop' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl">
          <form onSubmit={handleSaveShopSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อร้าน (อังกฤษ/หลัก)</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อร้าน (ภาษาไทย)</label>
                <input
                  type="text"
                  value={shopNameTh}
                  onChange={(e) => setShopNameTh(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ที่อยู่ร้าน (จะพิมพ์ลงบนหัวใบเสร็จ)</label>
              <textarea
                rows={2}
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ร้าน</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์พร้อมเพย์ (สำหรับ QR Payment)</label>
                <input
                  type="text"
                  value={promptpayId}
                  onChange={(e) => setPromptpayId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ข้อความท้ายใบเสร็จ (Receipt Footer)</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={handleResetData}
                className="px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตข้อมูลตัวอย่าง (Demo Data)</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                บันทึกการตั้งค่าร้านค้า
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Supabase Database Config */}
      {activeTab === 'database' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">การตั้งค่าฐานข้อมูล Supabase</h3>
                  <p className="text-xs text-slate-500">
                    เชื่อมต่อฐานข้อมูล PostgreSQL จริง สำหรับบันทึกสินค้า สต็อก ยอดขาย และผู้ใช้งาน
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isSupabaseConfigured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isSupabaseConfigured ? '🟢 เชื่อมต่อแล้ว (Live)' : '🟡 โหมดจำลอง (Local Storage)'}
              </span>
            </div>

            <form onSubmit={handleSaveAndTestSupabase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project URL (เช่น https://xyzcompany.supabase.co)
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxxxxxxx.supabase.co"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anon / Public API Key
                </label>
                <input
                  type="text"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {dbTestResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    dbTestResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {dbTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{dbTestResult.message}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {isSupabaseConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnectSupabase}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    ยกเลิกการเชื่อมต่อ Supabase
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isTestingDb || !supabaseUrl || !supabaseAnonKey}
                  className="ml-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTestingDb ? 'กำลังทดสอบการเชื่อมต่อ...' : 'บันทึกและทดสอบเชื่อมต่อ'}
                </button>
              </div>
            </form>
          </div>

          {/* SQL Schema helper guide */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                <h4 className="font-bold text-xs">โครงสร้างตาราง SQL Schema พร้อมใช้</h4>
              </div>
              <button
                onClick={copySqlNotice}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'คัดลอกแล้ว' : 'คัดลอกคำแนะนำ'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              ไฟล์ <code className="text-amber-400 font-mono">/supabase/schema.sql</code>{' '}
              ในโปรเจกต์นี้มีโค้ด SQL ที่สร้างตารางครบถ้วน พร้อม Row Level Security (RLS) และ Trigger
              คำนวณสถานะสต็อกอัตโนมัติ เพียงนำไปรันใน Supabase SQL Editor ครั้งเดียวก็พร้อมใช้งานทันที!
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Vercel Deployment Instructions */}
      {activeTab === 'deploy' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">ขั้นตอนการ Deploy ขึ้น Vercel</h3>
              <p className="text-xs text-slate-500">วิธีนำระบบ Meat Shop POS ไปเปิดใช้งานออนไลน์บน Production</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div>
                <p className="font-bold text-slate-900">เตรียมฐานข้อมูล Supabase</p>
                <p className="text-slate-500 mt-0.5">
                  สมัครบัญชีที่ supabase.com สร้าง New Project จากนั้นคัดลอกไฟล์{' '}
                  <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/supabase/schema.sql</code>{' '}
                  ไปรันใน SQL Editor
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div>
                <p className="font-bold text-slate-900">Push โค้ดขึ้น GitHub</p>
                <p className="text-slate-500 mt-0.5">
                  เชื่อมต่อ Repository ของคุณเข้ากับ GitHub เพื่อให้ Vercel สามารถดึงโค้ดไป Build อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div>
                <p className="font-bold text-slate-900">Import ใน Vercel &amp; ตั้งค่า Environment Variables</p>
                <p className="text-slate-500 mt-0.5">
                  ไปที่ vercel.com เลือก Import Git Repository และกำหนด Environment Variables ดังนี้:
                </p>
                <div className="mt-2 p-3 bg-slate-900 text-white rounded-xl font-mono text-[11px] space-y-1">
                  <p className="text-emerald-400">NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co</p>
                  <p className="text-emerald-400">NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...</p>
                  <p className="text-emerald-400">VITE_SUPABASE_URL = https://your-project.supabase.co</p>
                  <p className="text-emerald-400">VITE_SUPABASE_ANON_KEY = eyJhbGciOi...</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </div>
              <div>
                <p className="font-bold text-slate-900">กดปุ่ม Deploy</p>
                <p className="text-slate-500 mt-0.5">
                  Vercel จะทำการ Build และให้โดเมน Production พร้อมใช้งานทันที รองรับทั้งคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
