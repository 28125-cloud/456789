import {
  Product,
  Category,
  Customer,
  Sale,
  SaleItem,
  StockTransaction,
  UserProfile,
  StoreSettings,
  CartItem,
  PaymentMethod,
  ProductStatus,
  StockInRecord,
} from '../types';
import {
  DEFAULT_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PROFILES,
  INITIAL_SALES,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_STOCK_IN_RECORDS,
} from '../data/seedData';
import { getSupabase, getSupabaseCredentials } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'meatshop_products_v1',
  CATEGORIES: 'meatshop_categories_v1',
  CUSTOMERS: 'meatshop_customers_v1',
  SALES: 'meatshop_sales_v1',
  STOCK_TX: 'meatshop_stock_tx_v1',
  PROFILES: 'meatshop_profiles_v1',
  SETTINGS: 'meatshop_settings_v1',
  CURRENT_USER: 'meatshop_current_user_v1',
  STOCK_IN: 'meatshop_stock_in_v1',
};

// Helper: Calculate stock status based on quantity and minimum_stock
export function calculateStockStatus(quantity: number, minStock: number): ProductStatus {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minStock) return 'LOW_STOCK';
  return 'AVAILABLE';
}

// Local Storage helpers
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

// Ensure initial seed data exists locally
export function initializeLocalStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    setLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    setLocal(STORAGE_KEYS.SALES, INITIAL_SALES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STOCK_TX)) {
    setLocal(STORAGE_KEYS.STOCK_TX, INITIAL_STOCK_TRANSACTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    setLocal(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setLocal(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STOCK_IN)) {
    setLocal(STORAGE_KEYS.STOCK_IN, INITIAL_STOCK_IN_RECORDS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    // Default to admin user for immediate seamless experience
    setLocal(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
  }
}

// Reset all demo data
export function resetLocalData(): void {
  setLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  setLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  setLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  setLocal(STORAGE_KEYS.SALES, INITIAL_SALES);
  setLocal(STORAGE_KEYS.STOCK_TX, INITIAL_STOCK_TRANSACTIONS);
  setLocal(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  setLocal(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
  setLocal(STORAGE_KEYS.STOCK_IN, INITIAL_STOCK_IN_RECORDS);
}

// ==========================================
// STORE SETTINGS
// ==========================================
export function getStoreSettings(): StoreSettings {
  return getLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
}

export function saveStoreSettings(settings: StoreSettings): void {
  setLocal(STORAGE_KEYS.SETTINGS, settings);
}

// ==========================================
// CATEGORIES
// ==========================================
export async function getCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch (e) {
      console.warn('Supabase fetch categories fallback to local', e);
    }
  }
  return getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

// ==========================================
// PRODUCTS
// ==========================================
export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (!error && data) {
        return data as Product[];
      }
    } catch (e) {
      console.warn('Supabase fetch products fallback to local', e);
    }
  }
  return getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
}

export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<Product> {
  const newId = `prod-${Date.now()}`;
  const now = new Date().toISOString();
  const status = calculateStockStatus(productData.stock_quantity, productData.minimum_stock);

  const newProduct: Product = {
    ...productData,
    id: newId,
    status,
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
      if (!error && data) {
        return data as Product;
      }
    } catch (e) {
      console.warn('Supabase insert product fallback to local', e);
    }
  }

  const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const updated = [newProduct, ...products];
  setLocal(STORAGE_KEYS.PRODUCTS, updated);

  // Also log stock transaction for initial stock if > 0
  if (productData.stock_quantity > 0) {
    await recordStockTransaction({
      product_id: newProduct.id,
      product_name: newProduct.name,
      type: 'IN',
      quantity: productData.stock_quantity,
      balance_after: productData.stock_quantity,
      reference_id: 'INIT-STOCK',
      note: 'สต็อกเริ่มต้นเมื่อเพิ่มสินค้า',
      created_by: 'system',
      created_by_name: 'ระบบ',
    });
  }

  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Product not found');

  const existing = products[index];
  const updatedQuantity = updates.stock_quantity !== undefined ? updates.stock_quantity : existing.stock_quantity;
  const updatedMinStock = updates.minimum_stock !== undefined ? updates.minimum_stock : existing.minimum_stock;
  const newStatus = calculateStockStatus(updatedQuantity, updatedMinStock);

  const updatedProduct: Product = {
    ...existing,
    ...updates,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').update(updatedProduct).eq('id', id).select().single();
      if (!error && data) {
        return data as Product;
      }
    } catch (e) {
      console.warn('Supabase update product fallback to local', e);
    }
  }

  products[index] = updatedProduct;
  setLocal(STORAGE_KEYS.PRODUCTS, products);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase delete product fallback to local', e);
    }
  }

  const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const filtered = products.filter((p) => p.id !== id);
  setLocal(STORAGE_KEYS.PRODUCTS, filtered);
  return true;
}

