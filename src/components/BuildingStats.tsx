import React, { useState } from 'react';
import { BuildingSettings, MonthCycle, Apartment } from '../types';
import { calculateApartmentBalance, formatCurrency } from '../utils/calculations';
import { Wallet, CheckCircle2, AlertCircle, Zap, AlertTriangle, MessageCircle, Phone, FileText, Check, ChevronDown, ChevronUp, Building } from 'lucide-react';

interface BuildingStatsProps {
  apartments: Apartment[];
  cycle: MonthCycle;
  settings: BuildingSettings;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onSendWhatsApp?: (apartment: Apartment) => void;
  onViewStatement?: (apartment: Apartment) => void;
  onExportMonthlyReport?: () => void;
}

export interface OverdueAlertItem {
  apartment: Apartment;
  balance: number;
  monthlyRent: number;
  monthsOverdue: number;
  calc: ReturnType<typeof calculateApartmentBalance>;
}

export const BuildingStats: React.FC<BuildingStatsProps> = ({
  apartments,
  cycle,
  settings,
  filterStatus,
  setFilterStatus,
  onSendWhatsApp,
  onViewStatement,
  onExportMonthlyReport,
}) => {
  // Configurable threshold: default to 3 months
  const [monthsThreshold, setMonthsThreshold] = useState<number>(3);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState<boolean>(false);
  const [sentAlertAptId, setSentAlertAptId] = useState<string | null>(null);

  // Aggregate statistics across all 15 apartments
  let totalRentBilled = 0;
  let totalElectricityBilled = 0;
  let totalKwhConsumed = 0;
  let totalNetDue = 0;
  let totalPaid = 0;
  let totalRemainingOwed = 0;
  let totalCreditBalance = 0;
  let countSettled = 0;
  let countOwes = 0;
  let countCredit = 0;
  let countMissingReading = 0;

  const criticalOverdueList: OverdueAlertItem[] = [];

  for (const apt of apartments) {
    const data = cycle.records[apt.id] || {
      apartmentId: apt.id,
      rentAmount: apt.defaultRent,
      meterPrevious: 0,
      meterCurrent: null,
      kwhRate: settings.defaultKwhRate,
      fixedServiceFee: settings.defaultFixedServiceFee,
      previousCarryover: 0,
      payments: [],
    };

    const calc = calculateApartmentBalance(data);
    totalRentBilled += calc.rentAmount;
    totalElectricityBilled += calc.totalElectricityBill;
    totalKwhConsumed += calc.kwhConsumed;
    totalNetDue += calc.totalNetDue;
    totalPaid += calc.totalPaid;

    if (!calc.hasMeterReading) {
      countMissingReading++;
    }

    if (calc.status === 'owes') {
      countOwes++;
      totalRemainingOwed += calc.balance;

      // Check if overdue exceeds threshold (ratio of monthly rent)
      const monthlyRent = calc.rentAmount > 0 ? calc.rentAmount : (apt.defaultRent > 0 ? apt.defaultRent : 1);
      const ratio = calc.balance / monthlyRent;
      if (ratio >= monthsThreshold) {
        criticalOverdueList.push({
          apartment: apt,
          balance: calc.balance,
          monthlyRent,
          monthsOverdue: Math.round(ratio * 10) / 10,
          calc,
        });
      }
    } else if (calc.status === 'credit') {
      countCredit++;
      totalCreditBalance += Math.abs(calc.balance);
    } else {
      countSettled++;
    }
  }

  // Sort critical overdue list from highest overdue to lowest
  criticalOverdueList.sort((a, b) => b.balance - a.balance);

  const collectionPercentage = totalNetDue > 0 ? Math.min(100, Math.round((totalPaid / totalNetDue) * 100)) : 100;

  // Direct WhatsApp sender for reminder message
  const handleQuickSendReminder = (item: OverdueAlertItem) => {
    let cleanPhone = (item.apartment.tenantPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '966' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('5')) {
      cleanPhone = '966' + cleanPhone;
    }

    const lines: string[] = [
      `السلام عليكم ورحمة الله وبركاته،`,
      `الأخ الفاضل/ ${item.apartment.tenantName || 'المستأجر الكريم'} المحترم`,
      `تحية طيبة، نود تذكيركم بوجود متأخرات إيجار مستحقة على (${item.apartment.number} - ${settings.buildingName}):`,
      `---------------------------------`,
      `🔴 إجمالي المتبقي المستحق: ${item.balance.toFixed(2)} ${settings.currency}`,
      `⏳ مدة التأخير التقريبية: ما يعادل (${item.monthsOverdue}) أشهر إيجار متأخرة`,
      `🏢 الإيجار الشهري التعاقدي: ${item.monthlyRent.toFixed(2)} ${settings.currency}`,
      `---------------------------------`,
      `نرجو منكم التكرم بالمبادرة بالسداد والتحويل لتسوية الحساب في أقرب وقت شاكرين لكم حسن تعاونكم.`,
    ];

    if (settings.ownerName) {
      lines.push(`---------------------------------`);
      lines.push(`إدارة: ${settings.ownerName}${settings.ownerPhone ? ` | ${settings.ownerPhone}` : ''}`);
    }

    const encoded = encodeURIComponent(lines.join('\n'));
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');

    setSentAlertAptId(item.apartment.id);
    setTimeout(() => {
      setSentAlertAptId(null);
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* Monthly Cycle Summary & Export Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 leading-tight">
                إحصائيات وحسابات: {cycle.label}
              </h2>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                {apartments.length} شقة
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              متابعة مباشرة للإيرادات المحصلة، ديون المستأجرين، واستهلاك الكهرباء
            </p>
          </div>
        </div>

        {onExportMonthlyReport && (
          <button
            onClick={onExportMonthlyReport}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all flex items-center gap-2 shadow-xs hover:shadow-sm active:scale-98"
            title="تصدير تقرير شهري رسمي بصيغة PDF يحتوي على الإيرادات والديون واستهلاك الكهرباء الكلي"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>تصدير التقرير الشهري (PDF)</span>
          </button>
        )}
      </div>

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Expected Due */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">إجمالي المطلوب تحصيله</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-neutral-900 tracking-tight">
            {formatCurrency(totalNetDue, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
            <span>إيجارات: {formatCurrency(totalRentBilled, '')}</span>
            <span aria-hidden="true">·</span>
            <span>كهرباء: {formatCurrency(totalElectricityBilled, '')}</span>
          </div>
        </div>

        {/* KPI 2: Total Paid / Collected */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">تم تحصيله فعلياً</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-emerald-700 tracking-tight">
            {formatCurrency(totalPaid, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>نسبة التحصيل للشهر</span>
            <span className="font-semibold text-emerald-700 font-mono-numbers">{collectionPercentage}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Remaining Due Uncollected */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">المتبقي المطلوب تحصيله</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-rose-700 tracking-tight">
            {formatCurrency(totalRemainingOwed, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
            <span>على {countOwes} شقة متبقي عليها سداد</span>
          </div>
        </div>

        {/* KPI 4: Electricity Consumption */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">استهلاك كهرباء العمارة</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-amber-700 tracking-tight">
            {totalKwhConsumed.toLocaleString()} <span className="text-sm font-normal">ك.و/س</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>فواتير الكهرباء: {formatCurrency(totalElectricityBilled, settings.currency)}</span>
            {countMissingReading > 0 && (
              <span className="text-amber-800 font-medium">({countMissingReading} بدون قراءة)</span>
            )}
          </div>
        </div>

      </div>

      {/* قسم التنبيهات: المتأخرات الحرجة وتذكير واتساب السريع */}
      <div className="bg-gradient-to-l from-rose-50/90 via-amber-50/40 to-white border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        {/* Alerts Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-rose-200/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                  قسم التنبيهات: متأخرات الإيجار الحرجة
                </h3>
                <span className="text-xs font-bold font-mono-numbers text-rose-800 bg-rose-100/90 border border-rose-200 px-2 py-0.5 rounded-md">
                  {criticalOverdueList.length} {criticalOverdueList.length === 1 ? 'شقة' : 'شقق'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                متابعة المستأجرين الذين تجاوزت مديونيتهم المتأخرة {monthsThreshold} أشهر إيجار مع زر للإرسال السريع لرسائل التذكير
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by Months Threshold */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-white/80 border border-rose-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <span className="font-semibold text-neutral-700">الحد الأدنى للتنبيه:</span>
              <select
                value={monthsThreshold}
                onChange={(e) => setMonthsThreshold(Number(e.target.value))}
                className="bg-transparent font-bold text-rose-800 focus:outline-hidden cursor-pointer"
              >
                <option value={3}>أكثر من 3 أشهر (الموصى به)</option>
                <option value={2}>أكثر من شهرين</option>
                <option value={1}>أكثر من شهر واحد</option>
              </select>
            </div>

            <button
              onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-rose-100/60 rounded-lg transition-colors"
              title={isAlertsCollapsed ? 'توسيع قائمة التنبيهات' : 'طي قائمة التنبيهات'}
              aria-label="تبديل عرض قسم التنبيهات"
            >
              {isAlertsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Alerts Content */}
        {!isAlertsCollapsed && (
          <div className="pt-3">
            {criticalOverdueList.length === 0 ? (
              <div className="bg-white/70 border border-emerald-200/80 rounded-xl p-4 text-center text-xs text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ممتاز! لا توجد حالياً أي شقق تجاوزت {monthsThreshold} أشهر من متأخرات الإيجار.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {criticalOverdueList.map((item) => {
                  const wasSent = sentAlertAptId === item.apartment.id;

                  return (
                    <div
                      key={item.apartment.id}
                      className="bg-white border border-rose-200/90 rounded-xl p-3 sm:p-4 hover:border-rose-300 transition-colors shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Left: Info & Breakdown */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900 text-sm">
                            {item.apartment.number}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            · {item.apartment.floor}
                          </span>
                          <span className="text-xs text-neutral-400">·</span>
                          <span className="text-xs font-semibold text-neutral-800">
                            {item.apartment.tenantName}
                          </span>
                          {item.apartment.tenantPhone && (
                            <span className="text-xs font-mono text-neutral-500 flex items-center gap-1" dir="ltr">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              {item.apartment.tenantPhone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs flex-wrap pt-0.5">
                          <span className="text-neutral-600">
                            الإيجار الشهري: <strong className="font-mono-numbers text-neutral-800">{formatCurrency(item.monthlyRent, settings.currency)}</strong>
                          </span>
                          <span className="text-neutral-400">|</span>
                          <span className="text-rose-700 font-bold">
                            إجمالي المتبقي: <strong className="font-mono-numbers text-sm">{formatCurrency(item.balance, settings.currency)}</strong>
                          </span>
                          <span className="text-neutral-400">|</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <span>ما يعادل</span>
                            <strong className="font-mono-numbers">{item.monthsOverdue}</strong>
                            <span>أشهر إيجار متأخرة</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick WhatsApp Send Button & Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {onViewStatement && (
                          <button
                            onClick={() => onViewStatement(item.apartment)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1"
                            title="عرض كشف الحساب وتفاصيل الدفعات"
                          >
                            <FileText className="w-3.5 h-3.5 text-neutral-500" />
                            <span>كشف الحساب</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleQuickSendReminder(item)}
                          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
                            wasSent
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-sm active:scale-98'
                          }`}
                          title="إرسال رسالة تذكير فورية ومهذبة بالمبالغ المتأخرة عبر واتساب"
                        >
                          {wasSent ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-200" />
                              <span>تم فتح واتساب</span>
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              <span>تذكير سريع عبر واتساب</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Filter Segmented Control Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 rounded-xl flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            جميع الشقق ({apartments.length})
          </button>
          
          <button
            onClick={() => setFilterStatus('owes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              filterStatus === 'owes'
                ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200/60'
                : 'text-neutral-600 hover:text-rose-700'
            }`}
          >
            <span>عليهم متبقي ({countOwes})</span>
          </button>

          {criticalOverdueList.length > 0 && (
            <button
              onClick={() => setFilterStatus('critical_overdue')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                filterStatus === 'critical_overdue'
                  ? 'bg-rose-100 text-rose-900 shadow-2xs border border-rose-300'
                  : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>تنبيهات حرجة ({criticalOverdueList.length})</span>
            </button>
          )}

          <button
            onClick={() => setFilterStatus('settled')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              filterStatus === 'settled'
                ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/60'
                : 'text-neutral-600 hover:text-emerald-700'
            }`}
          >
            <span>مسددين بالكامل ({countSettled})</span>
          </button>

          <button
            onClick={() => setFilterStatus('credit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              filterStatus === 'credit'
                ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/60'
                : 'text-neutral-600 hover:text-blue-700'
            }`}
          >
            <span>لهم رصيد وفائض ({countCredit})</span>
          </button>

          <button
            onClick={() => setFilterStatus('missing_reading')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              filterStatus === 'missing_reading'
                ? 'bg-amber-50 text-amber-800 shadow-2xs border border-amber-200/60'
                : 'text-neutral-600 hover:text-amber-800'
            }`}
          >
            <span>قراءة العداد معلقة ({countMissingReading})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>إجمالي عدد شقق العمارة: <strong className="text-neutral-800 font-mono-numbers">{apartments.length}</strong> شقة</span>
          {onExportMonthlyReport && (
            <>
              <span aria-hidden="true" className="text-neutral-300">·</span>
              <button
                onClick={onExportMonthlyReport}
                className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="تصدير كشف حساب وتقارير الشهر الحالي بصيغة PDF"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>تقرير الشهر (PDF)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
