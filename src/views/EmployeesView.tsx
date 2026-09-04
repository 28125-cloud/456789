import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { createEmployee, updateEmployee, deleteEmployee } from '../services/db';
import {
  UserCog,
  Plus,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Edit,
  Trash2,
  X,
  Lock,
  CheckCircle,
  Ban,
  Shield,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, currentUser, refreshData, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'staff' as UserRole,
    password: '',
    is_active: true,
  });

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      role: 'staff',
      password: 'password123',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: User) => {
    setEditingEmployee(emp);
    setFormData({
      email: emp.email,
      full_name: emp.full_name,
      phone: emp.phone || '',
      role: emp.role,
      password: '',
      is_active: emp.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.full_name.trim()) {
      showToast('กรุณากรอกชื่อและอีเมลของพนักงาน', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          is_active: formData.is_active,
        });
        showToast('แก้ไขข้อมูลพนักงานเรียบร้อย', 'success');
      } else {
        await createEmployee({
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          is_active: formData.is_active,
        });
        showToast('เพิ่มพนักงานใหม่เรียบร้อยแล้ว', 'success');
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      showToast('ไม่สามารถลบบัญชีของตัวเองได้', 'error');
      return;
    }

    try {
      await deleteEmployee(id);
      await refreshData();
      showToast('ลบพนักงานออกจากระบบแล้ว', 'success');
      setIsDeletingId(null);
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถลบพนักงานได้', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">จัดการพนักงาน (Employees & Roles)</h2>
          <p className="text-xs text-slate-500">กำหนดสิทธิ์การเข้าถึงระบบระหว่าง เจ้าของร้าน (Admin) และ พนักงานขาย (Staff)</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          id="btn-add-employee"
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มพนักงานใหม่</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>สิทธิ์ผู้ดูแลระบบ (Admin)</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            เข้าถึงได้ทุกส่วน: ตั้งราคาทุน, ดูยอดขายและกำไรสุทธิ, จัดการพนักงาน, ปรับสต็อก, ตั้งค่าร้านค้า และเชื่อมต่อฐานข้อมูล
          </p>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-blue-900 mb-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>สิทธิ์พนักงานขาย (Staff)</span>
          </div>
          <p className="text-blue-800 leading-relaxed">
            จำกัดการเข้าถึง: ขายสินค้าหน้าร้าน (POS), ชั่งน้ำหนัก, รับสินค้าเข้าสต็อก, ออกใบเสร็จ (ไม่สามารถดูต้นทุนและผลกำไรภาพรวมได้)
          </p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">พนักงาน</th>
                <th className="px-4 py-3.5">อีเมล</th>
                <th className="px-4 py-3.5">เบอร์โทร</th>
                <th className="px-4 py-3.5 text-center">บทบาท (Role)</th>
                <th className="px-4 py-3.5 text-center">สถานะบัญชี</th>
                <th className="px-4 py-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={emp.full_name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{emp.full_name}</p>
                        {emp.id === currentUser?.id && (
                          <span className="text-[10px] text-rose-600 font-medium">(บัญชีที่คุณกำลังใช้งาน)</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600 font-mono">{emp.email}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.phone || '-'}</td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {emp.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      <span>{emp.role === 'admin' ? 'Admin' : 'Staff'}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        emp.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {emp.is_active ? 'ใช้งานปกติ' : 'ระงับการใช้งาน'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {emp.id !== currentUser?.id && (
                        <button
                          onClick={() => setIsDeletingId(emp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลเข้าสู่ระบบ *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="staff@meatshop.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="089-123-4567"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาท (Role) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'staff' })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      formData.role === 'staff'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-800'
                        : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mb-1 text-blue-600" />
                    <p>พนักงานขาย (Staff)</p>
                    <span className="text-[10px] text-slate-400 font-normal">ขายหน้าร้าน/รับเข้า</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      formData.role === 'admin'
                        ? 'border-amber-600 bg-amber-50/50 text-amber-800'
                        : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mb-1 text-amber-600" />
                    <p>ผู้ดูแลระบบ (Admin)</p>
                    <span className="text-[10px] text-slate-400 font-normal">สิทธิ์เต็มทุกส่วน</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="chk-active" className="text-xs text-slate-700 cursor-pointer">
                  เปิดให้เข้าใช้งานระบบ (Active)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลพนักงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ยืนยันการลบพนักงาน</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้ออกจากระบบ?
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(isDeletingId)}
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