// ==========================================
// CUSTOMERS
// ==========================================
export async function getCustomers(): Promise<Customer[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (!error && data) return data as Customer[];
    } catch (e) {
      console.warn('Supabase get customers fallback', e);
    }
  }
  return getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export async function createCustomer(custData: {
  name: string;
  phone: string;
  address?: string;
  note?: string;
  customer_code?: string;
  total_spent?: number;
}): Promise<Customer> {
  const newCustomer: Customer = {
    ...custData,
    customer_code: custData.customer_code || `CUST-${Date.now().toString().slice(-4)}`,
    total_spent: custData.total_spent || 0,
    id: `cust-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('customers').insert([newCustomer]).select().single();
      if (!error && data) return data as Customer;
    } catch (e) {
      console.warn('Supabase insert customer fallback', e);
    }
  }

  const customers = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  setLocal(STORAGE_KEYS.CUSTOMERS, [newCustomer, ...customers]);
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const customers = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Customer not found');

  const updated: Customer = {
    ...customers[index],
    ...updates,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('customers').update(updated).eq('id', id).select().single();
      if (!error && data) return data as Customer;
    } catch (e) {
      console.warn('Supabase update customer fallback', e);
    }
  }

  customers[index] = updated;
  setLocal(STORAGE_KEYS.CUSTOMERS, customers);
  return updated;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase delete customer fallback', e);
    }
  }

  const customers = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  setLocal(STORAGE_KEYS.CUSTOMERS, customers.filter((c) => c.id !== id));
  return true;
}

// ==========================================
// STOCK TRANSACTIONS
// ==========================================
export async function getStockTransactions(productId?: string): Promise<StockTransaction[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase.from('stock_transactions').select('*').order('created_at', { ascending: false });
      if (productId) {
        query = query.eq('product_id', productId);
      }
      const { data, error } = await query;
      if (!error && data) return data as StockTransaction[];
    } catch (e) {
      console.warn('Supabase get stock transactions fallback', e);
    }
  }

  const all = getLocal<StockTransaction[]>(STORAGE_KEYS.STOCK_TX, INITIAL_STOCK_TRANSACTIONS);
  if (productId) {
    return all.filter((tx) => tx.product_id === productId);
  }
  return all;
}

export async function recordStockTransaction(
  txData: Omit<StockTransaction, 'id' | 'created_at'>
): Promise<StockTransaction> {
  const newTx: StockTransaction = {
    ...txData,
    id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('stock_transactions').insert([
        {
          id: newTx.id,
          product_id: newTx.product_id,
          type: newTx.type,
          quantity: newTx.quantity,
          reference_id: newTx.reference_id,
          note: newTx.note,
          created_by: newTx.created_by,
          created_at: newTx.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Supabase record stock tx fallback', e);
    }
  }

  const all = getLocal<StockTransaction[]>(STORAGE_KEYS.STOCK_TX, INITIAL_STOCK_TRANSACTIONS);
  setLocal(STORAGE_KEYS.STOCK_TX, [newTx, ...all]);
  return newTx;
}

// Stock In Function: Receives stock, updates product cost and stock quantity
export async function getStockInRecords(): Promise<StockInRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('stock_in_records').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as StockInRecord[];
    } catch (e) {
      console.warn('Supabase get stock-in records fallback', e);
    }
  }
  return getLocal<StockInRecord[]>(STORAGE_KEYS.STOCK_IN, INITIAL_STOCK_IN_RECORDS);
}

export async function recordStockIn(params: {
  product_id: string;
  quantity: number;
  cost_price: number;
  supplier?: string;
  lot_number?: string;
  note?: string;
  created_by: string;
  created_by_name: string;
  reference_id?: string;
}): Promise<{ product: Product; transaction: StockTransaction; stockInRecord: StockInRecord }> {
  const products = await getProducts();
  const product = products.find((p) => p.id === params.product_id);
  if (!product) throw new Error('Product not found');

  const newQuantity = Number((product.stock_quantity + params.quantity).toFixed(3));
  const newCostPrice = params.cost_price > 0 ? params.cost_price : product.cost_price;

  const updatedProduct = await updateProduct(params.product_id, {
    stock_quantity: newQuantity,
    cost_price: newCostPrice,
  });

  const transaction = await recordStockTransaction({
    product_id: params.product_id,
    product_name: product.name,
    type: 'IN',
    quantity: params.quantity,
    balance_after: newQuantity,
    reference_id: params.reference_id || params.lot_number || `LOT-${Date.now().toString().slice(-6)}`,
    note: params.note || `รับสินค้าเข้า ${params.quantity} ${product.unit}`,
    created_by: params.created_by,
    created_by_name: params.created_by_name,
  });

  const stockInRecord: StockInRecord = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    product_id: params.product_id,
    product_name: product.name,
    quantity: params.quantity,
    cost_price: params.cost_price,
    total_cost: params.quantity * params.cost_price,
    supplier: params.supplier,
    lot_number: params.lot_number || transaction.reference_id,
    note: params.note,
    created_by: params.created_by,
    created_by_name: params.created_by_name,
    created_at: new Date().toISOString(),
  };

  const records = getLocal<StockInRecord[]>(STORAGE_KEYS.STOCK_IN, INITIAL_STOCK_IN_RECORDS);
  setLocal(STORAGE_KEYS.STOCK_IN, [stockInRecord, ...records]);

  return { product: updatedProduct, transaction, stockInRecord };
}

// Adjust Stock (e.g. inventory audit, trimming loss, recount)
export async function recordStockAdjustment(params: {
  product_id: string;
  new_quantity: number;
  note: string;
  created_by: string;
  created_by_name: string;
}): Promise<{ product: Product; transaction: StockTransaction }> {
  const products = await getProducts();
  const product = products.find((p) => p.id === params.product_id);
  if (!product) throw new Error('Product not found');

  const diff = Number((params.new_quantity - product.stock_quantity).toFixed(3));
  const updatedProduct = await updateProduct(params.product_id, {
    stock_quantity: params.new_quantity,
  });

  const transaction = await recordStockTransaction({
    product_id: params.product_id,
    product_name: product.name,
    type: 'ADJUSTMENT',
    quantity: diff,
    balance_after: params.new_quantity,
    reference_id: `ADJ-${Date.now().toString().slice(-6)}`,
    note: params.note,
    created_by: params.created_by,
    created_by_name: params.created_by_name,
  });

  return { product: updatedProduct, transaction };
}

// ==========================================
// SALES & POS CHECKOUT
// ==========================================
export async function getSales(): Promise<Sale[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('sales').select('*, items:sale_items(*)').order('created_at', { ascending: false });
      if (!error && data) return data as Sale[];
    } catch (e) {
      console.warn('Supabase get sales fallback', e);
    }
  }
  return getLocal<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
}

export async function getSaleById(id: string): Promise<Sale | null> {
  const sales = await getSales();
  return sales.find((s) => s.id === id) || null;
}

export function generateInvoiceNumber(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  const todaySalesCount = sales.filter((s) => s.invoice_number?.startsWith(`RCP-${dateStr}`)).length;
  const seq = String(todaySalesCount + 1).padStart(4, '0');

  return `RCP-${dateStr}-${seq}`;
}

export async function recordSale(params: {
  customer_id?: string | null;
  customer_name?: string;
  customer_phone?: string;
  employee_id: string;
  employee_name: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  paid_amount: number;
  change_amount: number;
  discount: number;
  note?: string;
}): Promise<Sale> {
  const saleId = `sale-${Date.now()}`;
  const invoice_number = generateInvoiceNumber();
  const now = new Date().toISOString();

  let subtotal = 0;
  let totalCost = 0;

  const saleItems: SaleItem[] = params.items.map((cartItem, idx) => {
    const itemTotal = Number((cartItem.unit_price * cartItem.quantity - cartItem.discount).toFixed(2));
    const itemCost = Number((cartItem.product.cost_price * cartItem.quantity).toFixed(2));
    subtotal += itemTotal;
    totalCost += itemCost;

    return {
      id: `si-${saleId}-${idx + 1}`,
      sale_id: saleId,
      product_id: cartItem.product.id,
      product_name: cartItem.product.name,
      product_code: cartItem.product.product_code,
      quantity: cartItem.quantity,
      unit: cartItem.product.unit,
      unit_price: cartItem.unit_price,
      cost_price: cartItem.product.cost_price,
      discount: cartItem.discount,
      total: itemTotal,
      created_at: now,
    };
  });

  const total = Math.max(0, Number((subtotal - params.discount).toFixed(2)));
  const profit = Number((total - totalCost).toFixed(2));

  const newSale: Sale = {
    id: saleId,
    invoice_number,
    customer_id: params.customer_id || null,
    customer_name: params.customer_name || 'ลูกค้าทั่วไป (Walk-in)',
    customer_phone: params.customer_phone || '-',
    employee_id: params.employee_id,
    employee_name: params.employee_name,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(params.discount.toFixed(2)),
    total,
    cost: Number(totalCost.toFixed(2)),
    profit,
    payment_method: params.payment_method,
    paid_amount: params.paid_amount,
    change_amount: params.change_amount,
    status: 'completed',
    items: saleItems,
    created_at: now,
    note: params.note,
  };

  // 1. Stock deduction and logging for each sold item
  const allProducts = await getProducts();
  for (const item of params.items) {
    const p = allProducts.find((prod) => prod.id === item.product.id);
    if (p) {
      const remainingStock = Math.max(0, Number((p.stock_quantity - item.quantity).toFixed(3)));
      await updateProduct(p.id, { stock_quantity: remainingStock });

      await recordStockTransaction({
        product_id: p.id,
        product_name: p.name,
        type: 'OUT',
        quantity: -item.quantity,
        balance_after: remainingStock,
        reference_id: invoice_number,
        note: `ขายสินค้า บิลเลขที่ ${invoice_number}`,
        created_by: params.employee_id,
        created_by_name: params.employee_name,
      });
    }
  }

  // 2. Persist sale
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('sales').insert([
        {
          id: newSale.id,
          invoice_number: newSale.invoice_number,
          customer_id: newSale.customer_id,
          employee_id: newSale.employee_id,
          subtotal: newSale.subtotal,
          discount: newSale.discount,
          total: newSale.total,
          cost: newSale.cost,
          profit: newSale.profit,
          payment_method: newSale.payment_method,
          paid_amount: newSale.paid_amount,
          change_amount: newSale.change_amount,
          status: newSale.status,
          created_at: newSale.created_at,
        },
      ]);

      const itemsToInsert = saleItems.map((si) => ({
        id: si.id,
        sale_id: si.sale_id,
        product_id: si.product_id,
        quantity: si.quantity,
        unit_price: si.unit_price,
        cost_price: si.cost_price,
        total: si.total,
        created_at: si.created_at,
      }));
      await supabase.from('sale_items').insert(itemsToInsert);
    } catch (e) {
      console.warn('Supabase sale insert fallback to local', e);
    }
  }

  const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  setLocal(STORAGE_KEYS.SALES, [newSale, ...sales]);

  return newSale;
}

// Cancel sale and refund stock
export async function cancelSale(
  saleId: string,
  reason?: string,
  employee_id: string = 'system',
  employee_name: string = 'เจ้าของร้าน'
): Promise<Sale> {
  const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  const index = sales.findIndex((s) => s.id === saleId);
  if (index === -1) throw new Error('Sale not found');

  const sale = sales[index];
  if (sale.status === 'cancelled') throw new Error('Sale is already cancelled');

  // Refund stock for each item
  const allProducts = await getProducts();
  for (const item of sale.items) {
    const p = allProducts.find((prod) => prod.id === item.product_id);
    if (p) {
      const restoredStock = Number((p.stock_quantity + item.quantity).toFixed(3));
      await updateProduct(p.id, { stock_quantity: restoredStock });

      await recordStockTransaction({
        product_id: p.id,
        product_name: p.name,
        type: 'IN',
        quantity: item.quantity,
        balance_after: restoredStock,
        reference_id: sale.invoice_number,
        note: `ยกเลิกบิล ${sale.invoice_number} (คืนสต็อก: ${reason || 'ลูกค้าขอยกเลิก'})`,
        created_by: employee_id,
        created_by_name: employee_name,
      });
    }
  }

  const updatedSale: Sale = {
    ...sale,
    status: 'cancelled',
    note: reason ? `[ยกเลิก: ${reason}] ${sale.note || ''}` : sale.note,
  };

  sales[index] = updatedSale;
  setLocal(STORAGE_KEYS.SALES, sales);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('sales').update({ status: 'cancelled' }).eq('id', saleId);
    } catch (e) {
      console.warn('Supabase cancel sale fallback', e);
    }
  }

  return updatedSale;
}

// ==========================================
// PROFILES / USERS / AUTH
// ==========================================
export async function getProfiles(): Promise<UserProfile[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at');
      if (!error && data) return data as UserProfile[];
    } catch (e) {
      console.warn('Supabase get profiles fallback', e);
    }
  }
  return getLocal<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
}

export function getCurrentUser(): UserProfile {
  return getLocal<UserProfile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
}

export function setCurrentUser(user: UserProfile | null): void {
  if (user) {
    setLocal(STORAGE_KEYS.CURRENT_USER, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export async function createProfile(userData: Omit<UserProfile, 'id' | 'created_at'>): Promise<UserProfile> {
  const newProfile: UserProfile = {
    ...userData,
    id: `usr-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').insert([newProfile]).select().single();
      if (!error && data) return data as UserProfile;
    } catch (e) {
      console.warn('Supabase create profile fallback', e);
    }
  }

  const profiles = getLocal<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  setLocal(STORAGE_KEYS.PROFILES, [...profiles, newProfile]);
  return newProfile;
}

export async function updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const profiles = getLocal<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Profile not found');

  const updated: UserProfile = {
    ...profiles[index],
    ...updates,
  };

  profiles[index] = updated;
  setLocal(STORAGE_KEYS.PROFILES, profiles);

  // If current logged-in user is modified, update session
  const current = getCurrentUser();
  if (current?.id === id) {
    setCurrentUser(updated);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').update(updated).eq('id', id);
    } catch (e) {
      console.warn('Supabase update profile fallback', e);
    }
  }

  return updated;
}

export async function deleteProfile(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete profile fallback', e);
    }
  }

  const profiles = getLocal<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  setLocal(STORAGE_KEYS.PROFILES, profiles.filter((p) => p.id !== id));
  return true;
}

// Aliases for convenience across views
export const createEmployee = createProfile;
export const updateEmployee = updateProfile;
export const deleteEmployee = deleteProfile;
export const resetToDemoData = resetLocalData;

