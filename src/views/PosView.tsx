import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Customer } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { Sale } from '../types';
import {
  Search,
  Filter,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Scale,
  CreditCard,
  User,
  ArrowUpDown,
  Tag,
  AlertTriangle,
  XCircle,
  Check,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    cart,
    addToCart,
    updateCartItemQuantity,
    updateCartItemPrice,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    cartTotals,
  } = useApp();

  // Search, category filter & sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'stock-desc'>('name');

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Mobile cart drawer toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.product_code.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.selling_price - b.selling_price;
        if (sortBy === 'price-desc') return b.selling_price - a.selling_price;
        if (sortBy === 'stock-desc') return b.stock_quantity - a.stock_quantity;
        return a.name.localeCompare(b.name, 'th');
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handlePaymentSuccess = (sale: Sale) => {
    setIsCheckoutOpen(false);
    clearCart();
    setOverallDiscount(0);
    setCompletedSale(sale);
    setIsReceiptOpen(true);
  };

  const getStockBadge = (p: Product) => {
    if (p.stock_quantity <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> สินค้าหมด
        </span>
      );
    }
    if (p.stock_quantity <= p.minimum_stock) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3" /> ใกล้หมด ({p.stock_quantity} {p.unit})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        คงเหลือ {p.stock_quantity} {p.unit}
      </span>
    );
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT SECTION: Products Catalog & Search */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-pos-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเนื้อสัตว์ หรือรหัสสินค้า (เช่น สันใน, หมูบด)..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="pl-8 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="name">เรียงตามชื่อ ก-ฮ</option>
                  <option value="price-asc">ราคา: ต่ำ → สูง</option>
                  <option value="price-desc">ราคา: สูง → ต่ำ</option>
                  <option value="stock-desc">สต็อก: มาก → น้อย</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBag className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium">ไม่พบสินค้าตามที่ค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกประเภทสินค้าอื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock_quantity <= 0;
                const inCartItem = cart.find((item) => item.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    id={`pos-product-card-${product.id}`}
                    onClick={() => !isOutOfStock && addToCart(product, 1.0)}
                    className={`group bg-white rounded-xl border transition-all duration-200 flex flex-col overflow-hidden text-left relative ${
                      isOutOfStock
                        ? 'opacity-50 border-slate-200 cursor-not-allowed bg-slate-50'
                        : inCartItem
                        ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md cursor-pointer'
                        : 'border-slate-200 hover:border-rose-400 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Badge if in cart */}
                    {inCartItem && (
                      <div className="absolute top-2 left-2 z-10 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        ในตะกร้า {inCartItem.quantity} {product.unit}
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-32 sm:h-36 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2">{getStockBadge(product)}</div>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>{product.product_code}</span>
                          <span>{product.category_name || 'ทั่วไป'}</span>
                        </div>
                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1 leading-snug group-hover:text-rose-600 transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-base sm:text-lg font-bold text-rose-600">
                            ฿{product.selling_price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">/{product.unit}</span>
                        </div>

                        {!isOutOfStock && (
                          <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile floating Cart Bar Trigger */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2 text-xs">
            <ShoppingCart className="w-4 h-4 text-rose-400" />
            <span>ตะกร้า ({cartTotals.itemCount} รายการ, {cartTotals.totalWeight} กก.)</span>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            ดูตะกร้า (฿{cartTotals.netTotal.toLocaleString()})
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Cart Drawer / Panel */}
      <div
        id="pos-cart-panel"
        className={`w-full lg:w-96 xl:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden transition-all duration-300 ${
          isMobileCartOpen ? 'fixed inset-4 z-50 shadow-2xl lg:relative lg:inset-auto' : 'hidden lg:flex'
        }`}
      >
        {/* Cart Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm">ตะกร้าสินค้า (Cart)</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/30 text-rose-300">
              {cartTotals.itemCount} รายการ
            </span>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="ล้างตะกร้า"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้าง
              </button>
            )}
            {isMobileCartOpen && (
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-white"
              >
                ปิด
              </button>
            )}
          </div>
        </div>

        {/* Customer Select Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
          >
            <option value="">-- เลือกลูกค้า (ค่าเริ่มต้น: ลูกค้าทั่วไป Walk-in) --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Scale className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium">ยังไม่มีสินค้าในตะกร้า</p>
              <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                คลิกเลือกสินค้าจากรายการด้านซ้าย เพื่อกำหนดน้ำหนักและคำนวณราคาขาย
              </p>
            </div>
          ) : (
            cart.map((item) => {
              return (
                <div
                  key={item.product.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
                >
                  {/* Top line: Name & Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-xs text-slate-900 leading-tight">
                        {item.product.name}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        @{item.unit_price} บ./{item.product.unit} (คงเหลือ {item.product.stock_quantity} {item.product.unit})
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Weight / Quantity Controls (with Meat Quick Buttons) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.product.id, Math.max(0.1, Number((item.quantity - 0.25).toFixed(2))))
                        }
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.product.id, Number((item.quantity + 0.25).toFixed(2)))
                        }
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <span className="text-[11px] font-medium text-slate-600">{item.product.unit}</span>
                    </div>

                    {/* Item Calculated Total */}
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ฿{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Quick Weight Adjuster Buttons for Butcher */}
                  <div className="flex items-center gap-1 pt-1 border-t border-slate-200/50">
                    <span className="text-[10px] text-slate-400 mr-1">น้ำหนักด่วน:</span>
                    {[0.5, 1.0, 1.5, 2.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => updateCartItemQuantity(item.product.id, preset)}
                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                          item.quantity === preset
                            ? 'bg-rose-600 text-white border-rose-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset} กก.
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculations & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            {/* Weight summary */}
            <div className="flex justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-500" /> น้ำหนักรวมทั้งหมด:
              </span>
              <span className="font-bold text-slate-800">{cartTotals.totalWeight} กิโลกรัม</span>
            </div>

            {/* Subtotal */}
            <div className="flex justify-between text-xs text-slate-600">
              <span>ยอดรวมสินค้า (Subtotal):</span>
              <span>฿{cartTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Overall Discount input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-rose-500" /> ส่วนลดพิเศษ (บาท):
              </span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-0.5 text-right font-medium text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Net Total */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-sm text-slate-900">ยอดชำระสุทธิ:</span>
              <span className="text-2xl font-bold text-rose-600">
                ฿{Math.max(0, cartTotals.subtotal - overallDiscount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              id="btn-pos-checkout"
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>ชำระเงิน (Checkout)</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        selectedCustomer={selectedCustomer}
        overallDiscount={overallDiscount}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
      />
    </div>
  );
};
