-- ==============================================================================
-- Meat Shop POS & Inventory System - Supabase PostgreSQL Database Schema
-- ระบบจัดการร้านขายเนื้อสัตว์ครบวงจร
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / EMPLOYEES TABLE (Linked to auth.users or standalone)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    unit TEXT NOT NULL DEFAULT 'กก.',
    minimum_stock NUMERIC(10, 3) NOT NULL DEFAULT 10.000,
    status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK')) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    employee_id TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'qr')),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SALE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 3) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. STOCK_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity NUMERIC(10, 3) NOT NULL,
    reference_id TEXT,
    note TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_prod ON stock_transactions(product_id);

-- TRIGGER FUNCTION: AUTO CALCULATE PRODUCT STATUS
CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity <= 0 THEN
        NEW.status := 'OUT_OF_STOCK';
    ELSIF NEW.stock_quantity <= NEW.minimum_stock THEN
        NEW.status := 'LOW_STOCK';
    ELSE
        NEW.status := 'AVAILABLE';
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_product_status ON products;
CREATE TRIGGER trg_update_product_status
    BEFORE INSERT OR UPDATE OF stock_quantity, minimum_stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_status();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon (demo/read) according to permissions
CREATE POLICY "Allow public read for products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full products access" ON products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full categories access" ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated sales access" ON sales FOR ALL USING (true);
CREATE POLICY "Allow authenticated sale_items access" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow authenticated customers access" ON customers FOR ALL USING (true);
CREATE POLICY "Allow authenticated stock_transactions access" ON stock_transactions FOR ALL USING (true);
CREATE POLICY "Allow authenticated profiles access" ON profiles FOR ALL USING (true);

-- SEED INITIAL DATA
INSERT INTO categories (id, name, description) VALUES
('cat-beef', 'เนื้อวัว', 'เนื้อโคขุนและเนื้อวัวคุณภาพเกรดพรีเมียม'),
('cat-pork', 'เนื้อหมู', 'เนื้อหมูสดอนามัย ปลอดสารเร่งเนื้อแดง'),
('cat-chicken', 'เนื้อไก่', 'ไก่สดตัดแต่ง อก น่อง สะโพก'),
('cat-fish', 'เนื้อปลา', 'ปลาสดและเนื้อปลาแล่พร้อมปรุง'),
('cat-offal', 'เครื่องใน', 'ตับ ม้าม ไส้ และเครื่องในสดสะอาด'),
('cat-other', 'อื่น ๆ', 'ผลิตภัณฑ์แปรรูปและเครื่องปรุง')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, product_code, name, category_id, image_url, cost_price, selling_price, stock_quantity, unit, minimum_stock, status) VALUES
('prod-1', 'BF-001', 'เนื้อสันในโคขุน (Tenderloin)', 'cat-beef', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80', 360.00, 490.00, 18.5, 'กก.', 10.0, 'AVAILABLE'),
('prod-2', 'BF-002', 'เนื้อสันนอกโคขุน (Sirloin)', 'cat-beef', 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80', 300.00, 420.00, 24.0, 'กก.', 15.0, 'AVAILABLE'),
('prod-3', 'PK-001', 'เนื้อสามชั้นคัดพิเศษ (Pork Belly)', 'cat-pork', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', 155.00, 220.00, 35.5, 'กก.', 20.0, 'AVAILABLE'),
('prod-4', 'PK-002', 'เนื้อหมูสันคอ/สะโพก (Pork Shoulder)', 'cat-pork', 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=600&auto=format&fit=crop&q=80', 130.00, 185.00, 42.0, 'กก.', 25.0, 'AVAILABLE'),
('prod-5', 'CK-001', 'อกไก่สดลอกหนัง (Chicken Breast)', 'cat-chicken', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80', 68.00, 98.00, 60.0, 'กก.', 30.0, 'AVAILABLE'),
('prod-6', 'CK-002', 'น่องไก่ติดสะโพก (Chicken Drumstick)', 'cat-chicken', 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80', 62.00, 89.00, 5.5, 'กก.', 20.0, 'LOW_STOCK'),
('prod-7', 'FS-001', 'เนื้อปลากะพงแล่สด (Sea Bass Fillet)', 'cat-fish', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&auto=format&fit=crop&q=80', 210.00, 320.00, 0.0, 'กก.', 8.0, 'OUT_OF_STOCK'),
('prod-8', 'OF-001', 'ตับหมูสดอนามัย (Pork Liver)', 'cat-offal', 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&auto=format&fit=crop&q=80', 95.00, 145.00, 12.0, 'กก.', 10.0, 'AVAILABLE'),
('prod-9', 'OF-002', 'เครื่องในรวมสด (Mixed Offal)', 'cat-offal', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80', 80.00, 120.00, 6.0, 'กก.', 12.0, 'LOW_STOCK'),
('prod-10', 'PK-003', 'เนื้อหมูบดสดอนามัย (Minced Pork)', 'cat-pork', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80', 120.00, 175.00, 28.0, 'กก.', 20.0, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;
