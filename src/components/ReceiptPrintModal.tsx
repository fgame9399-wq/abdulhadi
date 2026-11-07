import React from 'react';
import { Apartment, ApartmentMonthlyData, BuildingSettings, MonthCycle } from '../types';
import { calculateApartmentBalance, formatCurrency } from '../utils/calculations';
import { Printer, X, Building, CheckCircle2 } from 'lucide-react';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  cycle: MonthCycle;
  settings: BuildingSettings;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  apartment,
  cycle,
  settings,
}) => {
  if (!isOpen || !apartment) return null;

  const data = cycle.records[apartment.id] || {
    apartmentId: apartment.id,
    rentAmount: apartment.defaultRent,
    meterPrevious: 0,
    meterCurrent: null,
    kwhRate: settings.defaultKwhRate,
    fixedServiceFee: settings.defaultFixedServiceFee,
    previousCarryover: 0,
    payments: [],
  };

  const calc = calculateApartmentBalance(data);
  const printDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] print-modal-container">
        
        {/* Controls Header (Hidden in Print) */}
        <div className="no-print px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-neutral-700" />
            <span className="font-bold text-neutral-900 text-sm">
              معاينة وسند الطباعة / الفاتورة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن (Ctrl + P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-neutral-900 text-sm print-only">
          
          {/* Invoice Document Header */}
          <div className="border-b-2 border-neutral-900 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                  {settings.buildingName}
                </h1>
                <p className="text-xs text-neutral-600 mt-1">
                  إشعار مطالبة وسند سداد شهري (إيجار وكهرباء)
                </p>
                {settings.ownerName && (
                  <p className="text-xs text-neutral-500">
                    الإدارة: {settings.ownerName} {settings.ownerPhone ? `| ${settings.ownerPhone}` : ''}
                  </p>
                )}
              </div>

              <div className="text-left" dir="ltr">
                <div className="text-xs font-mono font-bold text-neutral-800">
                  DATE: {new Date().toISOString().slice(0, 10)}
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                  MONTH: {cycle.id}
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Details Box */}
          <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-500 block">رقم وتفاصيل الشقة:</span>
              <strong className="text-sm text-neutral-900">{apartment.number} ({apartment.floor})</strong>
            </div>
            <div>
              <span className="text-neutral-500 block">اسم المستأجر:</span>
              <strong className="text-sm text-neutral-900">{apartment.tenantName}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block">رقم هاتف المستأجر:</span>
              <span className="font-mono text-neutral-800" dir="ltr">{apartment.tenantPhone || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">الدورة الحسابية:</span>
              <strong className="text-neutral-900">{cycle.label}</strong>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="mb-6">
            <table className="w-full text-right border-collapse border border-neutral-300 text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800">
                  <th className="p-2.5 border-l border-neutral-300">البيان والتفاصيل</th>
                  <th className="p-2.5 border-l border-neutral-300 w-24">الكمية / الاستهلاك</th>
                  <th className="p-2.5 border-l border-neutral-300 w-24">السعر</th>
                  <th className="p-2.5 w-28 text-left">المبلغ المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {/* Rent */}
                <tr>
                  <td className="p-2.5 border-l border-neutral-200 font-medium">
                    إيجار الشقة لشهر {cycle.label}
                  </td>
                  <td className="p-2.5 border-l border-neutral-200 text-neutral-500">1 شهر</td>
                  <td className="p-2.5 border-l border-neutral-200 font-mono text-neutral-700">
                    {formatCurrency(calc.rentAmount, '')}
                  </td>
                  <td className="p-2.5 font-bold font-mono text-left">
                    {formatCurrency(calc.rentAmount, settings.currency)}
                  </td>
                </tr>

                {/* Electricity */}
                <tr>
                  <td className="p-2.5 border-l border-neutral-200">
                    <div className="font-medium text-neutral-900">فاتورة الكهرباء (عداد رقم: {apartment.meterNumber})</div>
                    {calc.hasMeterReading ? (
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        القراءة السابقة: {calc.meterPrevious} | القراءة الحالية: {calc.meterCurrent}
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-500 mt-0.5">قراءة العداد غير مسجلة</div>
                    )}
                  </td>
                  <td className="p-2.5 border-l border-neutral-200 font-mono text-neutral-700">
                    {calc.hasMeterReading ? `${calc.kwhConsumed} ك.و/س` : '—'}
                  </td>
                  <td className="p-2.5 border-l border-neutral-200 font-mono text-neutral-700">
                    {calc.electricityCost > 0 ? (calc.electricityCost / (calc.kwhConsumed || 1)).toFixed(2) : settings.defaultKwhRate}
                  </td>
                  <td className="p-2.5 font-bold font-mono text-left">
                    {formatCurrency(calc.totalElectricityBill, settings.currency)}
                  </td>
                </tr>

                {/* Previous Carryover if exists */}
                {calc.previousCarryover !== 0 && (
                  <tr>
                    <td colSpan={3} className="p-2.5 border-l border-neutral-200 text-neutral-700 font-medium">
                      رصيد سابق مرحل من الشهور السابقة
                    </td>
                    <td className="p-2.5 font-bold font-mono text-left">
                      {calc.previousCarryover > 0 ? `+ ${formatCurrency(calc.previousCarryover, settings.currency)}` : `- ${formatCurrency(Math.abs(calc.previousCarryover), settings.currency)}`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary Totals */}
          <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-4 space-y-2 text-xs mb-6">
            <div className="flex justify-between text-neutral-700">
              <span>إجمالي المستحق المطلوب:</span>
              <strong className="font-mono text-sm">{formatCurrency(calc.totalNetDue, settings.currency)}</strong>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>إجمالي ما تم سداده ودفعه:</span>
              <strong className="font-mono text-sm">{formatCurrency(calc.totalPaid, settings.currency)}</strong>
            </div>
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-center text-sm font-bold">
              <span>
                {calc.status === 'owes'
                  ? 'المتبقي مطلوب سداده:'
                  : calc.status === 'credit'
                  ? 'رصيد فائض للمستأجر:'
                  : 'الحساب:'}
              </span>
              <span className={`font-mono text-base ${calc.status === 'owes' ? 'text-rose-700' : 'text-emerald-700'}`}>
                {calc.status === 'settled'
                  ? 'خالص ومسدد بالكامل (0.00)'
                  : formatCurrency(Math.abs(calc.balance), settings.currency)}
              </span>
            </div>
          </div>

          {/* Payments list if any */}
          {data.payments.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold text-neutral-700 block mb-1">تفاصيل الدفعات المستلمة:</span>
              <div className="border border-neutral-200 rounded p-2 text-xs space-y-1">
                {data.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-neutral-600">
                    <span>{p.date} - {p.method === 'transfer' ? 'تحويل بنكي' : p.method === 'cash' ? 'نقدي' : 'شيك'} {p.receiptNumber ? `(#${p.receiptNumber})` : ''}</span>
                    <strong className="font-mono">{formatCurrency(p.amount, settings.currency)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="pt-8 border-t border-neutral-300 grid grid-cols-2 text-center text-xs text-neutral-700">
            <div>
              <div className="font-bold mb-8">توقيع المستأجر</div>
              <div className="border-b border-dashed border-neutral-400 w-36 mx-auto"></div>
            </div>
            <div>
              <div className="font-bold mb-8">توقيع المالك / الإدارة</div>
              <div className="border-b border-dashed border-neutral-400 w-36 mx-auto"></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
