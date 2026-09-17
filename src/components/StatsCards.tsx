import { ArrowDownLeft, ArrowUpRight, Boxes, DollarSign, Layers } from 'lucide-react';
import { StockTransaction } from '../types';

interface StatsCardsProps {
  transactions: StockTransaction[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
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

  return (
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
          {netBalance >= 0 ? 'สต๊อกอยู่ในระดับปกติ' : '⚠️ ยอดจ่ายออกมากกว่ารับเข้า'}
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
  );
}
