import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NavPage } from './Sidebar';
import {
  Menu,
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Flame,
  User,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentPage: NavPage;
  onOpenMobileSidebar: () => void;
  onNavigate: (page: NavPage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  onNavigate,
}) => {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    settings,
    isSupabaseConfigured,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = (page: NavPage) => {
    switch (page) {
      case 'dashboard':
        return 'ภาพรวมระบบ (Dashboard)';
      case 'pos':
        return 'ขายสินค้าหน้าร้าน (POS)';
      case 'products':
        return 'จัดการสินค้า (Products)';
      case 'stock-in':
        return 'รับสินค้าเข้าสต็อก (Stock In)';
      case 'inventory':
        return 'คลังสินค้าและสต็อก (Inventory)';
      case 'customers':
        return 'ฐานข้อมูลลูกค้า (Customers)';
      case 'sales-history':
        return 'ประวัติการขายและบิล (Sales History)';
      case 'reports':
        return 'รายงานและการวิเคราะห์ (Reports)';
      case 'employees':
        return 'จัดการพนักงาน (Employees)';
      case 'settings':
        return 'ตั้งค่าระบบ (Settings)';
      default:
        return 'Meat Shop POS';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayThai = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3 flex items-center justify-between transition-all">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          id="btn-open-mobile-sidebar"
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              {getPageTitle(currentPage)}
            </h2>
            {currentPage === 'pos' && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                โหมดขายด่วน
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden sm:block flex items-center gap-1">
            <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
            {todayThai} • {settings.shop_name}
          </p>
        </div>
      </div>

      {/* Right side: Quick Actions & Notification Bell */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase status pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-600">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Demo Local Storage'}</span>
        </div>

        {/* Notifications dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            id="btn-notification-bell"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div
              id="notifications-dropdown-menu"
              className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold text-xs">การแจ้งเตือน ({notifications.length})</span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                    ไม่มีการแจ้งเตือนใหม่ คลังสินค้าอยู่ในระดับปกติ
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.linkTo) {
                          onNavigate(notif.linkTo as NavPage);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 text-xs transition-colors cursor-pointer flex gap-3 ${
                        notif.read ? 'bg-white opacity-70' : 'bg-rose-50/50 hover:bg-rose-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === 'danger'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{notif.title}</p>
                        <p className="text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">คลิกเพื่อไปยังหน้ารับสินค้า/คลัง</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
            alt={currentUser?.full_name}
            className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-xs"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser?.full_name.split(' ')[0]}
            </p>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.2 rounded-sm ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {currentUser?.role === 'admin' ? 'Admin' : 'Staff'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
