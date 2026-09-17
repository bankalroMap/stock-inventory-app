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
  Sparkles,
  Layers,
  Settings,
} from 'lucide-react';
import { StockTransaction, TransactionType, ProductCatalogItem } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS } from '../utils/storage';
import { AppUser } from '../utils/auth';

interface StockFormProps {
  onSave: (
    transaction: Omit<StockTransaction, 'id' | 'createdAt'>,
    idToUpdate?: string
  ) => Promise<boolean | void> | void;
  editingTransaction: StockTransaction | null;
  onCancelEdit: () => void;
  isSaving?: boolean;
  isGoogleConnected?: boolean;
  catalog?: ProductCatalogItem[];
  onOpenCatalogModal?: () => void;
  prefillProduct?: { name: string; type: TransactionType; timestamp: number } | null;
  currentUser?: AppUser | null;
}

export function StockForm({
  onSave,
  editingTransaction,
  onCancelEdit,
  isSaving = false,
  isGoogleConnected = false,
  catalog = [],
  onOpenCatalogModal,
  prefillProduct,
  currentUser,
}: StockFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>('IN');
  const [date, setDate] = useState<string>(today);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [productName, setProductName] = useState<string>('');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [autoPriceNotice, setAutoPriceNotice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('ชิ้น');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [reporter, setReporter] = useState<string>(currentUser ? currentUser.name : '');
  const [note, setNote] = useState<string>('');

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Keep reporter in sync when currentUser changes if not editing
  useEffect(() => {
    if (!editingTransaction && currentUser && !reporter) {
      setReporter(currentUser.name);
    }
  }, [currentUser, editingTransaction]);

  // Auto-switch price when changing type between IN and OUT if a catalog product is chosen
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (selectedCatalogId) {
      const item = catalog.find((c) => c.id === selectedCatalogId);
      if (item) {
        if (newType === 'IN') {
          const inPrice = item.costPrice !== undefined && item.costPrice > 0 ? item.costPrice : item.sellingPrice;
          setUnitPrice(String(inPrice));
          setAutoPriceNotice(`ดึงราคารับเข้าอัตโนมัติ: ฿${inPrice.toLocaleString('th-TH')}`);
        } else {
          setUnitPrice(String(item.sellingPrice));
          setAutoPriceNotice(`ดึงราคาขายอัตโนมัติ: ฿${item.sellingPrice.toLocaleString('th-TH')}`);
        }
      }
    }
  };

  // When a catalog item is chosen from the dropdown
  const handleSelectCatalogProduct = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    if (!catalogId) {
      setAutoPriceNotice('');
      return;
    }

    const item = catalog.find((c) => c.id === catalogId);
    if (!item) return;

    // Auto-fill Product Name
    setProductName(item.name);

    // Auto-fill Category
    if (DEFAULT_CATEGORIES.includes(item.category)) {
      setCategory(item.category);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setCategory('__CUSTOM__');
      setIsCustomCategory(true);
      setCustomCategory(item.category);
    }

    // Auto-fill Unit
    setUnit(item.unit || 'ชิ้น');

    // Auto-fill Price based on IN (cost) or OUT (sale)
    if (type === 'IN') {
      const inPrice = item.costPrice !== undefined && item.costPrice > 0 ? item.costPrice : item.sellingPrice;
      setUnitPrice(String(inPrice));
      setAutoPriceNotice(`ดึงราคารับเข้าอัตโนมัติ: ฿${inPrice.toLocaleString('th-TH')}`);
    } else {
      setUnitPrice(String(item.sellingPrice));
      setAutoPriceNotice(`ดึงราคาขายอัตโนมัติ: ฿${item.sellingPrice.toLocaleString('th-TH')}`);
    }
  };

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

      // Check if product exists in catalog
      const matched = catalog.find(
        (c) => c.name.trim().toLowerCase() === editingTransaction.productName.trim().toLowerCase()
      );
      if (matched) {
        setSelectedCatalogId(matched.id);
        setIsManualInput(false);
      } else {
        setIsManualInput(true);
      }
      setAutoPriceNotice('');
    } else {
      resetForm();
    }
  }, [editingTransaction, catalog]);

  // Handle prefill from inventory table action buttons (+ รับเข้า / - จ่ายออก)
  useEffect(() => {
    if (!prefillProduct) return;

    setType(prefillProduct.type);
    const matched = catalog.find(
      (c) => c.name.trim().toLowerCase() === prefillProduct.name.trim().toLowerCase()
    );

    if (matched) {
      setSelectedCatalogId(matched.id);
      setIsManualInput(false);
      setProductName(matched.name);
      if (DEFAULT_CATEGORIES.includes(matched.category)) {
        setCategory(matched.category);
        setIsCustomCategory(false);
        setCustomCategory('');
      } else {
        setCategory('__CUSTOM__');
        setIsCustomCategory(true);
        setCustomCategory(matched.category);
      }
      setUnit(matched.unit || 'ชิ้น');

      if (prefillProduct.type === 'IN') {
        const inPrice =
          matched.costPrice !== undefined && matched.costPrice > 0
            ? matched.costPrice
            : matched.sellingPrice;
        setUnitPrice(String(inPrice));
        setAutoPriceNotice(`ดึงราคารับเข้าอัตโนมัติ: ฿${inPrice.toLocaleString('th-TH')}`);
      } else {
        setUnitPrice(String(matched.sellingPrice));
        setAutoPriceNotice(`ดึงราคาขายอัตโนมัติ: ฿${matched.sellingPrice.toLocaleString('th-TH')}`);
      }
    } else {
      setSelectedCatalogId('');
      setIsManualInput(true);
      setProductName(prefillProduct.name);
      setAutoPriceNotice('');
    }

    setQuantity('1');
    setErrorMsg('');
  }, [prefillProduct, catalog]);

  const resetForm = () => {
    setType('IN');
    setDate(today);
    setCategory(DEFAULT_CATEGORIES[0]);
    setIsCustomCategory(false);
    setCustomCategory('');
    setProductName('');
    setSelectedCatalogId('');
    setAutoPriceNotice('');
    setQuantity('1');
    setUnit('ชิ้น');
    setUnitPrice('');
    setReporter(currentUser ? currentUser.name : '');
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
      setErrorMsg('กรุณาระบุชื่อรายการสินค้า (เลือกจาก Dropdown หรือพิมพ์เอง)');
      return;
    }
    if (parsedQty <= 0) {
      setErrorMsg('จำนวนสินค้าต้องมากกว่า 0');
      return;
    }
    if (parsedPrice < 0) {
      setErrorMsg('ราคาต่อหน่วยต้องไม่ติดลบ');
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
        setSelectedCatalogId('');
        setAutoPriceNotice('');
        setUnitPrice('');
        setQuantity('1');
        setNote('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Group catalog by category for nice optgroup in dropdown
  const catalogByCategory = React.useMemo(() => {
    const map = new Map<string, ProductCatalogItem[]>();
    catalog.forEach((item) => {
      const cat = item.category || 'สินค้าทั่วไป';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries());
  }, [catalog]);

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
                  เลือกสินค้าจาก Dropdown หรือพิมพ์เอง
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
              onClick={() => handleTypeChange('IN')}
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
              onClick={() => handleTypeChange('OUT')}
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

        {/* 3. รายการสินค้า (DROPDOWN / MANUAL SELECT) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="stock-product"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-slate-400" />
              รายการสินค้า <span className="text-rose-500">*</span>
            </label>

            <div className="flex items-center gap-2">
              {/* Toggle Manual / Dropdown */}
              <button
                type="button"
                onClick={() => {
                  setIsManualInput(!isManualInput);
                  setAutoPriceNotice('');
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
              >
                {isManualInput ? (
                  <>
                    <Layers className="w-3 h-3" />
                    <span>ใช้ Dropdown เลือกสินค้า</span>
                  </>
                ) : (
                  <>
                    <span>พิมพ์ชื่อเอง</span>
                  </>
                )}
              </button>

              {/* Manage Catalog button */}
              {onOpenCatalogModal && (
                <button
                  type="button"
                  onClick={onOpenCatalogModal}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 bg-slate-100 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition"
                  title="จัดการหรือนำเข้าคลังสินค้าเดิมจาก Excel"
                >
                  <Settings className="w-3 h-3" />
                  <span className="hidden sm:inline">คลังสินค้า</span>
                </button>
              )}
            </div>
          </div>

          {!isManualInput && catalog.length > 0 ? (
            <div>
              <select
                id="stock-product-select"
                value={selectedCatalogId}
                onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50/20 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition text-slate-900 font-medium"
              >
                <option value="">-- แตะเพื่อเลือกสินค้าจากคลังสินค้า ({catalog.length} รายการ) --</option>
                {catalogByCategory.map(([catName, items]) => (
                  <optgroup key={catName} label={`กลุ่ม: ${catName}`}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code ? `[${item.code}] ` : ''}
                        {item.name} (
                        {type === 'IN'
                          ? `รับเข้า ฿${(item.costPrice ?? item.sellingPrice).toLocaleString('th-TH')}`
                          : `ราคาขาย ฿${item.sellingPrice.toLocaleString('th-TH')}`}
                        /{item.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Quick info bar under dropdown */}
              {selectedCatalogId && (
                <div className="mt-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    เลือก: {productName}
                  </span>
                  <span className="text-emerald-700 font-semibold">{autoPriceNotice}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                id="stock-product"
                type="text"
                required
                placeholder="เช่น ข้าวเกรียบปลาอบกรอบ, ชาอัญชัน 300ml"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setSelectedCatalogId('');
                  setAutoPriceNotice('');
                }}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white"
              />
              {catalog.length === 0 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 แนะนำ: กดปุ่ม "คลังสินค้าหลัก" ที่แถบด้านบนเพื่อนำเข้าไฟล์ Excel/CSV หรือบันทึกสินค้าเดิม
                </p>
              )}
            </div>
          )}
        </div>

        {/* 4. กลุ่มที่ผลิตสินค้า */}
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

        {/* 5. ราคาต่อหน่วย (ขึ้นอัตโนมัติ) & จำนวน & หน่วยนับ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="stock-price"
                className="block text-xs font-semibold text-slate-700"
              >
                {type === 'IN' ? 'ราคารับเข้า/หน่วย (฿)' : 'ราคาขาย/หน่วย (฿)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                id="stock-price"
                type="number"
                min="0"
                step="any"
                required
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => {
                  setUnitPrice(e.target.value);
                  setAutoPriceNotice('');
                }}
                className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white font-semibold ${
                  autoPriceNotice ? 'border-emerald-300 bg-emerald-50/30 text-emerald-900' : 'border-slate-200'
                }`}
              />
            </div>
            {autoPriceNotice && (
              <span className="text-[10px] text-emerald-600 block mt-0.5">
                ✓ ขึ้นราคาอัตโนมัติ (แก้ไขได้)
              </span>
            )}
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
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="stock-reporter"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              ผู้แจ้ง <span className="text-rose-500">*</span>
            </label>
            {currentUser && reporter !== currentUser.name && (
              <button
                type="button"
                onClick={() => setReporter(currentUser.name)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                ใช้ชื่อฉัน ({currentUser.id})
              </button>
            )}
          </div>
          <input
            id="stock-reporter"
            type="text"
            required
            placeholder="ชื่อ-นามสกุล ผู้แจ้งหรือเจ้าหน้าที่"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white"
          />
          {currentUser && (
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span>บันทึกโดยบัญชี:</span>
              <span className="font-semibold text-slate-600">{currentUser.name}</span>
              <span className="text-slate-400">({currentUser.id})</span>
            </p>
          )}
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

