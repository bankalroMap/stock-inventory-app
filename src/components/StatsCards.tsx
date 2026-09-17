import { ArrowDownLeft, ArrowUpRight, DollarSign, Layers, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { StockTransaction, ProductCatalogItem } from '../types';
import { getFullInventoryList } from '../utils/inventory';

interface StatsCardsProps {
  transactions: StockTransaction[];
  catalog?: ProductCatalogItem[];
  onSelectStatusFilter?: (status: 'DEAD_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK') => void;
}

export function StatsCards({ transactions, catalog = [], onSelectStatusFilter }: StatsCardsProps) {
  const totalIn = transactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  const totalOut = transactions
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  const netBalance = totalIn - totalOut;

  const totalValue = transactions.reduce(
    (sum, t) => sum + (t.totalPrice || t.unitPrice * t.quantity || 0),
    0
  );

  // Status breakdown from catalog & transactions
  const invSummaries = getFullInventoryList(catalog, transactions);
  const deadStockCount = invSummaries.filter((i) => i.status === 'DEAD_STOCK').length;
  const lowStockCount = invSummaries.filter((i) => i.status === 'LOW_STOCK').length;
  const outOfStockCount = invSummaries.filter((i) => i.status === 'OUT_OF_STOCK').length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* รับเข้า */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สินค้ารับเข้าทั้งหมด
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">
              {totalIn.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-medium text-slate-400">ชิ้น/หน่วย</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            จากรายการรับเข้า {transactions.filter((t) => t.type === 'IN').length} ครั้ง
          </p>
        </div>

        {/* จ่ายออก */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สินค้าจ่ายออกทั้งหมด
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-600 tracking-tight">
              {totalOut.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-medium text-slate-400">ชิ้น/หน่วย</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            จากรายการจ่ายออก {transactions.filter((t) => t.type === 'OUT').length} ครั้ง
          </p>
        </div>

        {/* คงเหลือสุทธิ */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สต๊อกคงเหลือสุทธิ
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold tracking-tight ${
                netBalance >= 0 ? 'text-indigo-600' : 'text-amber-600'
              }`}
            >
              {netBalance.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-medium text-slate-400">ชิ้น/หน่วย</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {netBalance >= 0 ? 'รวมสินค้าทุกรายการในคลัง' : '⚠️ ยอดจ่ายออกมากกว่ารับเข้า'}
          </p>
        </div>

        {/* มูลค่ารวม */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              มูลค่ารวมรายการทั้งหมด
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xs text-slate-500">฿</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            รวม {transactions.length} รายการในระบบ
          </p>
        </div>
      </div>

      {/* Stock Health Alerts Banner (DeadStock, Low Stock, Out of Stock) */}
      {(deadStockCount > 0 || lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-slate-900 text-white rounded-xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              การแจ้งเตือนสถานะสต๊อก:
            </span>
            <span className="text-slate-300 hidden md:inline">
              มีสินค้าที่ต้องติดตามดูแลในคลังสินค้า
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {lowStockCount > 0 && (
              <span
                onClick={() => onSelectStatusFilter && onSelectStatusFilter('LOW_STOCK')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer hover:bg-amber-500/30 transition"
                title="สินค้าเหลือน้อยกว่า 5 ชิ้น"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                สต๊อกต่ำ: <strong>{lowStockCount}</strong> รายการ (&lt;5 ชิ้น)
              </span>
            )}

            {deadStockCount > 0 && (
              <span
                onClick={() => onSelectStatusFilter && onSelectStatusFilter('DEAD_STOCK')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer hover:bg-slate-600 transition"
                title="สินค้าจมทุนยังขายไม่ออกมาแล้ว 30 วัน"
              >
                <Clock className="w-3 h-3 text-slate-400" />
                DeadStock: <strong>{deadStockCount}</strong> รายการ (ไม่ออก 30+ วัน)
              </span>
            )}

            {outOfStockCount > 0 && (
              <span
                onClick={() => onSelectStatusFilter && onSelectStatusFilter('OUT_OF_STOCK')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-pointer hover:bg-rose-500/30 transition"
                title="สินค้าหมด 0 ชิ้น"
              >
                <XCircle className="w-3 h-3 text-rose-400" />
                สินค้าหมด: <strong>{outOfStockCount}</strong> รายการ
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
