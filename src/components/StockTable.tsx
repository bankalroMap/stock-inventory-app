import { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  Download,
  Edit2,
  FileSpreadsheet,
  History,
  Inbox,
  Search,
  Trash2,
} from 'lucide-react';
import { StockTransaction } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface StockTableProps {
  transactions: StockTransaction[];
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (transaction: StockTransaction) => void;
  isGoogleConnected?: boolean;
  isDeleting?: boolean;
}

type SortField = 'date' | 'productName' | 'quantity' | 'totalPrice';
type SortOrder = 'asc' | 'desc';

export function StockTable({
  transactions,
  onDelete,
  onEdit,
  isGoogleConnected = false,
  isDeleting = false,
}: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Extract all categories present
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        // Search
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          item.productName.toLowerCase().includes(term) ||
          item.reporter.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          (item.note && item.note.toLowerCase().includes(term)) ||
          item.id.toLowerCase().includes(term);

        // Type filter
        const matchesType = selectedType === 'ALL' || item.type === selectedType;

        // Category filter
        const matchesCategory =
          selectedCategory === 'ALL' || item.category === selectedCategory;

        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [transactions, searchTerm, selectedType, selectedCategory, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportToCsv = () => {
    const headers = [
      'รหัสรายการ',
      'วันที่',
      'ประเภท',
      'กลุ่มที่ผลิตสินค้า',
      'รายการสินค้า',
      'ราคาขายต่อหน่วย',
      'จำนวน',
      'หน่วยนับ',
      'ราคารวม',
      'ผู้แจ้ง',
      'หมายเหตุ',
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type === 'IN' ? 'รับเข้า (IN)' : 'จ่ายออก (OUT)',
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.productName.replace(/"/g, '""')}"`,
      t.unitPrice,
      t.quantity,
      t.unit || 'ชิ้น',
      t.totalPrice,
      `"${t.reporter.replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    const targetId = deleteConfirmId;
    setDeleteConfirmId(null);
    await onDelete(targetId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                ตารางแสดงรายการย้อนหลัง
              </h2>
              {isGoogleConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> ข้อมูลหลังบ้าน Google Sheets
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดง {filteredTransactions.length} จากทั้งหมด {transactions.length} รายการ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCsv}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition"
              title="ดาวน์โหลดเป็นไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, ผู้แจ้ง, กลุ่ม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition bg-white"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">ทุกประเภท (ทั้งหมด)</option>
              <option value="IN">เฉพาะรับเข้า (IN)</option>
              <option value="OUT">เฉพาะจ่ายออก (OUT)</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">ทุกกลุ่มที่ผลิตสินค้า</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Modal for Destructive Operations (Mandatory per Workspace Skill) */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        title="ยืนยันการลบรายการสต๊อกสินค้า?"
        message={
          isGoogleConnected
            ? `คุณต้องการลบรายการรหัส ${deleteConfirmId} หรือไม่? การลบนี้จะนำแถวออกจาก Google Sheets หลังบ้านของคุณโดยตรง`
            : `คุณต้องการลบรายการรหัส ${deleteConfirmId} หรือไม่?`
        }
        confirmLabel="ยืนยันลบรายการ"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-slate-700 uppercase tracking-wider border-b border-slate-200 font-semibold">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>วันที่</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">ประเภท</th>
              <th className="py-3 px-3 whitespace-nowrap">กลุ่มที่ผลิต</th>
              <th
                onClick={() => handleSort('productName')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-1">
                  <span>รายการสินค้า</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right whitespace-nowrap">ราคาขาย</th>
              <th
                onClick={() => handleSort('quantity')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>จำนวน</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalPrice')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>ราคารวม</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">ผู้แจ้ง</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((item) => {
              const isIN = item.type === 'IN';
              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {item.date}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isIN
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isIN ? (
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-rose-600" />
                      )}
                      {isIN ? 'รับเข้า' : 'จ่ายออก'}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900">{item.productName}</div>
                    {item.note && (
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        หมายเหตุ: {item.note}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-medium whitespace-nowrap">
                    ฿{item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-slate-800 whitespace-nowrap">
                    {item.quantity.toLocaleString('th-TH')}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.unit || 'ชิ้น'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-indigo-600 whitespace-nowrap">
                    ฿{item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {item.reporter}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="แก้ไขรายการ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3.5">
            <Inbox className="w-7 h-7 stroke-[1.5]" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {searchTerm || selectedType !== 'ALL' || selectedCategory !== 'ALL'
              ? 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'
              : 'ยังไม่มีรายการสต๊อกสินค้า'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchTerm || selectedType !== 'ALL' || selectedCategory !== 'ALL'
              ? 'ลองเปลี่ยนหรือล้างคำค้นหา/ตัวกรองเพื่อดูรายการทั้งหมด'
              : isGoogleConnected
              ? 'เริ่มต้นกรอกข้อมูลรับเข้าหรือจ่ายออกสินค้าผ่านฟอร์มด้านซ้าย ข้อมูลจะถูกบันทึกไปยัง Google Sheets หลังบ้านทันที'
              : 'เริ่มต้นกรอกข้อมูลรับเข้าหรือจ่ายออกสินค้าผ่านฟอร์มด้านซ้าย หรือเชื่อมต่อ Google Sheets เพื่อใช้เป็นระบบหลังบ้าน'}
          </p>
        </div>
      )}
    </div>
  );
}
