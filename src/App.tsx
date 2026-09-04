import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { ReceiptModal } from './components/ReceiptModal';
import { Sale } from './types';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { ProductsView } from './views/ProductsView';
import { InventoryView } from './views/InventoryView';
import { StockInView } from './views/StockInView';
import { CustomersView } from './views/CustomersView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { ReportsView } from './views/ReportsView';
import { EmployeesView } from './views/EmployeesView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { currentUser, isLoading } = useApp();
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Global Receipt Modal for viewing receipts from Dashboard, Sales History, Customers
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-300">กำลังโหลดระบบ Meat Shop POS...</p>
      </div>
    );
  }

  // If unauthenticated, display the Login page
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex antialiased selection:bg-rose-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        <Header
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={setCurrentPage}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <DashboardView onNavigate={setCurrentPage} onViewReceipt={setActiveReceiptSale} />
          )}
          {currentPage === 'pos' && <PosView />}
          {currentPage === 'products' && <ProductsView />}
          {currentPage === 'stock-in' && <StockInView />}
          {currentPage === 'inventory' && <InventoryView />}
          {currentPage === 'customers' && (
            <CustomersView onViewReceipt={setActiveReceiptSale} />
          )}
          {currentPage === 'sales-history' && (
            <SalesHistoryView onViewReceipt={setActiveReceiptSale} />
          )}
          {currentPage === 'reports' && <ReportsView />}
          {currentPage === 'employees' && <EmployeesView />}
          {currentPage === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Notifications Toast */}
      <ToastContainer />

      {/* Global Receipt Modal */}
      <ReceiptModal
        isOpen={!!activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
        sale={activeReceiptSale}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

