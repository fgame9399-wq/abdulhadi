import React, { useState } from 'react';
import { Apartment, ApartmentMonthlyData, BuildingSettings, MonthCycle } from '../types';
import { calculateApartmentBalance, formatCurrency } from '../utils/calculations';
import { FileText, X, Trash2, Printer, MessageCircle, Plus, Zap, AlertCircle, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  cycle: MonthCycle;
  settings: BuildingSettings;
  onDeletePayment: (apartmentId: string, paymentId: string) => void;
  onUpdateCarryover: (apartmentId: string, carryover: number) => void;
  onOpenPaymentModal: (apartment: Apartment) => void;
  onOpenPrintModal: (apartment: Apartment) => void;
  onOpenWhatsAppModal: (apartment: Apartment) => void;
}

export const StatementModal: React.FC<StatementModalProps> = ({
  isOpen,
  onClose,
  apartment,
  cycle,
  settings,
  onDeletePayment,
  onUpdateCarryover,
  onOpenPaymentModal,
  onOpenPrintModal,
  onOpenWhatsAppModal,
}) => {
  const [editingCarry, setEditingCarry] = useState(false);
  const [carryVal, setCarryVal] = useState('0');

  React.useEffect(() => {
    if (isOpen && apartment) {
      const rec = cycle.records[apartment.id];
      setCarryVal(String(rec?.previousCarryover || 0));
      setEditingCarry(false);
    }
  }, [isOpen, apartment, cycle]);

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

  const handleSaveCarry = () => {
    const num = parseFloat(carryVal);
    onUpdateCarryover(apartment.id, isNaN(num) ? 0 : num);
    setEditingCarry(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900">
                  كشف حساب: {apartment.number}
                </h2>
                <span className="text-xs text-neutral-500 font-medium">({apartment.floor})</span>
              </div>
              <p className="text-xs text-neutral-600">
                المستأجر: <strong className="text-neutral-900">{apartment.tenantName}</strong> · الدورة: {cycle.label}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {/* Quick Balance Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
              <div className="text-xs text-neutral-500">إجمالي المطلوب للدورة</div>
              <div className="text-lg font-bold font-mono-numbers text-neutral-900 mt-0.5">
                {formatCurrency(calc.totalNetDue, settings.currency)}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="text-xs text-emerald-700">إجمالي المسدد</div>
              <div className="text-lg font-bold font-mono-numbers text-emerald-800 mt-0.5">
                {formatCurrency(calc.totalPaid, settings.currency)}
              </div>
            </div>

            <div
              className={`rounded-xl p-3 border ${
                calc.status === 'owes'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : calc.status === 'credit'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-800'
              }`}
            >
              <div className="text-xs font-semibold">
                {calc.status === 'owes'
                  ? 'متبقي عليه سداده'
                  : calc.status === 'credit'
                  ? 'رصيد فائض له'
                  : 'حالة الرصيد'}
              </div>
              <div className="text-lg font-extrabold font-mono-numbers mt-0.5">
                {calc.status === 'settled'
                  ? 'خالص (0.00)'
                  : formatCurrency(Math.abs(calc.balance), settings.currency)}
              </div>
            </div>
          </div>

          {/* Section 1: Invoiced Charges Breakdown */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 font-bold text-neutral-800 text-xs flex justify-between items-center">
              <span>بنود الاستحقاق لشهر {cycle.label}</span>
              <span>المبلغ</span>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Rent */}
              <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                <div>
                  <span className="font-semibold text-neutral-900">إيجار الشقة الشهري</span>
                </div>
                <span className="font-bold font-mono-numbers text-neutral-900">
                  {formatCurrency(calc.rentAmount, settings.currency)}
                </span>
              </div>

              {/* Electricity */}
              <div className="py-2 border-b border-neutral-100 space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>فاتورة الكهرباء (عداد {apartment.meterNumber})</span>
                  </div>
                  <span className="font-bold font-mono-numbers text-amber-900">
                    {calc.hasMeterReading
                      ? formatCurrency(calc.totalElectricityBill, settings.currency)
                      : 'قراءة العداد معلقة'}
                  </span>
                </div>

                {calc.hasMeterReading ? (
                  <div className="text-xs text-neutral-500 bg-amber-50/50 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
                    <span>القراءة السابقة: <strong className="font-mono-numbers">{calc.meterPrevious}</strong></span>
                    <span>القراءة الحالية: <strong className="font-mono-numbers">{calc.meterCurrent}</strong></span>
                    <span>الاستهلاك: <strong className="font-mono-numbers text-amber-800">{calc.kwhConsumed} ك.و/س</strong></span>
                    <span>التسعيرة: <strong className="font-mono-numbers">{calc.electricityCost > 0 ? (calc.electricityCost / (calc.kwhConsumed || 1)).toFixed(2) : settings.defaultKwhRate}</strong> {settings.currency}</span>
                    {calc.fixedFee > 0 && <span>رسوم خدمة: {formatCurrency(calc.fixedFee, settings.currency)}</span>}
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                    لم يتم تسجيل قراءة العداد الحالية لهذا الشهر بعد.
                  </div>
                )}
              </div>

              {/* Previous Carryover */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700">رصيد مرحل من الشهور السابقة:</span>
                  {editingCarry ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={carryVal}
                        onChange={(e) => setCarryVal(e.target.value)}
                        className="w-20 px-1 py-0.5 text-xs border border-neutral-300 rounded font-mono-numbers"
                      />
                      <button
                        onClick={handleSaveCarry}
                        className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded font-bold"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCarry(true)}
                      className="text-xs text-neutral-500 hover:text-neutral-800 underline"
                    >
                      تعديل
                    </button>
                  )}
                </div>

                <span className={`font-bold font-mono-numbers ${calc.previousCarryover > 0 ? 'text-rose-600' : calc.previousCarryover < 0 ? 'text-blue-600' : 'text-neutral-600'}`}>
                  {calc.previousCarryover > 0
                    ? `+ ${formatCurrency(calc.previousCarryover, settings.currency)}`
                    : calc.previousCarryover < 0
                    ? `- ${formatCurrency(Math.abs(calc.previousCarryover), settings.currency)}`
                    : `0.00 ${settings.currency}`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Payments History */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 font-bold text-neutral-800 text-xs flex justify-between items-center">
              <span>سجل سندات الدفع والتحصيل</span>
              <button
                onClick={() => onOpenPaymentModal(apartment)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة دفعة</span>
              </button>
            </div>

            {data.payments.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                لا توجد دفعات مسجلة لهذه الشقة في هذا الشهر حتى الآن.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.payments.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 font-mono-numbers">{p.date}</span>
                        <span className="text-neutral-500">·</span>
                        <span className="text-neutral-700 font-medium">
                          {p.category === 'rent' ? 'إيجار' : p.category === 'electricity' ? 'كهرباء' : 'شامل'}
                        </span>
                        <span className="text-neutral-400">
                          ({p.method === 'transfer' ? 'تحويل بنكي' : p.method === 'cash' ? 'نقدي' : 'شيك'})
                        </span>
                        {p.receiptNumber && (
                          <span className="text-neutral-500 font-mono-numbers">#{p.receiptNumber}</span>
                        )}
                      </div>
                      {p.notes && <div className="text-neutral-500 text-xs mt-0.5">{p.notes}</div>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono-numbers text-emerald-700 text-sm">
                        {formatCurrency(p.amount, settings.currency)}
                      </span>
                      <button
                        onClick={() => onDeletePayment(apartment.id, p.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                        title="حذف هذه الدفعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintModal(apartment)}
              className="px-3 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-neutral-600" />
              <span>طباعة إيصال وفاتورة</span>
            </button>

            <button
              onClick={() => onOpenWhatsAppModal(apartment)}
              className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال مطالبة واتساب</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPaymentModal(apartment)}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل سداد الآن</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-200/60 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
