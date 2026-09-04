import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  PackagePlus,
  Boxes,
  Users,
  ReceiptText,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Flame,
  AlertTriangle,
  X,
  Database,
} from 'lucide-react';

export type NavPage =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'stock-in'
  | 'inventory'
  | 'customers'
  | 'sales-history'
  | 'reports'
  | 'employees'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, isAdmin, logout, products, isSupabaseConfigured } = useApp();

  const lowStockCount = products.filter((p) => p.stock_quantity <= p.minimum_stock).length;

  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'pos' as NavPage, label: 'ขายสินค้า (POS)', icon: ShoppingCart, badge: null, highlight: true },
    { id: 'products' as NavPage, label: 'สินค้า', icon: Package, badge: products.length },
    { id: 'stock-in' as NavPage, label: 'รับสินค้าเข้า', icon: PackagePlus, badge: null },
    {
      id: 'inventory' as NavPage,
      label: 'คลังสินค้า (Stock)',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} เตือน` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'customers' as NavPage, label: 'ลูกค้า', icon: Users, badge: null },
    { id: 'sales-history' as NavPage, label: 'ประวัติการขาย', icon: ReceiptText, badge: null },
    { id: 'reports' as NavPage, label: 'รายงาน', icon: BarChart3, badge: null },
    ...(isAdmin
      ? [{ id: 'employees' as NavPage, label: 'พนักงาน', icon: UserCog, badge: 'Admin' }]
      : []),
    { id: 'settings' as NavPage, label: 'ตั้งค่าระบบ', icon: Settings, badge: null },
  ];

  const handleItemClick = (page: NavPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-900/30">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight leading-none">Meat Shop POS</h1>
              <p className="text-[11px] text-rose-400 font-medium mt-1">ระบบร้านเนื้อสัตว์ครบวงจร</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Mode Status */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            ฐานข้อมูล:
          </span>
          <span
            className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${
              isSupabaseConfigured
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {isSupabaseConfigured ? 'Supabase Live' : 'Demo Hybrid'}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                alt={currentUser?.full_name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{currentUser?.full_name}</p>
                <p className="text-[10px] text-slate-400">
                  {currentUser?.role === 'admin' ? '🛡️ ผู้ดูแลระบบ (Admin)' : '💼 พนักงานขาย (Staff)'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            id="btn-sidebar-logout"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
};
