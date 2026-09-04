export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active?: boolean;
  created_at: string;
}

export type User = UserProfile;

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export type ProductStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  product_code: string;
  name: string;
  category_id: string;
  category_name?: string;
  image_url: string;
  cost_price: number;
  selling_price: number; // Price per kg or unit
  stock_quantity: number; // In kg or units
  unit: string; // e.g. 'กก.' or 'ชิ้น'
  minimum_stock: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone: string;
  address?: string;
  note?: string;
  total_spent: number;
  created_at: string;
}

export interface StockInRecord {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  total_cost: number;
  supplier?: string;
  lot_number?: string;
  note?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}


export type PaymentMethod = 'cash' | 'transfer' | 'qr';
export type SaleStatus = 'completed' | 'cancelled';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number; // Weight in kg or units
  unit: string;
  unit_price: number; // Selling price per kg
  cost_price: number; // Cost price per kg at time of sale
  discount: number; // Item level discount
  total: number; // (unit_price * quantity) - discount
  created_at?: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name?: string;
  customer_phone?: string;
  employee_id: string;
  employee_name: string;
  subtotal: number;
  discount: number;
  total: number;
  cost: number;
  profit: number;
  payment_method: PaymentMethod;
  paid_amount: number;
  change_amount: number;
  status: SaleStatus;
  items: SaleItem[];
  created_at: string;
  note?: string;
}

export type StockTransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockTransaction {
  id: string;
  product_id: string;
  product_name: string;
  type: StockTransactionType;
  quantity: number; // Positive or negative
  balance_after?: number;
  reference_id?: string;
  note?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // kg or unit
  unit_price: number;
  discount: number;
  total: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  timestamp: string;
  read: boolean;
  linkTo?: string;
}

export interface StoreSettings {
  shop_name: string;
  shop_name_th: string;
  address: string;
  phone: string;
  shop_address?: string;
  shop_phone?: string;
  tax_id: string;
  promptpay_id: string;
  receipt_footer: string;
}
