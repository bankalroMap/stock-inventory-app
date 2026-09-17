import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Boxes,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { StockTransaction, ProductCatalogItem, ProductStockStatus } from '../types';
import { getFullInventoryList, parseFlexibleDate } from '../utils/inventory';

interface MonitorDashboardProps {
  catalog: ProductCatalogItem[];
  transactions: StockTransaction[];
  onSelectProductForTransaction?: (productName: string, type: 'IN' | 'OUT') => void;
  onNavigateToInventory?: (filterStatus?: ProductStockStatus) => void;
  onSeedSampleData?: () => void;
  isGoogleConnected?: boolean;
}

type TimeRange = '7D' | '30D' | '90D' | 'ALL';

const STATUS_COLORS: Record<ProductStockStatus, { name: string; color: string; bg: string }> = {
  NORMAL: { name: 'สินค้าปกติ', color: '#10b981', bg: 'bg-emerald-50 text-emerald-700' },
  LOW_STOCK: { name: 'สต๊อกต่ำ (<5)', color: '#f59e0b', bg: 'bg-amber-50 text-amber-700' },
  DEAD_STOCK: { name: 'DeadStock (30+วัน)', color: '#64748b', bg: 'bg-slate-100 text-slate-700' },
  OUT_OF_STOCK: { name: 'สินค้าหมด', color: '#ef4444', bg: 'bg-rose-50 text-rose-700' },
};

