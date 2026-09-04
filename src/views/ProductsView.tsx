import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { createProduct, updateProduct, deleteProduct } from '../services/db';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, categories, refreshData, showToast, isAdmin } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    product_code: '',
    name: '',
    category_id: 'cat-beef',
    image_url: '',
    cost_price: 100,
    selling_price: 150,
    stock_quantity: 10,
    unit: 'กก.',
    minimum_stock: 10,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [products, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const nextCode = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    setFormData({
      product_code: nextCode,
      name: '',
      category_id: categories[0]?.id || 'cat-beef',
      image_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600',
      cost_price: 120,
      selling_price: 180,
      stock_quantity: 15,
      unit: 'กก.',
      minimum_stock: 10,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_code: product.product_code,
      name: product.name,
      category_id: product.category_id,
      image_url: product.image_url,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      unit: product.unit,
      minimum_stock: product.minimum_stock,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.product_code.trim()) errors.product_code = 'กรุณาระบุรหัสสินค้า';
    if (!formData.name.trim()) errors.name = 'กรุณาระบุชื่อสินค้า';
    if (formData.cost_price < 0) errors.cost_price = 'ราคาทุนต้องไม่ต่ำกว่า 0';
    if (formData.selling_price <= 0) errors.selling_price = 'ราคาขายต้องมากกว่า 0';
    if (formData.selling_price < formData.cost_price) {
      errors.selling_price = 'คำเตือน: ราคาขายต่ำกว่าราคาทุน';
    }
    if (formData.stock_quantity < 0) errors.stock_quantity = 'สต็อกสินค้าต้องไม่ติดลบ';
    if (formData.minimum_stock < 0) errors.minimum_stock = 'จุดเตือนสต็อกต้องไม่ติดลบ';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedCatObj = categories.find((c) => c.id === formData.category_id);

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          product_code: formData.product_code.trim(),
          name: formData.name.trim(),
          category_id: formData.category_id,
          category_name: selectedCatObj?.name,
          image_url: formData.image_url.trim() || 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600',
          cost_price: Number(formData.cost_price),
          selling_price: Number(formData.selling_price),
          stock_quantity: Number(formData.stock_quantity),
          unit: formData.unit.trim() || 'กก.',
          minimum_stock: Number(formData.minimum_stock),
        });
        showToast('แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว', 'success');
      } else {
        await createProduct({
          product_code: formData.product_code.trim(),
          name: formData.name.trim(),
          category_id: formData.category_id,
          category_name: selectedCatObj?.name,
          image_url: formData.image_url.trim() || 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600',
          cost_price: Number(formData.cost_price),
          selling_price: Number(formData.selling_price),
          stock_quantity: Number(formData.stock_quantity),
          unit: formData.unit.trim() || 'กก.',
          minimum_stock: Number(formData.minimum_stock),
        });
        showToast('เพิ่มสินค้าใหม่ในระบบเรียบร้อยแล้ว', 'success');
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'บันทึกสินค้าไม่สำเร็จ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      await refreshData();
      showToast('ลบสินค้าออกจากระบบแล้ว', 'success');
      setIsDeletingId(null);
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถลบสินค้าได้', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">รายการสินค้าเนื้อสัตว์</h2>
          <p className="text-xs text-slate-500">จัดการข้อมูล ราคาทุน ราคาขายต่อกิโลกรัม และจุดแจ้งเตือนสต็อก</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            id="btn-add-product"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่อสินค้า หรือรหัสสินค้า..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกประเภท ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกสถานะสต็อก</option>
            <option value="AVAILABLE">🟢 มีสินค้าเพียงพอ</option>
            <option value="LOW_STOCK">🟡 สินค้าใกล้หมด</option>
            <option value="OUT_OF_STOCK">🔴 สินค้าหมด</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">สินค้า</th>
                <th className="px-4 py-3.5">ประเภท</th>
                <th className="px-4 py-3.5 text-right">ราคาทุน</th>
                <th className="px-4 py-3.5 text-right">ราคาขาย/กก.</th>
                <th className="px-4 py-3.5 text-right">กำไรคาดหวัง</th>
                <th className="px-4 py-3.5 text-center">คงเหลือในสต็อก</th>
                <th className="px-4 py-3.5 text-center">สถานะ</th>
                {isAdmin && <th className="px-4 py-3.5 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profitPerUnit = p.selling_price - p.cost_price;
                  const marginPercent = p.selling_price > 0 ? ((profitPerUnit / p.selling_price) * 100).toFixed(1) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product details with thumb */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                            loading="lazy"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{p.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.product_code}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {p.category_name || categories.find((c) => c.id === p.category_id)?.name || 'ทั่วไป'}
                        </span>
                      </td>

                      {/* Cost price */}
                      <td className="px-4 py-3 text-right text-slate-500 font-mono">
                        ฿{p.cost_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Selling price */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                        ฿{p.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Expected Profit */}
                      <td className="px-4 py-3 text-right font-mono">
                        <span className="text-emerald-600 font-semibold">+฿{profitPerUnit.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({marginPercent}%)</span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-slate-900 text-sm">{p.stock_quantity}</span>{' '}
                        <span className="text-slate-500 text-[11px]">{p.unit}</span>
                        <p className="text-[10px] text-slate-400">(เตือนเมื่อต่ำกว่า {p.minimum_stock})</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {p.status === 'AVAILABLE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            🟢 มีสินค้า
                          </span>
                        )}
                        {p.status === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            🟡 ใกล้หมด
                          </span>
                        )}
                        {p.status === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            🔴 หมดคลัง
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setIsDeletingId(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าเนื้อสัตว์ใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสสินค้า *</label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    required
                    placeholder="BF-001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  {formErrors.product_code && (
                    <span className="text-[10px] text-rose-600">{formErrors.product_code}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทสินค้า *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อสินค้า (เนื้อสัตว์) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="เช่น เนื้อสันในโคขุน (Tenderloin)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                {formErrors.name && <span className="text-[10px] text-rose-600">{formErrors.name}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ลิงก์รูปภาพ (Image URL)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาทุน (บาท/{formData.unit})</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  {formErrors.cost_price && (
                    <span className="text-[10px] text-rose-600">{formErrors.cost_price}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาขาย (บาท/{formData.unit}) *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-rose-600"
                  />
                  {formErrors.selling_price && (
                    <span className="text-[10px] text-rose-600">{formErrors.selling_price}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนสต็อก</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    placeholder="กก."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จุดเตือนสต็อกต่ำ</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการลบสินค้า</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteProduct(isDeletingId)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl cursor-pointer shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
