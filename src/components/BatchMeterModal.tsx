import React, { useState } from 'react';
import { Apartment, ApartmentMonthlyData, BuildingSettings, MonthCycle } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Zap, Save, CheckCircle, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface BatchMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  cycle: MonthCycle;
  settings: BuildingSettings;
  onSaveBatch: (updatedRecords: Record<string, Partial<ApartmentMonthlyData>>) => void;
}

export const BatchMeterModal: React.FC<BatchMeterModalProps> = ({
  isOpen,
  onClose,
  apartments,
  cycle,
  settings,
  onSaveBatch,
}) => {
  // Local draft state for meter readings
  const [readings, setReadings] = useState<Record<string, { current: string; previous: string; rate: string }>>({});
  const [uniformRate, setUniformRate] = useState<string>(String(settings.defaultKwhRate));
  const [successSaved, setSuccessSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<string, { current: string; previous: string; rate: string }> = {};
      for (const apt of apartments) {
        const rec = cycle.records[apt.id] || {
          meterPrevious: 0,
          meterCurrent: null,
          kwhRate: settings.defaultKwhRate,
        };
        initial[apt.id] = {
          previous: String(rec.meterPrevious || 0),
          current: rec.meterCurrent !== null && rec.meterCurrent !== undefined ? String(rec.meterCurrent) : '',
          rate: String(rec.kwhRate || settings.defaultKwhRate),
        };
      }
      setReadings(initial);
      setUniformRate(String(settings.defaultKwhRate));
      setSuccessSaved(false);
    }
  }, [isOpen, cycle, apartments, settings]);

  if (!isOpen) return null;

  const handleCurrentChange = (aptId: string, val: string) => {
    setReadings((prev) => ({
      ...prev,
      [aptId]: { ...prev[aptId], current: val },
    }));
    setSuccessSaved(false);
  };

  const handlePreviousChange = (aptId: string, val: string) => {
    setReadings((prev) => ({
      ...prev,
      [aptId]: { ...prev[aptId], previous: val },
    }));
    setSuccessSaved(false);
  };

  const handleApplyUniformRate = () => {
    const rateVal = parseFloat(uniformRate);
    if (!isNaN(rateVal) && rateVal > 0) {
      setReadings((prev) => {
        const next = { ...prev };
        for (const id in next) {
          next[id] = { ...next[id], rate: String(rateVal) };
        }
        return next;
      });
    }
  };

  const handleSave = () => {
    const payload: Record<string, Partial<ApartmentMonthlyData>> = {};

    for (const apt of apartments) {
      const state = readings[apt.id];
      if (!state) continue;

      const prevNum = parseFloat(state.previous) || 0;
      const currNum = state.current.trim() === '' ? null : parseFloat(state.current);
      const rateNum = parseFloat(state.rate) || settings.defaultKwhRate;

      payload[apt.id] = {
        meterPrevious: prevNum,
        meterCurrent: isNaN(currNum as number) ? null : currNum,
        kwhRate: rateNum,
      };
    }

    onSaveBatch(payload);
    setSuccessSaved(true);
    setTimeout(() => {
      setSuccessSaved(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-neutral-200">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                تسجيل قراءات عدادات الكهرباء ({apartments.length} شقة)
              </h2>
              <p className="text-xs text-neutral-500">
                الدورة الحالية: {cycle.label} · يتم حساب الاستهلاك ومبلغ الكهرباء فورياً وبشكل تلقائي ودقيق
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Controls & Tariff Strip */}
        <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-950">
              تسعيرة الكيلوواط الموحدة:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                value={uniformRate}
                onChange={(e) => setUniformRate(e.target.value)}
                className="w-20 bg-white border border-amber-300 rounded px-2 py-1 text-xs font-mono-numbers text-center focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-xs text-neutral-600">{settings.currency} / ك.و.س</span>
              <button
                type="button"
                onClick={handleApplyUniformRate}
                className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                تطبيق على الجميع
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-600">
            أدخل القراءة الحالية لكل شقة وسيتم احتساب فارق الاستهلاك وقيمة الفاتورة فورياً.
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1 p-6">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-xs font-bold text-neutral-600 bg-neutral-50/80">
                <th className="py-2.5 px-3">رقم الشقة</th>
                <th className="py-2.5 px-3">المستأجر</th>
                <th className="py-2.5 px-3">رقم العداد</th>
                <th className="py-2.5 px-3">القراءة السابقة</th>
                <th className="py-2.5 px-3 bg-amber-100/50 text-amber-950">القراءة الحالية (أدخل هنا)</th>
                <th className="py-2.5 px-3">الاستهلاك (ك.و/س)</th>
                <th className="py-2.5 px-3">سعر الكيلوواط</th>
                <th className="py-2.5 px-3">فاتورة الكهرباء</th>
                <th className="py-2.5 px-3">الإيجار</th>
                <th className="py-2.5 px-3">المطلوب الكلي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {apartments.map((apt) => {
                const draft = readings[apt.id] || { current: '', previous: '0', rate: '0.20' };
                const prev = parseFloat(draft.previous) || 0;
                const currEntered = draft.current.trim() !== '';
                const curr = currEntered ? parseFloat(draft.current) : null;
                const rate = parseFloat(draft.rate) || settings.defaultKwhRate;
                
                const rec = cycle.records[apt.id] || { rentAmount: apt.defaultRent, fixedServiceFee: settings.defaultFixedServiceFee };
                const rent = rec.rentAmount || apt.defaultRent;
                const fixedFee = rec.fixedServiceFee || settings.defaultFixedServiceFee;

                let consumption = 0;
                let isInvalidNegative = false;

                if (curr !== null && !isNaN(curr)) {
                  if (curr < prev) {
                    isInvalidNegative = true;
                    consumption = 0;
                  } else {
                    consumption = curr - prev;
                  }
                }

                const elecAmount = currEntered ? Math.round((consumption * rate + fixedFee) * 100) / 100 : 0;
                const totalMonth = rent + elecAmount;

                return (
                  <tr key={apt.id} className="hover:bg-neutral-50/80 transition-colors">
                    
                    {/* Apt Number */}
                    <td className="py-2.5 px-3 font-bold text-neutral-900 whitespace-nowrap">
                      {apt.number}
                      <span className="text-xs text-neutral-500 font-normal block">{apt.floor}</span>
                    </td>

                    {/* Tenant */}
                    <td className="py-2.5 px-3 text-neutral-800 font-medium whitespace-nowrap">
                      {apt.tenantName}
                    </td>

                    {/* Meter Serial */}
                    <td className="py-2.5 px-3 text-neutral-500 font-mono-numbers text-xs">
                      {apt.meterNumber}
                    </td>

                    {/* Previous Reading */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={draft.previous}
                        onChange={(e) => handlePreviousChange(apt.id, e.target.value)}
                        className="w-24 bg-neutral-100 border border-neutral-300 rounded px-2 py-1 text-xs font-mono-numbers text-center focus:bg-white focus:ring-1 focus:ring-amber-500"
                        title="القراءة السابقة (يمكن تعديلها إن لزم)"
                      />
                    </td>

                    {/* Current Reading (Main Input) */}
                    <td className="py-2.5 px-3 bg-amber-50/30">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="مثلاً: 15400"
                          value={draft.current}
                          onChange={(e) => handleCurrentChange(apt.id, e.target.value)}
                          className={`w-28 bg-white border rounded px-2.5 py-1.5 text-xs font-bold font-mono-numbers text-center focus:outline-hidden focus:ring-2 ${
                            isInvalidNegative
                              ? 'border-rose-500 text-rose-700 ring-rose-200'
                              : 'border-amber-400 text-neutral-900 ring-amber-300'
                          }`}
                        />
                        {isInvalidNegative && (
                          <span title="تنبيه: القراءة الحالية أقل من السابقة!" className="text-rose-600">
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Consumed kWh */}
                    <td className="py-2.5 px-3 font-mono-numbers font-semibold text-neutral-900">
                      {currEntered ? (
                        <span className={isInvalidNegative ? 'text-rose-600' : 'text-neutral-900'}>
                          {consumption.toLocaleString()} ك.و/س
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Tariff */}
                    <td className="py-2.5 px-3 font-mono-numbers text-xs text-neutral-600">
                      {rate.toFixed(2)}
                    </td>

                    {/* Electricity Bill */}
                    <td className="py-2.5 px-3 font-mono-numbers font-bold text-amber-700 whitespace-nowrap">
                      {currEntered ? formatCurrency(elecAmount, '') : <span className="text-neutral-400 text-xs">—</span>}
                    </td>

                    {/* Rent */}
                    <td className="py-2.5 px-3 font-mono-numbers text-neutral-700 whitespace-nowrap">
                      {formatCurrency(rent, '')}
                    </td>

                    {/* Total Month */}
                    <td className="py-2.5 px-3 font-mono-numbers font-bold text-neutral-900 whitespace-nowrap">
                      {formatCurrency(totalMonth, settings.currency)}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            {successSaved && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                تم حفظ وتحديث جميع قراءات العدادات وحساب المستحقات بنجاح!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتحديث الحسابات</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
