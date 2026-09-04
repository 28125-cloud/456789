import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  AlertCircle,
  Database,
  Store,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isSupabaseConfigured, settings } = useApp();

  const [email, setEmail] = useState('admin@meatshop.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isStaff = email.includes('staff');
      const success = await login(email, isStaff ? 'staff' : 'admin');
      if (!success) {
        setErrorMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้เปิดบัญชี');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@meatshop.com');
      setPassword('admin123');
      login('admin@meatshop.com', 'admin');
    } else {
      setEmail('staff@meatshop.com');
      setPassword('staff123');
      login('staff@meatshop.com', 'staff');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Background meat/butcher ambience accent glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-900/40 mb-4">
            <Flame className="w-9 h-9 fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Meat Shop POS</h1>
          <p className="text-sm text-rose-400 font-medium mt-1">ระบบจัดการร้านขายเนื้อสัตว์ครบวงจร</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings.shop_name_th} • ขายหน้าร้าน สต็อก กำไร และรายงาน
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
            <span className="text-slate-400">สถานะฐานข้อมูล:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                isSupabaseConfigured
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {isSupabaseConfigured ? 'Supabase Auth' : 'Demo Local Mode (พร้อมใช้งาน)'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                อีเมล (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="input-login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@meatshop.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="input-login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-rose-500"
                />
                <span>จดจำการเข้าสู่ระบบ (Remember session)</span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-submit-login"
              disabled={isSubmitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>กำลังเข้าสู่ระบบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 text-center mb-3">
              ⚡ คลิกเพื่อเข้าสู่ระบบทดสอบทันที (1-Click Demo Login)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-quick-login-admin"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>เจ้าของร้าน (Admin)</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">admin@meatshop.com</p>
                <p className="text-[10px] text-slate-500">สิทธิ์ครบทุกฟังก์ชัน</p>
              </button>

              <button
                type="button"
                id="btn-quick-login-staff"
                onClick={() => handleQuickLogin('staff')}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>พนักงานขาย (Staff)</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">staff@meatshop.com</p>
                <p className="text-[10px] text-slate-500">สิทธิ์ขายและดูสต็อก</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© 2026 Meat Shop POS. Ready for Vercel & Supabase Deployment.</p>
        </div>
      </div>
    </div>
  );
};
