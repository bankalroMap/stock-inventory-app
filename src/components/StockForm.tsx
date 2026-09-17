import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Package,
  PlusCircle,
  RotateCcw,
  Tag,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { StockTransaction, TransactionType } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS } from '../utils/storage';

interface StockFormProps {
  onSave: (
    transaction: Omit<StockTransaction, 'id' | 'createdAt'>,
    idToUpdate?: string
  ) => Promise<boolean | void> | void;
  editingTransaction: StockTransaction | null;
  onCancelEdit: () => void;
  isSaving?: boolean;
  isGoogleConnected?: boolean;
}

export function StockForm({
  onSave,
  editingTransaction,
  onCancelEdit,
  isSaving = false,
  isGoogleConnected = false,
}: StockFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>('IN');
  const [date, setDate] = useState<string>(today);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [productName, setProductName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('ชิ้น');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [reporter, setReporter] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Populate form if editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      if (DEFAULT_CATEGORIES.includes(editingTransaction.category)) {
        setCategory(editingTransaction.category);
        setIsCustomCategory(false);
      } else {
        setCategory('__CUSTOM__');
        setCustomCategory(editingTransaction.category);
        setIsCustomCategory(true);
      }
      setProductName(editingTransaction.productName);
      setQuantity(String(editingTransaction.quantity));
      setUnit(editingTransaction.unit || 'ชิ้น');
      setUnitPrice(String(editingTransaction.unitPrice));
      setReporter(editingTransaction.reporter);
      setNote(editingTransaction.note || '');
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  const resetForm = () => {
    setType('IN');
    setDate(today);
    setCategory(DEFAULT_CATEGORIES[0]);
    setIsCustomCategory(false);
    setCustomCategory('');
    setProductName('');
    setQuantity('1');
    setUnit('ชิ้น');
    setUnitPrice('');
    setNote('');
    setErrorMsg('');
  };

  const parsedQty = Math.max(0, parseInt(quantity, 10) || 0);
  const parsedPrice = Math.max(0, parseFloat(unitPrice) || 0);
  const totalPrice = parsedQty * parsedPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalCategory = isCustomCategory ? customCategory.trim() : category;

    if (!date) {
      setErrorMsg('กรุณาระบุวันที่');
      return;
    }
    if (!finalCategory) {
      setErrorMsg('กรุณาเลือกหรือระบุกลุ่มที่ผลิตสินค้า');
      return;
    }
    if (!productName.trim()) {
      setErrorMsg('กรุณาระบุชื่อรายการสินค้า');
      return;
    }
    if (parsedQty <= 0) {
      setErrorMsg('จำนวนสินค้าต้องมากกว่า 0');
      return;
    }
    if (parsedPrice < 0) {
      setErrorMsg('ราคาขายต้องไม่ติดลบ');
      return;
    }
    if (!reporter.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้แจ้ง');
      return;
    }

    try {
      await onSave(
        {
          date,
          type,
          category: finalCategory,
          productName: productName.trim(),
          quantity: parsedQty,
          unit,
          unitPrice: parsedPrice,
          totalPrice,
          reporter: reporter.trim(),
          note: note.trim() || undefined,
        },
        editingTransaction ? editingTransaction.id : undefined
      );

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);

      if (!editingTransaction) {
        setProductName('');
        setUnitPrice('');
        setQuantity('1');
        setNote('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar with indicator */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              type === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {type === 'IN' ? (
              <ArrowDownLeft className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {editingTransaction ? 'แก้ไขรายการสต๊อกสินค้า' : 'ฟอร์มบันทึกสต๊อกสินค้า เข้า-ออก'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isGoogleConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  บันทึกลง Google Sheets หลังบ้านอัตโนมัติ
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  กรอกข้อมูลเพื่อบันทึกประวัติสต๊อก
                </span>
              )}
            </div>
          </div>
        </div>

        {editingTransaction && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 transition"
          >
            <X className="w-3.5 h-3.5" /> ยกเลิกแก้ไข
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span className="font-semibold">ข้อผิดพลาด:</span> {errorMsg}
          </div>
        )}

        {/* Success Alert */}
        {showSuccessToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {editingTransaction
                ? 'อัปเดตข้อมูลใน Google Sheets สำเร็จเรียบร้อย!'
                : isGoogleConnected
                ? 'บันทึกข้อมูลลง Google Sheets หลังบ้านสำเร็จเรียบร้อย!'
                : 'บันทึกข้อมูลสต๊อกสำเร็จ!'}
            </span>
          </div>
        )}

        {/* 1. ประเภทรายการ (เข้า / ออก) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ประเภทรายการสต๊อก <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                type === 'IN'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>รับเข้า (IN)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                type === 'OUT'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>จ่ายออก (OUT)</span>
            </button>
          </div>
        </div>

        {/* 2. วันที่ */}
        <div>
          <label
            htmlFor="stock-date"
            className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            วันที่ทำรายการ <span className="text-rose-500">*</span>
          </label>
          <input
            id="stock-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white"
          />
        </div>

        {/* 3. กลุ่มที่ผลิตสินค้า */}
        <div>
          <label
            htmlFor="stock-category"
            className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            กลุ่มที่ผลิตสินค้า <span className="text-rose-500">*</span>
          </label>
          <select
            id="stock-category"
            value={isCustomCategory ? '__CUSTOM__' : category}
            onChange={(e) => {
              if (e.target.value === '__CUSTOM__') {
                setIsCustomCategory(true);
              } else {
                setIsCustomCategory(false);
                setCategory(e.target.value);
              }
            }}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white text-slate-800"
          >
            <option value="">-- เลือกกลุ่มที่ผลิตสินค้า --</option>
            {DEFAULT_CATEGORIES.map((cat, idx) => (
              <option key={cat} value={cat}>
                {idx + 1}. {cat}
              </option>
            ))}
            <option value="__CUSTOM__">+ กำหนดกลุ่มใหม่เอง...</option>
          </select>

          {isCustomCategory && (
            <input
              type="text"
              placeholder="พิมพ์ชื่อกลุ่มที่ผลิตสินค้า..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="mt-2 w-full text-xs px-3 py-2 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none bg-indigo-50/30"
              required
            />
          )}
        </div>

        {/* 4. รายการสินค้า */}
        <div>
          <label
            htmlFor="stock-product"
            className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            รายการสินค้า <span className="text-rose-500">*</span>
          </label>
          <input
            id="stock-product"
            type="text"
            required
            placeholder="เช่น ข้าวเกรียบปลาอบกรอบ, ชาอัญชัน 300ml"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white"
          />
        </div>

        {/* 5. ราคาขายต่อหน่วย & จำนวน & หน่วยนับ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="stock-price"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              ราคาขาย/หน่วย (฿) <span className="text-rose-500">*</span>
            </label>
            <input
              id="stock-price"
              type="number"
              min="0"
              step="any"
              required
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white font-medium"
            />
          </div>

          <div>
            <label
              htmlFor="stock-qty"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              จำนวน <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-1.5">
              <input
                id="stock-qty"
                type="number"
                min="1"
                step="1"
                required
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white font-medium"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-20 text-xs px-1.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50 text-slate-700"
              >
                {DEFAULT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* คำนวณมูลค่ารวมอัตโนมัติ */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">รวมมูลค่ารายการ:</span>
          <div className="text-right">
            <span className="text-base font-bold text-indigo-600">
              ฿{totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 6. ผู้แจ้ง */}
        <div>
          <label
            htmlFor="stock-reporter"
            className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            ผู้แจ้ง <span className="text-rose-500">*</span>
          </label>
          <input
            id="stock-reporter"
            type="text"
            required
            placeholder="ชื่อ-นามสกุล ผู้แจ้งหรือเจ้าหน้าที่"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white"
          />
        </div>

        {/* 7. หมายเหตุ (ถ้ามี) */}
        <div>
          <label
            htmlFor="stock-note"
            className="block text-xs font-medium text-slate-600 mb-1"
          >
            หมายเหตุเพิ่มเติม (ถ้ามี)
          </label>
          <textarea
            id="stock-note"
            rows={2}
            placeholder="เช่น ล็อตผลิตที่ 04, นำส่งสาขาสยาม"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 ${
              type === 'IN'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
            id="submit-stock-btn"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึกลง Google Sheets...</span>
              </>
            ) : editingTransaction ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> บันทึกการแก้ไข
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />{' '}
                {type === 'IN' ? 'บันทึกรับเข้าสต๊อก' : 'บันทึกจ่ายออกสต๊อก'}
              </>
            )}
          </button>

          {!editingTransaction && (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              title="ล้างข้อมูลในฟอร์ม"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
