import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  Product,
  Category,
  Customer,
  Sale,
  StockTransaction,
  StoreSettings,
  CartItem,
  AppNotification,
} from '../types';
import {
  initializeLocalStorage,
  getProducts,
  getCategories,
  getCustomers,
  getSales,
  getProfiles,
  getStoreSettings,
  getCurrentUser,
  setCurrentUser as setLocalUser,
  resetLocalData,
  saveStoreSettings,
} from '../services/db';
import { getSupabase, getSupabaseCredentials, testSupabaseConnection } from '../services/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isAdmin: boolean;
  login: (email: string, role?: 'admin' | 'staff') => Promise<boolean>;
  logout: () => void;

  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  employees: UserProfile[];
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => void;
  refreshData: () => Promise<void>;
  resetAllData: () => Promise<void>;

  // POS Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, price: number) => void;
  updateCartItemDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotals: {
    subtotal: number;
    totalWeight: number;
    itemCount: number;
    totalDiscount: number;
    netTotal: number;
    estimatedCost: number;
    estimatedProfit: number;
  };

  // Notifications & Toast
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Supabase status
  isSupabaseConfigured: boolean;
  supabaseStatusText: string;
  checkSupabaseStatus: () => Promise<void>;

  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setUserState] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);
  const [supabaseStatusText, setSupabaseStatusText] = useState<string>('กำลังตรวจสอบ...');

  // Toast handler
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check Supabase connection
  const checkSupabaseStatus = useCallback(async () => {
    const creds = getSupabaseCredentials();
    setIsSupabaseConfigured(creds.isConfigured);
    if (!creds.isConfigured) {
      setSupabaseStatusText('โหมดฐานข้อมูลสาธิต (Demo Local Storage) - พร้อมใช้งานทันที');
      return;
    }
    const res = await testSupabaseConnection(creds.url, creds.key);
    if (res.success) {
      setSupabaseStatusText('เชื่อมต่อ Supabase PostgreSQL สำเร็จ (Online Realtime)');
    } else {
      setSupabaseStatusText(`Supabase แจ้งเตือน: ${res.message}`);
    }
  }, []);

  // Load all master data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      initializeLocalStorage();
      const [prods, cats, custs, sls, profs] = await Promise.all([
        getProducts(),
        getCategories(),
        getCustomers(),
        getSales(),
        getProfiles(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
      setSales(sls);
      setEmployees(profs);
      setSettings(getStoreSettings());

      // Auto generate inventory warning notifications
      const alerts: AppNotification[] = [];
      prods.forEach((p) => {
        if (p.stock_quantity <= 0) {
          alerts.push({
            id: `notif-out-${p.id}`,
            title: 'สินค้าหมดคลัง!',
            message: `"${p.name}" สินค้าคงเหลือ 0 ${p.unit} กรุณาสั่งรับเข้าด่วน`,
            type: 'danger',
            timestamp: new Date().toISOString(),
            read: false,
            linkTo: 'stock-in',
          });
        } else if (p.stock_quantity <= p.minimum_stock) {
          alerts.push({
            id: `notif-low-${p.id}`,
            title: 'สินค้าใกล้หมดคลัง',
            message: `"${p.name}" คงเหลือ ${p.stock_quantity} ${p.unit} (จุดเตือน: ${p.minimum_stock} ${p.unit})`,
            type: 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            linkTo: 'inventory',
          });
        }
      });
      setNotifications(alerts);
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial mount
  useEffect(() => {
    initializeLocalStorage();
    const current = getCurrentUser();
    setUserState(current);
    refreshData();
    checkSupabaseStatus();
  }, [refreshData, checkSupabaseStatus]);

  const setCurrentUser = useCallback((user: UserProfile | null) => {
    setUserState(user);
    setLocalUser(user);
  }, []);

  const login = async (email: string, role: 'admin' | 'staff' = 'admin'): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      if (supabase && isSupabaseConfigured) {
        // Try real Supabase auth if user has registered credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'password123', // or user custom
        });
        if (!error && data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            email: data.user.email || email,
            role: (data.user.user_metadata?.role as 'admin' | 'staff') || role,
            created_at: data.user.created_at,
          };
          setCurrentUser(profile);
          showToast(`ยินดีต้อนรับคุณ ${profile.full_name}`, 'success');
          return true;
        }
      }

      // Demo/Local login mapping
      const isStaff = email.toLowerCase().includes('staff') || role === 'staff';
      const user: UserProfile = {
        id: isStaff ? 'usr-staff-1' : 'usr-admin-1',
        full_name: isStaff ? 'สมศรี มีน้ำใจ (พนักงานขายหน้าร้าน)' : 'คุณธนกฤต บริหารทรัพย์ (เจ้าของร้าน)',
        email,
        phone: isStaff ? '089-555-1234' : '081-999-8877',
        role: isStaff ? 'staff' : 'admin',
        avatar_url: isStaff
          ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
      };

      setCurrentUser(user);
      showToast(`เข้าสู่ระบบสำเร็จในฐานะ ${user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'พนักงานขาย (Staff)'}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    clearCart();
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveStoreSettings(newSettings);
    showToast('บันทึกข้อมูลร้านค้าเรียบร้อย', 'success');
  };

  const resetAllData = async () => {
    resetLocalData();
    clearCart();
    await refreshData();
    showToast('รีเซ็ตข้อมูลตัวอย่างทั้งหมดเรียบร้อยแล้ว', 'success');
  };

  // Cart Management
  const addToCart = (product: Product, quantity = 1.0) => {
    if (product.stock_quantity <= 0) {
      showToast(`สินค้า "${product.name}" หมดสต็อก ไม่สามารถขายได้`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = Number((existing.quantity + quantity).toFixed(3));
        if (nextQty > product.stock_quantity) {
          showToast(`สต็อกไม่พอ! คงเหลือเพียง ${product.stock_quantity} ${product.unit}`, 'warning');
          return prev;
        }
        const total = Number((existing.unit_price * nextQty - existing.discount).toFixed(2));
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty, total } : item
        );
      } else {
        if (quantity > product.stock_quantity) {
          showToast(`สต็อกไม่พอ! คงเหลือเพียง ${product.stock_quantity} ${product.unit}`, 'warning');
          return prev;
        }
        const total = Number((product.selling_price * quantity).toFixed(2));
        return [...prev, { product, quantity, unit_price: product.selling_price, discount: 0, total }];
      }
    });
    showToast(`เพิ่ม "${product.name}" ลงในตะกร้าแล้ว`, 'info');
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (quantity > item.product.stock_quantity) {
            showToast(`ระบุเกินสต็อก! มีสินค้า ${item.product.stock_quantity} ${item.product.unit}`, 'warning');
            quantity = item.product.stock_quantity;
          }
          const total = Number((item.unit_price * quantity - item.discount).toFixed(2));
          return { ...item, quantity, total };
        }
        return item;
      })
    );
  };

  const updateCartItemPrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unit_price = Math.max(0, price);
          const total = Number((unit_price * item.quantity - item.discount).toFixed(2));
          return { ...item, unit_price, total };
        }
        return item;
      })
    );
  };

  const updateCartItemDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const safeDiscount = Math.max(0, discount);
          const total = Math.max(0, Number((item.unit_price * item.quantity - safeDiscount).toFixed(2)));
          return { ...item, discount: safeDiscount, total };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart Calculations
  const cartTotals = cart.reduce(
    (acc, item) => {
      const gross = item.unit_price * item.quantity;
      const cost = item.product.cost_price * item.quantity;
      acc.subtotal += gross;
      acc.totalWeight += item.quantity;
      acc.itemCount += 1;
      acc.totalDiscount += item.discount;
      acc.estimatedCost += cost;
      return acc;
    },
    {
      subtotal: 0,
      totalWeight: 0,
      itemCount: 0,
      totalDiscount: 0,
      netTotal: 0,
      estimatedCost: 0,
      estimatedProfit: 0,
    }
  );
  cartTotals.subtotal = Number(cartTotals.subtotal.toFixed(2));
  cartTotals.totalWeight = Number(cartTotals.totalWeight.toFixed(3));
  cartTotals.totalDiscount = Number(cartTotals.totalDiscount.toFixed(2));
  cartTotals.netTotal = Math.max(0, Number((cartTotals.subtotal - cartTotals.totalDiscount).toFixed(2)));
  cartTotals.estimatedCost = Number(cartTotals.estimatedCost.toFixed(2));
  cartTotals.estimatedProfit = Number((cartTotals.netTotal - cartTotals.estimatedCost).toFixed(2));

  // Notification methods
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    isAdmin: currentUser?.role === 'admin',
    login,
    logout,
    products,
    categories,
    customers,
    sales,
    employees,
    settings,
    updateSettings,
    refreshData,
    resetAllData,
    cart,
    addToCart,
    updateCartItemQuantity,
    updateCartItemPrice,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    cartTotals,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    toasts,
    showToast,
    removeToast,
    isSupabaseConfigured,
    supabaseStatusText,
    checkSupabaseStatus,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
