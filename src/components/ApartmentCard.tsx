import React, { useState } from 'react';
import { Apartment, ApartmentMonthlyData, BuildingSettings } from '../types';
import { calculateApartmentBalance, formatCurrency } from '../utils/calculations';
import { Zap, Plus, FileText, Printer, MessageCircle, Edit3, Edit2, CheckCircle2, AlertCircle, Phone, ArrowUpRight } from 'lucide-react';

interface ApartmentCardProps {
  apartment: Apartment;
  monthlyData: ApartmentMonthlyData;
  settings: BuildingSettings;
  onRecordPayment: (apt: Apartment) => void;
  onViewStatement: (apt: Apartment) => void;
  onPrintReceipt: (apt: Apartment) => void;
  onSendWhatsApp: (apt: Apartment) => void;
  onUpdateMeter: (aptId: string, current: number | null) => void;
  onEditApartment?: (apt: Apartment) => void;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  monthlyData,
  settings,
  onRecordPayment,
  onViewStatement,
  onPrintReceipt,
  onSendWhatsApp,
  onUpdateMeter,
  onEditApartment,
}) => {
  const [isEditingMeter, setIsEditingMeter] = useState(false);
  const [meterInputVal, setMeterInputVal] = useState<string>(
    monthlyData.meterCurrent !== null && monthlyData.meterCurrent !== undefined
      ? String(monthlyData.meterCurrent)
      : ''
  );

  const calc = calculateApartmentBalance(monthlyData);

  const handleSaveMeter = () => {
    const val = meterInputVal.trim();
    if (val === '') {
      onUpdateMeter(apartment.id, null);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onUpdateMeter(apartment.id, num);
      }
    }
    setIsEditingMeter(false);
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between overflow-hidden">
      
      {/* Top Header */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-900 tracking-tight">
                {apartment.number}
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                · {apartment.floor}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-semibold text-neutral-800">
                {apartment.tenantName || 'شاغرة (غير مؤجرة)'}
              </span>
              {onEditApartment && (
                <button
                  onClick={() => onEditApartment(apartment)}
                  className="p-1 text-neutral-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                  title="تعديل بيانات الشقة أو تسجيل مستأجر جديد"
                  aria-label="تعديل الشقة والمستأجر"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {calc.status === 'owes' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>متبقي عليه</span>
              </span>
            )}
            {calc.status === 'settled' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مسدد بالكامل</span>
              </span>
            )}
            {calc.status === 'credit' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>له رصيد وفائض</span>
              </span>
            )}
          </div>
        </div>

        {/* Tenant Phone & Meter ID */}
        <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-1 text-neutral-600">
            <Phone className="w-3 h-3 text-neutral-400" />
            <span dir="ltr">{apartment.tenantPhone || '—'}</span>
          </div>
          <div className="text-neutral-500">
            عداد: <span className="font-mono-numbers text-neutral-700">{apartment.meterNumber || '—'}</span>
          </div>
        </div>
      </div>

      {/* Main Body: Breakdown */}
      <div className="p-4 space-y-3 text-sm flex-1">
        
        {/* Rent row */}
        <div className="flex items-center justify-between py-1 border-b border-neutral-100">
          <span className="text-neutral-600">الإيجار الشهري:</span>
          <span className="font-bold text-neutral-900 font-mono-numbers">
            {formatCurrency(calc.rentAmount, settings.currency)}
          </span>
        </div>

        {/* Electricity Box */}
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-900 font-semibold text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>فاتورة الكهرباء:</span>
            </div>
            
            {calc.hasMeterReading ? (
              <span className="font-bold text-amber-900 font-mono-numbers text-xs">
                {formatCurrency(calc.totalElectricityBill, settings.currency)}
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-medium">لم تُدخل القراءة بعد</span>
            )}
          </div>

          {/* Meter reading inline editor or preview */}
          {isEditingMeter ? (
            <div className="pt-1.5 border-t border-amber-200/40 space-y-2">
              <div className="text-xs text-neutral-600 flex justify-between">
                <span>القراءة السابقة:</span>
                <strong className="font-mono-numbers">{calc.meterPrevious}</strong>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="القراءة الحالية"
                  value={meterInputVal}
                  onChange={(e) => setMeterInputVal(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded px-2 py-1 text-xs font-mono-numbers focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveMeter}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded hover:bg-amber-700 shrink-0"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsEditingMeter(false)}
                  className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 shrink-0"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
              {calc.hasMeterReading ? (
                <div className="flex items-center gap-2 flex-wrap text-neutral-600">
                  <span>سابق: <strong className="font-mono-numbers">{calc.meterPrevious}</strong></span>
                  <span>حالي: <strong className="font-mono-numbers">{calc.meterCurrent}</strong></span>
                  <span className="text-amber-800 font-semibold font-mono-numbers">
                    ({calc.kwhConsumed} ك.و/س)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-neutral-500">
                  السابق: <strong className="font-mono-numbers">{calc.meterPrevious}</strong>
                </span>
              )}

              <button
                onClick={() => {
                  setMeterInputVal(
                    monthlyData.meterCurrent !== null && monthlyData.meterCurrent !== undefined
                      ? String(monthlyData.meterCurrent)
                      : ''
                  );
                  setIsEditingMeter(true);
                }}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-0.5 hover:underline"
              >
                <Edit3 className="w-3 h-3" />
                <span>{calc.hasMeterReading ? 'تعديل' : 'إدخال القراءة'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Previous Carryover if non-zero */}
        {calc.previousCarryover !== 0 && (
          <div className="flex items-center justify-between text-xs py-1 border-b border-neutral-100">
            <span className="text-neutral-500">رصيد سابق مرحّل:</span>
            <span className={`font-semibold font-mono-numbers ${calc.previousCarryover > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
              {calc.previousCarryover > 0
                ? `+ ${formatCurrency(calc.previousCarryover, settings.currency)} (عجز)`
                : `- ${formatCurrency(Math.abs(calc.previousCarryover), settings.currency)} (فائض)`}
            </span>
          </div>
        )}

        {/* Total Billed & Paid */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>إجمالي المطلوب:</span>
            <span className="font-bold text-neutral-900 font-mono-numbers">
              {formatCurrency(calc.totalNetDue, settings.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>إجمالي المسدد:</span>
            <span className="font-bold text-emerald-700 font-mono-numbers">
              {formatCurrency(calc.totalPaid, settings.currency)}
            </span>
          </div>
        </div>

        {/* Net Remaining Balance Banner */}
        <div
          className={`p-2.5 rounded-lg flex items-center justify-between ${
            calc.status === 'owes'
              ? 'bg-rose-50 border border-rose-200 text-rose-900'
              : calc.status === 'credit'
              ? 'bg-blue-50 border border-blue-200 text-blue-900'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
          }`}
        >
          <span className="text-xs font-bold">
            {calc.status === 'owes'
              ? 'المتبقي عليه:'
              : calc.status === 'credit'
              ? 'الرصيد الفائض له:'
              : 'حالة الحساب:'}
          </span>
          <span className="text-base font-extrabold font-mono-numbers">
            {calc.status === 'settled'
              ? 'خالص (0.00)'
              : formatCurrency(Math.abs(calc.balance), settings.currency)}
          </span>
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between gap-1 flex-wrap">
        <button
          onClick={() => onRecordPayment(apartment)}
          className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
          title="تسجيل دفعة سداد للشقة"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>سداد</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewStatement(apartment)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md transition-colors"
            title="كشف حساب الشقة"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSendWhatsApp(apartment)}
            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
            title="إرسال مطالبة عبر واتساب"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => onPrintReceipt(apartment)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md transition-colors"
            title="طباعة إيصال / فاتورة"
          >
            <Printer className="w-4 h-4" />
          </button>

          {onEditApartment && (
            <button
              onClick={() => onEditApartment(apartment)}
              className="p-1.5 text-neutral-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors"
              title="تعديل الشقة / مستأجر جديد"
            >
              <Edit2 className="w-4 h-4 text-amber-700" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
