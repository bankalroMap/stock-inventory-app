import React, { useState, useMemo, useRef } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Edit2,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { ProductCatalogItem } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS, parseCatalogFromText } from '../utils/storage';
import { SpreadsheetInfo } from '../services/googleSheets';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: ProductCatalogItem[];
  onSaveCatalog: (newCatalog: ProductCatalogItem[]) => void;
  onResetCatalog: () => void;
  spreadsheetInfo?: SpreadsheetInfo | null;
  isGoogleConnected?: boolean;
  onSyncFromGoogleSheets?: () => Promise<void>;
  isSyncingCatalog?: boolean;
}

type TabType = 'LIST' | 'IMPORT' | 'ADD_EDIT';

export function ProductCatalogModal({
  isOpen,
  onClose,
  catalog,
  onSaveCatalog,
  onResetCatalog,
  spreadsheetInfo,
  isGoogleConnected,
  onSyncFromGoogleSheets,
  isSyncingCatalog,
}: ProductCatalogModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add / Edit item form state
  const [editingItem, setEditingItem] = useState<ProductCatalogItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formUnit, setFormUnit] = useState('ชิ้น');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formInitialStock, setFormInitialStock] = useState('');
  const [formError, setFormError] = useState('');

  // Import state
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importErrorMsg, setImportErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse preview on text change
  const parsedPreview = useMemo(() => {
    if (!importText.trim()) return [];
    return parseCatalogFromText(importText);
  }, [importText]);

  // Filtered catalog
  const filteredList = useMemo(() => {
    return catalog.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        (item.code && item.code.toLowerCase().includes(term));
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [catalog, searchTerm, categoryFilter]);

  // All distinct categories in catalog
  const allCategories = useMemo(() => {
    const s = new Set<string>(DEFAULT_CATEGORIES);
    catalog.forEach((c) => {
      if (c.category) s.add(c.category);
    });
    return Array.from(s);
  }, [catalog]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(DEFAULT_CATEGORIES[0]);
    setFormCustomCategory('');
    setFormUnit('ชิ้น');
    setFormSellingPrice('');
    setFormCostPrice('');
    setFormCode('');
    setFormInitialStock('');
    setFormError('');
    setActiveTab('ADD_EDIT');
  };

  const handleStartEdit = (item: ProductCatalogItem) => {
    setEditingItem(item);
    setFormName(item.name);
    if (DEFAULT_CATEGORIES.includes(item.category)) {
      setFormCategory(item.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('__CUSTOM__');
      setFormCustomCategory(item.category);
    }
    setFormUnit(item.unit);
    setFormSellingPrice(String(item.sellingPrice));
    setFormCostPrice(item.costPrice !== undefined ? String(item.costPrice) : '');
    setFormCode(item.code || '');
    setFormInitialStock(item.initialStock !== undefined ? String(item.initialStock) : '');
    setFormError('');
    setActiveTab('ADD_EDIT');
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('คุณต้องการลบสินค้านี้ออกจากคลังสินค้าหลักหรือไม่?')) {
      const updated = catalog.filter((item) => item.id !== id);
      onSaveCatalog(updated);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalCat = formCategory === '__CUSTOM__' ? formCustomCategory.trim() : formCategory;
    if (!formName.trim()) {
      setFormError('กรุณากรอกชื่อสินค้า');
      return;
    }
    if (!finalCat) {
      setFormError('กรุณาเลือกหรือระบุกลุ่มที่ผลิตสินค้า');
      return;
    }

    const sellingP = parseFloat(formSellingPrice);
    if (isNaN(sellingP) || sellingP < 0) {
      setFormError('ราคาขายต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
      return;
    }

    const costP = formCostPrice ? parseFloat(formCostPrice) : undefined;
    const stockInit = formInitialStock ? parseInt(formInitialStock, 10) : undefined;

    if (editingItem) {
      const updated = catalog.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: formName.trim(),
            category: finalCat,
            unit: formUnit || 'ชิ้น',
            sellingPrice: sellingP,
            costPrice: costP,
            code: formCode.trim() || undefined,
            initialStock: stockInit,
          };
        }
        return item;
      });
      onSaveCatalog(updated);
    } else {
      const newItem: ProductCatalogItem = {
        id: `PROD-${Date.now().toString().slice(-6)}`,
        name: formName.trim(),
        category: finalCat,
        unit: formUnit || 'ชิ้น',
        sellingPrice: sellingP,
        costPrice: costP,
        code: formCode.trim() || undefined,
        initialStock: stockInit,
      };
      onSaveCatalog([newItem, ...catalog]);
    }

    setActiveTab('LIST');
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Execute Import
  const handleConfirmImport = () => {
    setImportErrorMsg('');
    setImportSuccessMsg('');

    if (parsedPreview.length === 0) {
      setImportErrorMsg('ไม่พบข้อมูลสินค้าที่ถูกต้อง กรุณาตรวจสอบข้อความหรือไฟล์ที่นำเข้า');
      return;
    }

    let nextCatalog: ProductCatalogItem[] = [];
    if (importMode === 'REPLACE') {
      nextCatalog = parsedPreview;
    } else {
      // Append mode: prevent exact duplicate names or update
      const existingNames = new Set(catalog.map((c) => c.name.trim().toLowerCase()));
      const newItems = parsedPreview.filter(
        (p) => !existingNames.has(p.name.trim().toLowerCase())
      );
      nextCatalog = [...catalog, ...newItems];
    }

    onSaveCatalog(nextCatalog);
    setImportSuccessMsg(`นำเข้าข้อมูลสินค้าเรียบร้อยแล้ว จำนวน ${parsedPreview.length} รายการ!`);
    setImportText('');

    setTimeout(() => {
      setImportSuccessMsg('');
      setActiveTab('LIST');
    }, 1200);
  };

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const headers = 'ชื่อสินค้า,กลุ่มที่ผลิตสินค้า,ราคาขาย,ราคาทุน,หน่วยนับ,รหัสสินค้า,สต๊อกยกมา';
    const rows = [
      'กระเป๋ากระจูดทรงโท้ท ลายริ้ว,กระจูดรายา,350,220,ชิ้น,KJD-01,25',
      'ซองใส่เอกสารกระจูด A4,กระจูดรายา,190,120,ชิ้น,KJD-02,40',
      'หมวกกระจูดปีกกว้าง Change,กระจูด Change,280,180,ชิ้น,CHG-01,30',
      'น้ำผึ้งชันโรงแท้ 100% (250 มล.),น้ำผึ้งชันโรงบ้านไพรวัน,390,260,ขวด,HNY-01,50',
      'ผ้าพันคอทอตอหลังลายยกดอก,ผ้าทอตอหลัง,550,350,ผืน,WVN-01,20',
      'เรือกอและจำลอง ขนาด 10 นิ้ว (ไม้สัก),เรือกอและจำลอง,1200,750,ลำ,KOR-01,10',
    ];
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_product_catalog.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  คลังสินค้าหลัก & แคตตาล็อกสินค้า
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {catalog.length} รายการ
                </span>
              </div>
              <p className="text-xs text-slate-500">
                นำเข้ารายการสินค้าเดิมและกำหนดราคาไว้ล่วงหน้า เพื่อเลือกผ่าน Dropdown ในฟอร์ม เข้า-ออก โดยไม่ต้องพิมพ์ซ้ำ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'LIST'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>รายการสินค้า ({catalog.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('IMPORT')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'IMPORT'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้าจาก Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={handleStartAdd}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'ADD_EDIT'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingItem ? 'แก้ไขข้อมูลสินค้า' : '+ เพิ่มสินค้าใหม่'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
              title="ดาวน์โหลดไฟล์ตัวอย่าง Excel/CSV สำหรับกรอกรายการสินค้าเดิม"
            >
              <Download className="w-3.5 h-3.5" />
              <span>โหลดเทมเพลต CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตแคตตาล็อกสินค้าเป็นค่าตัวอย่างเริ่มต้นหรือไม่?')) {
                  onResetCatalog();
                }
              }}
              className="text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="คืนค่าตัวอย่างเริ่มต้น"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Google Sheets Sync Banner */}
        {isGoogleConnected && spreadsheetInfo && (
          <div className="mx-6 mt-4 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">เชื่อมต่อ Google Sheets</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    แท็บ &ldquo;คลังสินค้า&rdquo;
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  คุณสามารถเพิ่ม แก้ไข หรือนำเข้ารายการสินค้าบน Google Sheets แท็บ &ldquo;คลังสินค้า&rdquo; ได้โดยตรง
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
              {onSyncFromGoogleSheets && (
                <button
                  type="button"
                  onClick={onSyncFromGoogleSheets}
                  disabled={isSyncingCatalog}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition shadow-2xs disabled:opacity-50"
                  title="ดึงรายการสินค้าล่าสุดจากแท็บคลังสินค้าบน Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingCatalog ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCatalog ? 'กำลังดึง...' : 'ดึงจาก Google Sheets'}</span>
                </button>
              )}
              {spreadsheetInfo.url && (
                <a
                  href={
                    spreadsheetInfo.catalogSheetId !== undefined
                      ? `${spreadsheetInfo.url}#gid=${spreadsheetInfo.catalogSheetId}`
                      : spreadsheetInfo.url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                >
                  <span>เปิด Google Sheets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: LIST */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อสินค้า รหัส หรือกลุ่ม..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-700 w-full sm:w-auto"
                  >
                    <option value="ALL">ทุกกลุ่มที่ผลิตสินค้า</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มสินค้า</span>
                  </button>
                </div>
              </div>

              {/* Table of Products */}
              {filteredList.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    {catalog.length === 0
                      ? 'ยังไม่มีรายการสินค้าในแคตตาล็อก'
                      : 'ไม่พบรายการสินค้าที่ตรงกับคำค้นหา'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    คุณสามารถนำเข้าไฟล์สินค้าเดิมจาก Excel หรือกดปุ่มเพิ่มสินค้าใหม่เพื่อเริ่มใช้งาน Dropdown
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('IMPORT')}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> นำเข้าจาก Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleStartAdd}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                    >
                      + เพิ่มรายการ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">รหัส/SKU</th>
                          <th className="py-2.5 px-3">รายการสินค้า</th>
                          <th className="py-2.5 px-3">กลุ่มที่ผลิตสินค้า</th>
                          <th className="py-2.5 px-3 text-right">ราคาขาย (ออก)</th>
                          <th className="py-2.5 px-3 text-right">ราคาทุน (เข้า)</th>
                          <th className="py-2.5 px-3 text-center">หน่วย</th>
                          <th className="py-2.5 px-3 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredList.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              {item.code || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800">{item.name}</span>
                              {item.initialStock !== undefined && (
                                <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  ยกมา: {item.initialStock}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-rose-600">
                              ฿{item.sellingPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                              {item.costPrice !== undefined
                                ? `฿${item.costPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                                {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                  title="แก้ไขสินค้านี้"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="ลบสินค้านี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT FROM EXCEL / CSV */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-5">
              {/* Google Sheets Direct Edit Option */}
              {isGoogleConnected && spreadsheetInfo && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        คุณมีระบบหลังบ้านบน Google Sheets อยู่แล้ว!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        สามารถเปิด Google Sheets แล้วเข้าไปที่แท็บ <strong>&ldquo;คลังสินค้า&rdquo;</strong> เพื่อพิมพ์ วาง หรือแก้ไขรายการสินค้าได้โดยตรง เมื่อบันทึกแล้วกดปุ่ม <strong>&ldquo;ดึงข้อมูลจาก Google Sheets&rdquo;</strong> รายการจะอัปเดตลงระบบและแสดงใน Dropdown ทันที
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={
                        spreadsheetInfo.catalogSheetId !== undefined
                          ? `${spreadsheetInfo.url}#gid=${spreadsheetInfo.catalogSheetId}`
                          : spreadsheetInfo.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                    >
                      <span>เปิดแท็บ &ldquo;คลังสินค้า&rdquo;</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Info banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <p className="font-semibold">
                    วิธีนำเข้าข้อมูลจาก Excel / Google Sheets ที่มีอยู่แล้ว:
                  </p>
                  <p className="text-indigo-700 leading-relaxed">
                    1. สามารถ **ลากไฟล์ CSV / Excel** มาวาง หรือกดเลือกไฟล์ได้ทันที <br />
                    2. หรือเปิดไฟล์ Excel แล้วคลุมดำคอลัมน์ กด <b>Ctrl+C (คัดลอก)</b> แล้วนำมา <b>Ctrl+V (วาง)</b> ในกล่องข้อความด้านล่างนี้ได้โดยตรง
                  </p>
                  <p className="text-[11px] text-indigo-600">
                    ลำดับคอลัมน์มาตรฐาน: <b>ชื่อสินค้า, กลุ่มที่ผลิตสินค้า, ราคาขาย, ราคาทุน, หน่วยนับ, รหัสสินค้า, สต๊อกยกมา</b>
                  </p>
                </div>
              </div>

              {/* Upload File Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เลือกไฟล์ CSV จากเครื่อง
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-white border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์ .csv จากเครื่องคอมพิวเตอร์</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1 underline"
                  >
                    <Download className="w-3.5 h-3.5" /> ดาวน์โหลดเทมเพลตตัวอย่าง
                  </button>
                </div>
              </div>

              {/* Paste Text / Excel area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  หรือ วางข้อความที่คัดลอกจาก Excel หรือ Google Sheets ที่นี่
                </label>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`ตัวอย่างเช่น (ก๊อปปี้จาก Excel มาวางได้เลย):
กระเป๋ากระจูดทรงโท้ท, กระจูดรายา, 350, 220, ชิ้น, KJD-01, 20
น้ำผึ้งชันโรงแท้ 100%, น้ำผึ้งชันโรงบ้านไพรวัน, 390, 260, ขวด, HNY-01, 50
ผ้าพันคอทอตอหลัง, ผ้าทอตอหลัง, 550, 350, ผืน, WVN-01, 15`}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Mode Selection */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-900">รูปแบบการนำเข้า:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="APPEND"
                    checked={importMode === 'APPEND'}
                    onChange={() => setImportMode('APPEND')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>เพิ่มต่อท้ายรายการเดิม ({catalog.length} รายการ)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-rose-600">
                  <input
                    type="radio"
                    name="importMode"
                    value="REPLACE"
                    checked={importMode === 'REPLACE'}
                    onChange={() => setImportMode('REPLACE')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>แทนที่รายการเดิมทั้งหมด (ล้างของเก่าแล้วลงใหม่)</span>
                </label>
              </div>

              {/* Status messages */}
              {importErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importErrorMsg}</span>
                </div>
              )}
              {importSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}

              {/* Parsed Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      ตรวจพบข้อมูลที่พร้อมนำเข้า: {parsedPreview.length} รายการ
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-3">ชื่อสินค้า</th>
                          <th className="py-1.5 px-3">กลุ่ม</th>
                          <th className="py-1.5 px-3 text-right">ราคาขาย</th>
                          <th className="py-1.5 px-3 text-right">ราคาทุน</th>
                          <th className="py-1.5 px-3 text-center">หน่วย</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-medium text-slate-800">{item.name}</td>
                            <td className="py-1.5 px-3 text-slate-600">{item.category}</td>
                            <td className="py-1.5 px-3 text-right font-semibold text-rose-600">
                              ฿{item.sellingPrice}
                            </td>
                            <td className="py-1.5 px-3 text-right text-emerald-600">
                              {item.costPrice !== undefined ? `฿${item.costPrice}` : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-center text-slate-500">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ยืนยันนำเข้าสินค้า ({parsedPreview.length} รายการ)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD / EDIT SINGLE ITEM */}
          {activeTab === 'ADD_EDIT' && (
            <form onSubmit={handleSaveItem} className="space-y-4 max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Boxes className="w-4 h-4 text-indigo-600" />
                {editingItem ? 'แก้ไขข้อมูลสินค้าในแคตตาล็อก' : 'เพิ่มรายการสินค้าใหม่เข้าแคตตาล็อก'}
              </h3>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ชื่อสินค้า */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อรายการสินค้า <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กระเป๋ากระจูดทรงกระบอก, น้ำผึ้งชันโรง 500ml"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* กลุ่มที่ผลิตสินค้า */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กลุ่มที่ผลิตสินค้า <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ กำหนดกลุ่มใหม่เอง...</option>
                </select>

                {formCategory === '__CUSTOM__' && (
                  <input
                    type="text"
                    required
                    placeholder="พิมพ์ชื่อกลุ่มสินค้า..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="mt-2 w-full text-xs px-3 py-2 border border-indigo-200 rounded-xl bg-indigo-50/40 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                )}
              </div>

              {/* ราคาขาย & ราคาทุน */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาขาย / จ่ายออก (฿) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">ราคาอัตโนมัติเมื่อเลือก จ่ายออก (OUT)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาทุน / รับเข้า (฿) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">ราคาอัตโนมัติเมื่อเลือก รับเข้า (IN)</p>
                </div>
              </div>

              {/* หน่วยนับ & รหัสสินค้า */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หน่วยนับ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    {DEFAULT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสสินค้า / SKU <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น KJD-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'บันทึกการแก้ไข' : 'บันทึกสินค้าใหม่'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>
            เคล็ดลับ: เมื่อเลือกชื่อสินค้าในฟอร์มบันทึกสต๊อก ระบบจะใส่ราคาขาย/ราคาทุน และหมวดหมู่ให้อัตโนมัติทันที
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
