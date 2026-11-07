import React, { useState } from 'react';
import { Apartment, BuildingSettings, MonthCycle } from '../types';
import { ARABIC_MONTH_NAMES, getArabicMonthLabel, calculateApartmentBalance } from '../utils/calculations';
import { Calendar, Plus, X, ArrowRight, Check } from 'lucide-react';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycles: MonthCycle[];
  activeCycleId: string;
  apartments: Apartment[];
  settings: BuildingSettings;
  onCreateCycle: (newCycle: MonthCycle) => void;
}

export const NewMonthModal: React.FC<NewMonthModalProps> = ({
  isOpen,
  onClose,
  cycles,
  activeCycleId,
  apartments,
  settings,
  onCreateCycle,
}) => {
  const currentCycle = cycles.find((c) => c.id === activeCycleId) || cycles[0];

  // Default next month
  const initialNextMonth = currentCycle ? (currentCycle.month >= 12 ? 1 : currentCycle.month + 1) : 11;
  const initialNextYear = currentCycle ? (currentCycle.month >= 12 ? currentCycle.year + 1 : currentCycle.year) : 2026;

  const [selectedYear, setSelectedYear] = useState<number>(initialNextYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialNextMonth);
  const [carryoverMeterReadings, setCarryoverMeterReadings] = useState<boolean>(true);
  const [carryoverBalances, setCarryoverBalances] = useState<boolean>(true);

  React.useEffect(() => {
    if (isOpen && currentCycle) {
      const nextM = currentCycle.month >= 12 ? 1 : currentCycle.month + 1;
      const nextY = currentCycle.month >= 12 ? currentCycle.year + 1 : currentCycle.year;
      setSelectedMonth(nextM);
      setSelectedYear(nextY);
    }
  }, [isOpen, currentCycle]);

  if (!isOpen) return null;

  const newCycleId = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const alreadyExists = cycles.some((c) => c.id === newCycleId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyExists) return;

    const label = getArabicMonthLabel(selectedYear, selectedMonth);
    const records: Record<string, any> = {};

    for (const apt of apartments) {
      const prevRec = currentCycle?.records[apt.id];
      const prevCalc = prevRec ? calculateApartmentBalance(prevRec) : null;

      // Smart meter roll over: previous reading becomes the old current reading
      let newPreviousMeter = 0;
      if (carryoverMeterReadings && prevRec) {
        if (prevRec.meterCurrent !== null && prevRec.meterCurrent !== undefined) {
          newPreviousMeter = prevRec.meterCurrent;
        } else {
          newPreviousMeter = prevRec.meterPrevious || 0;
        }
      }

      // Smart carryover balance: if owes money or has credit
      let newCarryoverBalance = 0;
      if (carryoverBalances && prevCalc) {
        newCarryoverBalance = prevCalc.balance;
      }

      records[apt.id] = {
        apartmentId: apt.id,
        rentAmount: apt.defaultRent,
        meterPrevious: newPreviousMeter,
        meterCurrent: null, // blank so landlord enters this month's reading
        kwhRate: prevRec?.kwhRate || settings.defaultKwhRate,
        fixedServiceFee: prevRec?.fixedServiceFee || settings.defaultFixedServiceFee,
        previousCarryover: newCarryoverBalance,
        payments: [],
        notes: '',
      };
    }

    const newCycle: MonthCycle = {
      id: newCycleId,
      label,
      year: selectedYear,
      month: selectedMonth,
      records,
    };

    onCreateCycle(newCycle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-neutral-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                بدء شهر حسابي جديد
              </h2>
              <p className="text-xs text-neutral-500">
                إنشاء دورة جديدة لجميع الشقق ({apartments.length} شقة)
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
        <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                الشهر:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {ARABIC_MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name} ({idx + 1})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                السنة:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {[2025, 2026, 2027, 2028, 2029].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {alreadyExists && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg font-medium">
              هذا الشهر موجود بالفعل في القائمة! يمكنك اختياره مباشرة من أعلى الصفحة.
            </div>
          )}

          {/* Smart Roll Over Options */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-bold text-neutral-800 block">
              خيارات التدوير والترحيل التلقائي:
            </span>

            <label className="flex items-start gap-2.5 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryoverMeterReadings}
                onChange={(e) => setCarryoverMeterReadings(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <strong className="block text-neutral-900">تدوير قراءات عدادات الكهرباء</strong>
                <span className="text-neutral-500">
                  تصبح القراءة الحالية للشهر السابق هي القراءة السابقة للشهر الجديد تلقائياً.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryoverBalances}
                onChange={(e) => setCarryoverBalances(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <strong className="block text-neutral-900">ترحيل الأرصدة والمتبقي</strong>
                <span className="text-neutral-500">
                  ترحيل المبالغ المتبقية على المستأجرين أو الفوائض لهم للشهر الجديد.
                </span>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={alreadyExists}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>بدء الدورة الجديدة</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
