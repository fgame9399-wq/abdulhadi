import React, { useState, useEffect } from 'react';
import { Apartment, BuildingSettings, MonthCycle, Payment } from '../types';
import { calculateApartmentBalance, formatCurrency } from '../utils/calculations';
import { Plus, X, Check, CreditCard, DollarSign } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  cycle: MonthCycle;
  settings: BuildingSettings;
  preSelectedApartmentId?: string;
  onAddPayment: (apartmentId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  apartments,
  cycle,
  settings,
  preSelectedApartmentId,
  onAddPayment,
}) => {
  const [selectedAptId, setSelectedAptId] = useState<string>(
    preSelectedApartmentId || apartments[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<'general' | 'rent' | 'electricity'>('general');
  const [method, setMethod] = useState<'transfer' | 'cash' | 'cheque'>('transfer');
  const [receiptNumber, setReceiptNumber] = useState<string>(() => `REC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (preSelectedApartmentId) {
        setSelectedAptId(preSelectedApartmentId);
      } else if (apartments[0]) {
        setSelectedAptId(apartments[0].id);
      }
      setReceiptNumber(`REC-${Math.floor(1000 + Math.random() * 9000)}`);
      setAmount('');
      setNotes('');
    }
  }, [isOpen, preSelectedApartmentId, apartments]);

  if (!isOpen) return null;

  const currentApt = apartments.find((a) => a.id === selectedAptId) || apartments[0];
  const monthlyData = currentApt ? cycle.records[currentApt.id] || {
    apartmentId: currentApt.id,
    rentAmount: currentApt.defaultRent,
    meterPrevious: 0,
    meterCurrent: null,
    kwhRate: settings.defaultKwhRate,
    fixedServiceFee: settings.defaultFixedServiceFee,
    previousCarryover: 0,
    payments: [],
  } : null;

  const calc = monthlyData ? calculateApartmentBalance(monthlyData) : null;

  const handleFillFullBalance = () => {
    if (calc && calc.balance > 0) {
      setAmount(String(calc.balance));
    }
  };

  const handleFillRentOnly = () => {
    if (calc) {
      setAmount(String(calc.rentAmount));
      setCategory('rent');
    }
  };

  const handleFillElecOnly = () => {
    if (calc && calc.totalElectricityBill > 0) {
      setAmount(String(calc.totalElectricityBill));
      setCategory('electricity');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    onAddPayment(selectedAptId, {
      date,
      amount: numAmount,
      category,
      method,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                تسجيل سند قبض / سداد دفعة
              </h2>
              <p className="text-xs text-neutral-500">
                شهر: {cycle.label}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          
          {/* Select Apartment */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              اختر الشقة / المستأجر:
            </label>
            <select
              value={selectedAptId}
              onChange={(e) => setSelectedAptId(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-semibold text-neutral-900 focus:ring-2 focus:ring-emerald-500"
            >
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.number} — {a.tenantName} ({a.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Current balance display for selected apartment */}
          {calc && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>الإيجار: {formatCurrency(calc.rentAmount, settings.currency)}</span>
                <span>الكهرباء: {calc.hasMeterReading ? formatCurrency(calc.totalElectricityBill, settings.currency) : 'معلقة'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-neutral-200 font-bold">
                <span>المتبقي المطلوب سداده:</span>
                <span className={`font-mono-numbers text-sm ${calc.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {calc.balance > 0
                    ? formatCurrency(calc.balance, settings.currency)
                    : calc.balance < 0
                    ? `له فائض: ${formatCurrency(Math.abs(calc.balance), settings.currency)}`
                    : 'خالص ومسدد بالكامل'}
                </span>
              </div>

              {/* Quick Fill Buttons */}
              <div className="flex gap-1.5 pt-1 flex-wrap">
                {calc.balance > 0 && (
                  <button
                    type="button"
                    onClick={handleFillFullBalance}
                    className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded font-semibold hover:bg-emerald-200"
                  >
                    سداد كامل المتبقي ({calc.balance})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFillRentOnly}
                  className="px-2 py-0.5 text-xs bg-neutral-200 text-neutral-800 rounded font-semibold hover:bg-neutral-300"
                >
                  الإيجار فقط ({calc.rentAmount})
                </button>
                {calc.totalElectricityBill > 0 && (
                  <button
                    type="button"
                    onClick={handleFillElecOnly}
                    className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded font-semibold hover:bg-amber-200"
                  >
                    الكهرباء فقط ({calc.totalElectricityBill})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                المبلغ المدفوع ({settings.currency}): *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-bold font-mono-numbers text-base text-neutral-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                تاريخ السداد:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                نوع الدفعة:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="general">شامل (إيجار + كهرباء)</option>
                <option value="rent">إيجار الشقة فقط</option>
                <option value="electricity">فاتورة الكهرباء فقط</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                طريقة الدفع:
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="transfer">تحويل بنكي</option>
                <option value="cash">نقداً (كاش)</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
          </div>

          {/* Receipt number and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                رقم السند / المرجع:
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="رقم السند"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono-numbers focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                ملاحظات إضافية:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: إيداع في بنك الراجحي"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتأكيد السند</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