export function MonitorDashboard({
  catalog,
  transactions,
  onSelectProductForTransaction,
  onNavigateToInventory,
  onSeedSampleData,
  isGoogleConnected,
}: MonitorDashboardProps) {
  // Default to ALL so all transactions from Google Sheets are shown immediately regardless of date
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  // Compute full inventory summary for all products
  const inventoryList = useMemo(() => {
    return getFullInventoryList(catalog, transactions);
  }, [catalog, transactions]);

  // Filter transactions by selected time range using robust flexible date parsing
  const filteredTransactions = useMemo(() => {
    if (timeRange === 'ALL') return transactions;

    const now = new Date();
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return transactions.filter((t) => {
      const parsed = parseFlexibleDate(t.date) || parseFlexibleDate(t.createdAt);
      if (!parsed) return true; // Keep transactions so they aren't lost
      return parsed >= cutoff;
    });
  }, [transactions, timeRange]);

  // Overall Health Metrics
  const healthMetrics = useMemo(() => {
    const totalItems = inventoryList.length;
    let normal = 0;
    let lowStock = 0;
    let deadStock = 0;
    let outOfStock = 0;
    let totalStockQty = 0;
    let totalStockVal = 0;
    let deadStockVal = 0;

    inventoryList.forEach((item) => {
      totalStockQty += Math.max(0, item.currentStock);
      totalStockVal += item.totalStockValue;

      if (item.status === 'NORMAL') normal++;
      else if (item.status === 'LOW_STOCK') lowStock++;
      else if (item.status === 'DEAD_STOCK') {
        deadStock++;
        deadStockVal += item.totalStockValue;
      } else if (item.status === 'OUT_OF_STOCK') outOfStock++;
    });

    const healthRate = totalItems > 0 ? Math.round((normal / totalItems) * 100) : 0;
    const deadStockRate = totalItems > 0 ? Math.round((deadStock / totalItems) * 100) : 0;

    return {
      totalItems,
      normal,
      lowStock,
      deadStock,
      outOfStock,
      totalStockQty,
      totalStockVal,
      deadStockVal,
      healthRate,
      deadStockRate,
    };
  }, [inventoryList]);

  // Chart 1 Data: Stock status distribution (Donut)
  const statusPieData = useMemo(() => {
    return [
      { name: 'สินค้าปกติ', value: healthMetrics.normal, statusKey: 'NORMAL' as ProductStockStatus, color: '#10b981' },
      { name: 'สต๊อกต่ำ (<5)', value: healthMetrics.lowStock, statusKey: 'LOW_STOCK' as ProductStockStatus, color: '#f59e0b' },
      { name: 'DeadStock (30+วัน)', value: healthMetrics.deadStock, statusKey: 'DEAD_STOCK' as ProductStockStatus, color: '#64748b' },
      { name: 'สินค้าหมด (0)', value: healthMetrics.outOfStock, statusKey: 'OUT_OF_STOCK' as ProductStockStatus, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [healthMetrics]);

  // Chart 2 Data: Daily In vs Out Volume timeline
  const timelineData = useMemo(() => {
    const dateMap = new Map<string, { date: string; inQty: number; outQty: number; inVal: number; outVal: number }>();

    // Sort transactions chronologically
    const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((t) => {
      const dateKey = t.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, inQty: 0, outQty: 0, inVal: 0, outVal: 0 });
      }
      const entry = dateMap.get(dateKey)!;
      const qty = t.quantity || 0;
      const val = t.totalPrice || qty * (t.unitPrice || 0);

      if (t.type === 'IN') {
        entry.inQty += qty;
        entry.inVal += val;
      } else {
        entry.outQty += qty;
        entry.outVal += val;
      }
    });

    return Array.from(dateMap.values());
  }, [filteredTransactions]);

  // Chart 3 Data: Stock Valuation by Category
  const categoryValuationData = useMemo(() => {
    const catMap = new Map<string, { category: string; value: number; count: number; stock: number }>();

    inventoryList.forEach((item) => {
      const cat = item.category || 'ทั่วไป';
      if (!catMap.has(cat)) {
        catMap.set(cat, { category: cat, value: 0, count: 0, stock: 0 });
      }
      const entry = catMap.get(cat)!;
      entry.value += item.totalStockValue;
      entry.stock += Math.max(0, item.currentStock);
      entry.count += 1;
    });

    return Array.from(catMap.values()).sort((a, b) => b.value - a.value);
  }, [inventoryList]);

  // Top 5 Fast-Moving Items (most items sold)
  const topMovingItems = useMemo(() => {
    return [...inventoryList]
      .filter((i) => i.totalOut > 0)
      .sort((a, b) => b.totalOut - a.totalOut)
      .slice(0, 5);
  }, [inventoryList]);

  // Top DeadStock Items (longest days without sale with stock > 0)
  const topDeadStockItems = useMemo(() => {
    return [...inventoryList]
      .filter((i) => i.status === 'DEAD_STOCK')
      .sort((a, b) => (b.daysWithoutSale ?? 0) - (a.daysWithoutSale ?? 0))
      .slice(0, 5);
  }, [inventoryList]);

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              ระบบ Monitor Dashboard ติดตามสต๊อกและกราฟสถิติ
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            วิเคราะห์ความเคลื่อนไหวสินค้า อัตราหมุนเวียน สัดส่วนสินค้าคงเหลือ และเตือนภัยสินค้าจมทุนแบบเรียลไทม์
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {(['7D', '30D', '90D', 'ALL'] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeRange === r
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === '7D' ? '7 วัน' : r === '30D' ? '30 วัน' : r === '90D' ? '90 วัน' : 'ทั้งหมด'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State / Seed Data Helper Banner */}
      {transactions.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {isGoogleConnected
                  ? 'ยังไม่มีประวัติการบันทึกใน Google Sheets แผ่นนี้'
                  : 'ยังไม่มีประวัติการบันทึกรายการสต๊อกสินค้า'}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                คุณสามารถนำเข้าชุดข้อมูลตัวอย่าง (11 รายการ) เพื่อทดสอบและแสดงผลกราฟสถิติทันที
              </p>
            </div>
          </div>
          {onSeedSampleData && (
            <button
              type="button"
              onClick={onSeedSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>โหลดข้อมูลตัวอย่างเข้าสู่กราฟ</span>
            </button>
          )}
        </div>
      )}

      {/* 4 Summary Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. สุขภาพสต๊อกโดยรวม */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">อัตราสุขภาพสต๊อก</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {healthMetrics.healthRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({healthMetrics.normal}/{healthMetrics.totalItems} รายการ)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${healthMetrics.healthRate}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            สินค้าปกติหมุนเวียนพร้อมจำหน่าย
          </p>
        </div>

        {/* 2. DeadStock Alert */}
        <div
          onClick={() => onNavigateToInventory && onNavigateToInventory('DEAD_STOCK')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-400 transition"
          title="คลิกเพื่อดูรายการ DeadStock ในตารางคลังสินค้า"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">มูลค่า DeadStock</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xs text-slate-500">฿</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {healthMetrics.deadStockVal.toLocaleString('th-TH')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {healthMetrics.deadStock} รายการ ({healthMetrics.deadStockRate}% ของคลัง)
          </p>
        </div>

        {/* 3. สต๊อกต่ำกว่าเกณฑ์ */}
        <div
          onClick={() => onNavigateToInventory && onNavigateToInventory('LOW_STOCK')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-300 transition"
          title="คลิกเพื่อดูรายการสต๊อกต่ำในตารางคลังสินค้า"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">สต๊อกต่ำ (&lt; 5 ชิ้น)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {healthMetrics.lowStock}
            </span>
            <span className="text-xs text-slate-400">รายการ</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-2 font-medium">
            {healthMetrics.lowStock > 0 ? '⚠️ ควรวางแผนสั่งผลิตหรือรับเข้าเพิ่ม' : '✅ ไม่มีสินค้าสต๊อกต่ำ'}
          </p>
        </div>

        {/* 4. สินค้าหมด */}
        <div
          onClick={() => onNavigateToInventory && onNavigateToInventory('OUT_OF_STOCK')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-rose-300 transition"
          title="คลิกเพื่อดูรายการสินค้าหมดในตารางคลังสินค้า"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">สินค้าหมด (0 ชิ้น)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {healthMetrics.outOfStock}
            </span>
            <span className="text-xs text-slate-400">รายการ</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-2 font-medium">
            {healthMetrics.outOfStock > 0 ? 'จำเป็นต้องเติมสต๊อกเพื่อไม่ให้เสียโอกาสขาย' : 'ไม่มีสินค้าหมดในคลัง'}
          </p>
        </div>
      </div>

      {/* Row 1: Flow Timeline & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Stock Movement Timeline (7 คอลัมน์) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                แนวโน้ม รับเข้า vs จ่ายออก (Stock Movement Flow)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เปรียบเทียบจำนวนชิ้นที่รับเข้าคลังกับที่จ่ายออกตามช่วงเวลา ({timeRange})
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Boxes className="w-8 h-8 text-slate-300" />
                <span>
                  {transactions.length > 0
                    ? `ไม่มีข้อมูลการบันทึกในช่วง ${timeRange === '7D' ? '7 วัน' : timeRange === '30D' ? '30 วัน' : '90 วัน'} (มีทั้งหมด ${transactions.length} รายการ)`
                    : 'ยังไม่มีข้อมูลการบันทึกรายการสินค้า'}
                </span>
                {transactions.length > 0 && timeRange !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setTimeRange('ALL')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition"
                  >
                    แสดงกราฟข้อมูลทั้งหมด ({transactions.length} รายการ)
                  </button>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="outGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString('th-TH')} หน่วย`,
                      name === 'inQty' ? 'รับเข้า' : 'จ่ายออก',
                    ]}
                    labelFormatter={(label) => `วันที่: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    formatter={(val) => (val === 'inQty' ? 'รับเข้า (+)' : 'จ่ายออก (-)')}
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inQty"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#inGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outQty"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#outGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Status Breakdown Donut (5 คอลัมน์) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                สัดส่วนสถานะสินค้าในคลัง
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                การกระจายตัวของสถานะสินค้าทั้งหมด {healthMetrics.totalItems} รายการ
              </p>
            </div>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val: any) => [`${val} รายการ`, 'จำนวน']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">รวมทั้งหมด</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {healthMetrics.totalItems}
              </span>
              <span className="text-[10px] text-slate-400">รายการ</span>
            </div>
          </div>

          {/* Quick Legend Chips */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
            {statusPieData.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => onNavigateToInventory && onNavigateToInventory(s.statusKey)}
                className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-left"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[11px] text-slate-600 font-medium truncate">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 ml-2">{s.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Valuation & Financial Turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Inventory Value by Category (7 คอลัมน์) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                มูลค่าสต๊อกคงเหลือแยกตามกลุ่มที่ผลิต (บาท)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                กลุ่มสินค้าที่มีมูลค่าเงินทุนคงค้างในคลังสินค้าสูงสุด
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryValuationData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลสินค้าในแคตตาล็อก
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryValuationData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: any) => [`฿${Number(val).toLocaleString('th-TH')}`, 'มูลค่าสต๊อก']}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4 / Panels: Top Fast Moving vs DeadStock Alert (5 คอลัมน์) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Panel A: สินค้าขายดี / หมุนเวียนไว */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              สินค้าหมุนเวียนไว / ยอดขายสูงสุด (Top Outflow)
            </h4>
            <div className="space-y-2">
              {topMovingItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">ยังไม่มีประวัติการจำหน่ายสินค้า</p>
              ) : (
                topMovingItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-rose-600 font-mono">
                        -{item.totalOut} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        คงเหลือ {item.currentStock}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel B: สินค้า DeadStock จมทุนนานสุด */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              สินค้า DeadStock เฝ้าระวัง (จมทุนเกิน 30 วัน)
            </h4>
            <div className="space-y-2">
              {topDeadStockItems.length === 0 ? (
                <p className="text-xs text-emerald-600 py-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ยอดเยี่ยม! ไม่มีสินค้า DeadStock ในคลัง
                </p>
              ) : (
                topDeadStockItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          ค้างในคลัง {item.daysWithoutSale ?? 30} วัน
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-slate-700 font-mono">
                        {item.currentStock} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        ฿{item.totalStockValue.toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
