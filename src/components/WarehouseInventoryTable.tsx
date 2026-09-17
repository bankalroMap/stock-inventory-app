import { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  PackageX,
  PackageCheck,
  TrendingDown,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { ProductCatalogItem, StockTransaction, ProductStockStatus, ProductInventorySummary } from '../types';
import { getFullInventoryList } from '../utils/inventory';
import { DEFAULT_CATEGORIES } from '../utils/storage';

interface WarehouseInventoryTableProps {
  catalog: ProductCatalogItem[];
  transactions: StockTransaction[];
  onSelectProductForTransaction?: (productName: string, type: 'IN' | 'OUT') => void;
  onOpenCatalogModal?: () => void;
  isGoogleConnected?: boolean;
}

type SortField = 'name' | 'currentStock' | 'totalStockValue' | 'status' | 'daysWithoutSale';
type SortOrder = 'asc' | 'desc';

export function WarehouseInventoryTable({
  catalog,
  transactions,
  onSelectProductForTransaction,
  onOpenCatalogModal,
  isGoogleConnected = false,
}: WarehouseInventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProductStockStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('currentStock');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Compute full inventory summary
  const inventoryList = useMemo(() => {
    return getFullInventoryList(catalog, transactions);
  }, [catalog, transactions]);

  // Counts for each status
  const counts = useMemo(() => {
    const res = {
      all: inventoryList.length,
      normal: 0,
      lowStock: 0,
      deadStock: 0,
      outOfStock: 0,
      totalStockQty: 0,
      totalStockValue: 0,
    };

    inventoryList.forEach((item) => {
      res.totalStockQty += Math.max(0, item.currentStock);
      res.totalStockValue += item.totalStockValue;

      if (item.status === 'NORMAL') res.normal++;
      else if (item.status === 'LOW_STOCK') res.lowStock++;
      else if (item.status === 'DEAD_STOCK') res.deadStock++;
      else if (item.status === 'OUT_OF_STOCK') res.outOfStock++;
    });

    return res;
  }, [inventoryList]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    inventoryList.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventoryList]);

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return inventoryList
      .filter((item) => {
        // Search
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          item.name.toLowerCase().includes(term) ||
          item.code.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          (item.note && item.note.toLowerCase().includes(term));

        // Status
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

        // Category
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'daysWithoutSale') {
          valA = a.daysWithoutSale ?? -1;
          valB = b.daysWithoutSale ?? -1;
        } else if (sortField === 'status') {
          const priority: Record<ProductStockStatus, number> = {
            DEAD_STOCK: 1,
            OUT_OF_STOCK: 2,
            LOW_STOCK: 3,
            NORMAL: 4,
          };
          valA = priority[a.status];
          valB = priority[b.status];
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [inventoryList, searchTerm, statusFilter, categoryFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'currentStock' ? 'asc' : 'desc');
    }
  };

  const exportToCsv = () => {
    const headers = [
      'รหัสสินค้า (SKU)',
      'ชื่อรายการสินค้า',
      'กลุ่มที่ผลิตสินค้า',
      'จำนวนคงเหลือในคลัง',
      'หน่วยนับ',
      'สถานะสินค้า',
      'ราคาทุน (บาท)',
      'ราคาขาย (บาท)',
      'มูลค่าสต๊อกคงเหลือ (บาท)',
      'รับเข้ารวม',
      'จ่ายออกรวม',
      'ขายไม่ออก (วัน)',
      'วันที่ขายล่าสุด',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.code.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.currentStock,
      `"${item.unit.replace(/"/g, '""')}"`,
      `"${item.statusLabel}"`,
      item.costPrice,
      item.sellingPrice,
      item.totalStockValue,
      item.totalIn,
      item.totalOut,
      item.daysWithoutSale !== undefined ? item.daysWithoutSale : '-',
      item.lastOutDate || '-',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Boxes className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ตารางสินค้าในคลังทั้งหมด &amp; สถานะสินค้า
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {inventoryList.length} รายการ
              </span>
              {filteredItems.length > 5 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  แสดง 5 ลำดับแรก (เลื่อนเมาส์เพื่อดูต่อ)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              แสดงยอดคงเหลือเรียลไทม์ พร้อมระบบแจ้งเตือน <strong>สินค้าปกติ</strong>, <strong>สต๊อกต่ำ</strong> (&lt;5 ชิ้น), <strong>DeadStock</strong> (ขายไม่ออก 30 วัน), และ <strong>สินค้าหมด</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCatalogModal && (
              <button
                type="button"
                onClick={onOpenCatalogModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <span>จัดการคลังสินค้าหลัก</span>
              </button>
            )}
            <button
              type="button"
              onClick={exportToCsv}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Status Filter Tabs / Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {/* 1. สินค้าปกติ (สีเขียว) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'NORMAL' ? 'ALL' : 'NORMAL')}
            className={`p-3 rounded-xl border text-left transition relative ${
              statusFilter === 'NORMAL'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                statusFilter === 'NORMAL' ? 'text-white' : 'text-emerald-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'NORMAL' ? 'bg-white' : 'bg-emerald-500'}`} />
                สินค้าปกติ
              </span>
              <span className={`text-base font-black ${
                statusFilter === 'NORMAL' ? 'text-white' : 'text-emerald-700'
              }`}>
                {counts.normal}
              </span>
            </div>
            <p className={`text-[10px] mt-1 ${
              statusFilter === 'NORMAL' ? 'text-emerald-100' : 'text-emerald-600'
            }`}>
              สต๊อก &ge; 5 ชิ้น, หมุนเวียนปกติ
            </p>
          </button>

          {/* 2. สต๊อกต่ำ (สีเหลือง) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
            className={`p-3 rounded-xl border text-left transition relative ${
              statusFilter === 'LOW_STOCK'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/80 text-amber-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                statusFilter === 'LOW_STOCK' ? 'text-white' : 'text-amber-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'LOW_STOCK' ? 'bg-white' : 'bg-amber-500'}`} />
                สต๊อกต่ำ
              </span>
              <span className={`text-base font-black ${
                statusFilter === 'LOW_STOCK' ? 'text-white' : 'text-amber-700'
              }`}>
                {counts.lowStock}
              </span>
            </div>
            <p className={`text-[10px] mt-1 ${
              statusFilter === 'LOW_STOCK' ? 'text-amber-100' : 'text-amber-600'
            }`}>
              เหลือน้อยกว่า 5 ชิ้น ควรเติม
            </p>
          </button>

          {/* 3. DeadStock (สีเทา) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'DEAD_STOCK' ? 'ALL' : 'DEAD_STOCK')}
            className={`p-3 rounded-xl border text-left transition relative ${
              statusFilter === 'DEAD_STOCK'
                ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                statusFilter === 'DEAD_STOCK' ? 'text-white' : 'text-slate-700'
              }`}>
                <Clock className={`w-3 h-3 ${statusFilter === 'DEAD_STOCK' ? 'text-white' : 'text-slate-500'}`} />
                DeadStock
              </span>
              <span className={`text-base font-black ${
                statusFilter === 'DEAD_STOCK' ? 'text-white' : 'text-slate-800'
              }`}>
                {counts.deadStock}
              </span>
            </div>
            <p className={`text-[10px] mt-1 ${
              statusFilter === 'DEAD_STOCK' ? 'text-slate-200' : 'text-slate-500'
            }`}>
              จมทุนขายไม่ออกมาแล้ว 30 วัน
            </p>
          </button>

          {/* 4. สินค้าหมด (สีแดง) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
            className={`p-3 rounded-xl border text-left transition relative ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/60 hover:bg-rose-50 border-rose-200/80 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                statusFilter === 'OUT_OF_STOCK' ? 'text-white' : 'text-rose-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'OUT_OF_STOCK' ? 'bg-white' : 'bg-rose-500'}`} />
                สินค้าหมด
              </span>
              <span className={`text-base font-black ${
                statusFilter === 'OUT_OF_STOCK' ? 'text-white' : 'text-rose-700'
              }`}>
                {counts.outOfStock}
              </span>
            </div>
            <p className={`text-[10px] mt-1 ${
              statusFilter === 'OUT_OF_STOCK' ? 'text-rose-100' : 'text-rose-600'
            }`}>
              คงเหลือ 0 ชิ้นในคลัง
            </p>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัส SKU, ชื่อสินค้า, หรือกลุ่มสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="กรองตามกลุ่มสินค้า"
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-auto"
            >
              <option value="ALL">ทุกกลุ่มที่ผลิตสินค้า</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {statusFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="px-2.5 py-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table (Max 5 rows visible with smooth mouse scrolling) */}
      <div className="overflow-x-auto overflow-y-auto max-h-[355px] custom-table-scrollbar border-b border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-2xs">
            <tr className="bg-slate-50 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-12 text-center bg-slate-50 sticky top-0">#</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none bg-slate-50 sticky top-0"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>รหัส &amp; ชื่อสินค้า</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 bg-slate-50 sticky top-0">กลุ่มที่ผลิต</th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 select-none bg-slate-50 sticky top-0"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>สถานะสินค้า</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 select-none bg-slate-50 sticky top-0"
                onClick={() => handleSort('currentStock')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>คงเหลือในคลัง</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right bg-slate-50 sticky top-0">รับเข้า / จ่ายออก</th>
              <th className="py-3 px-3 text-right bg-slate-50 sticky top-0">ราคาทุน / ขาย</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 select-none bg-slate-50 sticky top-0"
                onClick={() => handleSort('totalStockValue')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>มูลค่าคงเหลือ</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 select-none bg-slate-50 sticky top-0"
                onClick={() => handleSort('daysWithoutSale')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>การเคลื่อนไหว</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center bg-slate-50 sticky top-0">บันทึกด่วน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <PackageX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข</p>
                  <p className="text-xs text-slate-400 mt-0.5">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.status === 'DEAD_STOCK'
                        ? 'bg-slate-50/40'
                        : item.status === 'OUT_OF_STOCK'
                        ? 'bg-rose-50/20'
                        : item.status === 'LOW_STOCK'
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* SKU & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {item.code}
                            </span>
                            <span className="font-semibold text-slate-900 text-xs">
                              {item.name}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      {item.status === 'NORMAL' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          สินค้าปกติ
                        </span>
                      )}

                      {item.status === 'LOW_STOCK' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs" title="มีสินค้าในคลังน้อยกว่า 5 ชิ้น">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          สต๊อกต่ำ ({item.currentStock})
                        </span>
                      )}

                      {item.status === 'DEAD_STOCK' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs" title="สินค้าจมทุนยังขายไม่ออกมาแล้ว 30 วัน">
                          <Clock className="w-3 h-3 text-slate-500" />
                          DeadStock
                        </span>
                      )}

                      {item.status === 'OUT_OF_STOCK' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          สินค้าหมด
                        </span>
                      )}
                    </td>

                    {/* Remaining Stock */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`text-sm font-black font-mono ${
                          item.currentStock <= 0
                            ? 'text-rose-600'
                            : item.currentStock < 5
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {item.currentStock.toLocaleString('th-TH')}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1 font-medium">
                        {item.unit}
                      </span>
                    </td>

                    {/* In / Out Breakdown */}
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-500">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-emerald-600 font-medium">+{item.totalIn}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-600 font-medium">-{item.totalOut}</span>
                      </div>
                    </td>

                    {/* Cost / Selling Price */}
                    <td className="py-3.5 px-3 text-right text-[11px]">
                      <div className="text-slate-500">
                        ทุน: ฿{item.costPrice.toLocaleString('th-TH')}
                      </div>
                      <div className="font-semibold text-slate-800">
                        ขาย: ฿{item.sellingPrice.toLocaleString('th-TH')}
                      </div>
                    </td>

                    {/* Total Stock Value */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold font-mono text-slate-900">
                        ฿{item.totalStockValue.toLocaleString('th-TH')}
                      </span>
                    </td>

                    {/* Days without sale / Movement */}
                    <td className="py-3.5 px-3 text-center text-[11px]">
                      {item.status === 'DEAD_STOCK' ? (
                        <div className="text-slate-600">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold font-mono text-[10px]">
                            ไม่ออก {item.daysWithoutSale ?? 30} วัน
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.lastOutDate ? `ขายล่าสุด ${item.lastOutDate}` : 'ยังไม่มีการขาย'}
                          </p>
                        </div>
                      ) : item.lastOutDate ? (
                        <div className="text-slate-500">
                          <p className="font-mono text-[10px]">{item.lastOutDate}</p>
                          <p className="text-[10px] text-slate-400">
                            ({item.daysWithoutSale ?? 0} วันที่แล้ว)
                          </p>
                        </div>
                      ) : item.lastInDate ? (
                        <div className="text-slate-400 text-[10px]">
                          รับเข้า {item.lastInDate}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Quick Action: IN or OUT into form */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectProductForTransaction) {
                              onSelectProductForTransaction(item.name, 'IN');
                            }
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                          title={`รับเข้าสินค้า: ${item.name}`}
                        >
                          + รับเข้า
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectProductForTransaction) {
                              onSelectProductForTransaction(item.name, 'OUT');
                            }
                          }}
                          disabled={item.currentStock <= 0}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition disabled:opacity-30 disabled:pointer-events-none"
                          title={`จ่ายออกสินค้า: ${item.name}`}
                        >
                          - จ่ายออก
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info banner */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            รวมจำนวนคงเหลือในคลัง: <strong className="text-slate-800 font-mono">{counts.totalStockQty.toLocaleString('th-TH')}</strong> หน่วย
          </div>
          <div>
            มูลค่าสต๊อกรวม: <strong className="text-slate-800 font-mono">฿{counts.totalStockValue.toLocaleString('th-TH')}</strong>
          </div>
          {filteredItems.length > 5 && (
            <div className="text-[11px] text-slate-400 font-normal">
              (แสดงครั้งละ 5 ลำดับ &bull; เลื่อนเมาส์บนตารางเพื่อดูครบทั้ง {filteredItems.length} รายการ)
            </div>
          )}
        </div>

        {isGoogleConnected && (
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <span>● คอลัมน์ &ldquo;จำนวนคงเหลือในคลัง&rdquo; ซิงค์ลง Google Sheets อัตโนมัติ</span>
          </div>
        )}
      </div>
    </div>
  );
}
