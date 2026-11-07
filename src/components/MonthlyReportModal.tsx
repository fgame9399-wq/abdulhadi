import React, { useState } from 'react';
import { Apartment, BuildingSettings, MonthCycle } from '../types';
import { calculateApartmentBalance, formatCurrency } from '../utils/calculations';
import {
  FileText,
  Printer,
  X,
  Zap,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Building,
  Calendar,
  Phone,
  ShieldCheck,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  cycle: MonthCycle;
  settings: BuildingSettings;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  apartments,
  cycle,
  settings,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Compute all metrics for the selected month cycle
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

  const itemizedList = apartments.map((apt) => {
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
    } else if (calc.status === 'credit') {
      countCredit++;
      totalCreditBalance += Math.abs(calc.balance);
    } else {
      countSettled++;
    }

    return {
      apt,
      data,
      calc,
    };
  });

  const collectionPercentage =
    totalNetDue > 0 ? Math.min(100, Math.round((totalPaid / totalNetDue) * 100)) : 100;

  const reportDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle printing (PDF export via browser)
  const handlePrint = () => {
    window.print();
  };

  // Copy quick text summary
  const handleCopySummary = () => {
    const lines = [
      `📊 *تقرير شهري ملخص - ${settings.buildingName}*`,
      `📅 *الدورة الحسابية:* ${cycle.label}`,
      `تاريخ الإصدار: ${reportDate}`,
      `---------------------------------`,
      `1️⃣ *إجمالي الإيرادات المحصلة:* ${formatCurrency(totalPaid, settings.currency)}`,
      `   • نسبة التحصيل: ${collectionPercentage}%`,
      `   • إجمالي المطلوب: ${formatCurrency(totalNetDue, settings.currency)}`,
      `   • إجمالي مبالغ الإيجار: ${formatCurrency(totalRentBilled, settings.currency)}`,
      `---------------------------------`,
      `2️⃣ *ديون ومتبقيات المستأجرين:* ${formatCurrency(totalRemainingOwed, settings.currency)}`,
      `   • عدد الشقق التي عليها متبقي: ${countOwes} من إجمالي ${apartments.length} شقة`,
      `   • عدد الشقق المسددة بالكامل: ${countSettled} شقة`,
      `---------------------------------`,
      `3️⃣ *استهلاك كهرباء العمارة الكلي:* ${totalKwhConsumed.toLocaleString()} ك.و/س`,
      `   • إجمالي فواتير الكهرباء: ${formatCurrency(totalElectricityBilled, settings.currency)}`,
      `   • سعر الكيلوواط المعتمد: ${settings.defaultKwhRate} ${settings.currency}`,
      `   • عدادات بدون قراءة: ${countMissingReading}`,
      `---------------------------------`,
      settings.ownerName ? `إدارة: ${settings.ownerName} ${settings.ownerPhone ? `| ${settings.ownerPhone}` : ''}` : '',
    ];

    navigator.clipboard.writeText(lines.filter(Boolean).join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 print-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-neutral-300 overflow-hidden flex flex-col max-h-[94vh] print-modal-container">
        
        {/* Top Controls Bar (No Print) */}
        <div className="no-print px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  التقرير المالي والإحصائي الشهري للعمارة
                </h2>
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                  {cycle.label}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                تصدير ملخص الإيرادات، ديون ومتبقيات المستأجرين، واستهلاك الكهرباء الكلي بصيغة PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="نسخ ملخص الأرقام كنص لمشاركته عبر واتساب أو الملاحظات"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">تم نسخ الملخص!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-500" />
                  <span>نسخ ملخص التقرير</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all flex items-center gap-2 shadow-xs hover:shadow-sm"
              title="تصدير كملف PDF أو الطباعة المباشرة"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كملف PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-200/60 transition-colors"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-6 sm:p-8 md:p-10 overflow-y-auto flex-1 bg-white text-neutral-900 text-sm print-only">
          
          {/* Header of the Official Report */}
          <div className="border-b-2 border-neutral-900 pb-5 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-6 h-6 text-neutral-800" />
                  <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                    {settings.buildingName}
                  </h1>
                </div>
                <p className="text-sm font-bold text-neutral-700">
                  التقرير المالي والإحصائي الشامل لدورة: {cycle.label}
                </p>
                {settings.ownerName && (
                  <p className="text-xs text-neutral-500">
                    إدارة العمارة: {settings.ownerName} {settings.ownerPhone ? `| جوال: ${settings.ownerPhone}` : ''}
                  </p>
                )}
              </div>

              <div className="text-left bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs" dir="ltr">
                <div className="font-mono font-bold text-neutral-900">
                  CYCLE: {cycle.id}
                </div>
                <div className="font-mono text-neutral-600 mt-0.5">
                  DATE: {new Date().toISOString().slice(0, 10)}
                </div>
                <div className="text-neutral-500 mt-0.5 text-[11px]" dir="rtl">
                  عدد الوحدات: {apartments.length} شقة
                </div>
              </div>
            </div>
          </div>

          {/* Three Highlighted Pillar KPI Cards (Required by Prompt) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print-avoid-break">
            
            {/* 1. Total Revenue Pillar */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-4">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-xs font-bold">1. إجمالي الإيرادات المحصلة</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono-numbers text-emerald-800 tracking-tight mt-1">
                {formatCurrency(totalPaid, settings.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-600 space-y-0.5 border-t border-emerald-200/80 pt-2">
                <div className="flex justify-between">
                  <span>إجمالي المطلوب للشهر:</span>
                  <span className="font-mono-numbers font-semibold">{formatCurrency(totalNetDue, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>نسبة الإنجاز والتحصيل:</span>
                  <span className="font-mono-numbers font-bold text-emerald-700">{collectionPercentage}%</span>
                </div>
              </div>
            </div>

            {/* 2. Tenant Debts Pillar */}
            <div className="bg-rose-50/70 border-2 border-rose-300 rounded-xl p-4">
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-xs font-bold">2. إجمالي ديون المستأجرين</span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-black font-mono-numbers text-rose-700 tracking-tight mt-1">
                {formatCurrency(totalRemainingOwed, settings.currency)}
              </div>
              <div className="mt-2 text-xs text-neutral-600 space-y-0.5 border-t border-rose-200/80 pt-2">
                <div className="flex justify-between">
                  <span>شقق متبقي عليها مبالغ:</span>
                  <span className="font-mono-numbers font-bold text-rose-700">{countOwes} شقة</span>
                </div>
                <div className="flex justify-between">
                  <span>شقق مسددة بالكامل:</span>
                  <span className="font-mono-numbers font-semibold text-emerald-700">{countSettled} شقة</span>
                </div>
              </div>
            </div>

            {/* 3. Total Electricity Consumption Pillar */}
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center justify-between text-amber-900 mb-1">
                <span className="text-xs font-bold">3. استهلاك كهرباء العمارة الكلي</span>
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-black font-mono-numbers text-amber-800 tracking-tight mt-1">
                {totalKwhConsumed.toLocaleString()} <span className="text-sm font-bold">ك.و/س</span>
              </div>
              <div className="mt-2 text-xs text-neutral-600 space-y-0.5 border-t border-amber-200/80 pt-2">
                <div className="flex justify-between">
                  <span>إجمالي فواتير الكهرباء:</span>
                  <span className="font-mono-numbers font-semibold text-amber-900">{formatCurrency(totalElectricityBilled, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط استهلاك الشقة:</span>
                  <span className="font-mono-numbers font-semibold">
                    {apartments.length > 0 ? Math.round(totalKwhConsumed / apartments.length).toLocaleString() : 0} ك.و/س
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Secondary Financial Breakdown Strip */}
          <div className="bg-neutral-50 border border-neutral-300 rounded-xl p-3 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-neutral-700 print-avoid-break">
            <div>
              <span className="text-neutral-500 block">إجمالي مبالغ الإيجارات:</span>
              <strong className="text-neutral-900 font-mono-numbers text-sm">
                {formatCurrency(totalRentBilled, settings.currency)}
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 block">سعر الكيلوواط المعتمد:</span>
              <strong className="text-neutral-900 font-mono-numbers text-sm">
                {settings.defaultKwhRate} {settings.currency}
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 block">أرصدة فائضة للمستأجرين:</span>
              <strong className="text-blue-700 font-mono-numbers text-sm">
                {formatCurrency(totalCreditBalance, settings.currency)} ({countCredit} شقة)
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 block">قراءات العدادات المعلقة:</span>
              <strong className={`font-mono-numbers text-sm ${countMissingReading > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                {countMissingReading === 0 ? 'مكتملة بالكامل' : `${countMissingReading} شقة بدون قراءة`}
              </strong>
            </div>
          </div>

          {/* Detailed Itemized Apartments Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-neutral-800 tracking-tight">
                جدول كشف حساب شقق العمارة التفصيلي لشهر ({cycle.label}):
              </h3>
              <span className="text-[11px] text-neutral-500 font-mono-numbers">
                {apartments.length} شقة مسجلة
              </span>
            </div>

            <div className="overflow-x-auto border border-neutral-300 rounded-lg">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800">
                    <th className="p-2 border-l border-neutral-300 text-center w-12">#</th>
                    <th className="p-2 border-l border-neutral-300 min-w-32">الشقة والمستأجر</th>
                    <th className="p-2 border-l border-neutral-300 text-center">العداد (سابق / حالي)</th>
                    <th className="p-2 border-l border-neutral-300 text-center">الاستهلاك</th>
                    <th className="p-2 border-l border-neutral-300 text-left">فاتورة الكهرباء</th>
                    <th className="p-2 border-l border-neutral-300 text-left">الإيجار</th>
                    <th className="p-2 border-l border-neutral-300 text-left">رصيد سابق</th>
                    <th className="p-2 border-l border-neutral-300 text-left">المطلوب</th>
                    <th className="p-2 border-l border-neutral-300 text-left">المدفوع</th>
                    <th className="p-2 border-l border-neutral-300 text-left">المتبقي</th>
                    <th className="p-2 text-center w-20">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {itemizedList.map(({ apt, calc }, index) => {
                    const isOwes = calc.status === 'owes';
                    const isCredit = calc.status === 'credit';
                    const isSettled = calc.status === 'settled';

                    return (
                      <tr
                        key={apt.id}
                        className={`hover:bg-neutral-50/50 ${
                          isOwes && calc.balance >= (calc.rentAmount || apt.defaultRent) * 3
                            ? 'bg-rose-50/30'
                            : ''
                        }`}
                      >
                        <td className="p-2 border-l border-neutral-200 text-center font-mono-numbers text-neutral-500">
                          {index + 1}
                        </td>
                        <td className="p-2 border-l border-neutral-200">
                          <div className="font-bold text-neutral-900">{apt.number}</div>
                          <div className="text-[11px] text-neutral-600 truncate max-w-36">
                            {apt.tenantName}
                          </div>
                        </td>
                        <td className="p-2 border-l border-neutral-200 text-center font-mono-numbers text-[11px] text-neutral-600">
                          {calc.hasMeterReading ? (
                            <span>{calc.meterPrevious} ➔ {calc.meterCurrent}</span>
                          ) : (
                            <span className="text-amber-800">معلق</span>
                          )}
                        </td>
                        <td className="p-2 border-l border-neutral-200 text-center font-mono-numbers font-medium text-neutral-800">
                          {calc.hasMeterReading ? `${calc.kwhConsumed}` : '—'}
                        </td>
                        <td className="p-2 border-l border-neutral-200 font-mono-numbers text-left text-neutral-700">
                          {formatCurrency(calc.totalElectricityBill, '')}
                        </td>
                        <td className="p-2 border-l border-neutral-200 font-mono-numbers text-left text-neutral-700">
                          {formatCurrency(calc.rentAmount, '')}
                        </td>
                        <td className="p-2 border-l border-neutral-200 font-mono-numbers text-left text-[11px] text-neutral-500">
                          {calc.previousCarryover !== 0
                            ? formatCurrency(calc.previousCarryover, '')
                            : '—'}
                        </td>
                        <td className="p-2 border-l border-neutral-200 font-mono-numbers font-bold text-left text-neutral-900">
                          {formatCurrency(calc.totalNetDue, '')}
                        </td>
                        <td className="p-2 border-l border-neutral-200 font-mono-numbers font-bold text-left text-emerald-700">
                          {formatCurrency(calc.totalPaid, '')}
                        </td>
                        <td className={`p-2 border-l border-neutral-200 font-mono-numbers font-bold text-left ${
                          isOwes ? 'text-rose-700' : isCredit ? 'text-blue-700' : 'text-neutral-400'
                        }`}>
                          {isSettled
                            ? '0.00'
                            : isCredit
                            ? `+${formatCurrency(Math.abs(calc.balance), '')}`
                            : formatCurrency(calc.balance, '')}
                        </td>
                        <td className="p-2 text-center">
                          {isSettled && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              مسدد
                            </span>
                          )}
                          {isOwes && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              متبقي
                            </span>
                          )}
                          {isCredit && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              فائض
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 border-t-2 border-neutral-300 font-bold text-neutral-900">
                    <td colSpan={3} className="p-2.5 border-l border-neutral-300 text-right">
                      المجموع الكلي للعمارة ({apartments.length} شقة):
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-center">
                      {totalKwhConsumed.toLocaleString()} ك.و/س
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-left">
                      {formatCurrency(totalElectricityBilled, '')}
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-left">
                      {formatCurrency(totalRentBilled, '')}
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-left text-neutral-500">
                      —
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-left text-neutral-900">
                      {formatCurrency(totalNetDue, '')}
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-left text-emerald-800">
                      {formatCurrency(totalPaid, '')}
                    </td>
                    <td className="p-2.5 border-l border-neutral-300 font-mono-numbers text-left text-rose-800">
                      {formatCurrency(totalRemainingOwed, '')}
                    </td>
                    <td className="p-2.5 text-center text-[11px] text-neutral-600">
                      {settings.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Audit & Signatures Footer */}
          <div className="pt-6 border-t-2 border-neutral-300 grid grid-cols-2 text-center text-xs text-neutral-700 print-avoid-break">
            <div className="space-y-1">
              <div className="font-bold text-neutral-900 mb-8">
                مسؤول الإدارة والتحصيل
              </div>
              <div className="border-b border-dashed border-neutral-400 w-44 mx-auto"></div>
              <div className="text-[11px] text-neutral-500 pt-1">
                التوقيع / الختم الرسمي
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-neutral-900 mb-8">
                اعتماد المالك / المدقق المالي
              </div>
              <div className="border-b border-dashed border-neutral-400 w-44 mx-auto"></div>
              <div className="text-[11px] text-neutral-500 pt-1">
                التاريخ: {reportDate}
              </div>
            </div>
          </div>

          {/* Micro Footer Notice */}
          <div className="mt-8 pt-3 border-t border-neutral-200 text-center text-[10px] text-neutral-400">
            تم استخراج هذا التقرير آلياً عبر نظام إدارة حسابات {settings.buildingName} · تقرير معتمد وخاضع للمراجعة والتدقيق
          </div>

        </div>

      </div>
    </div>
  );
};
