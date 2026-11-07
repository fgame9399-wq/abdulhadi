import React, { useState, useEffect } from 'react';
import { Apartment, BuildingSettings, MonthCycle } from '../types';
import { UserCheck, X, Save, Building, Phone, Hash, Zap, DollarSign } from 'lucide-react';

interface EditApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  settings: BuildingSettings;
  cycle: MonthCycle;
  onSaveApartment: (updatedApt: Apartment, newStartingMeter?: number, newRentAmount?: number) => void;
}

export const EditApartmentModal: React.FC<EditApartmentModalProps> = ({
  isOpen,
  onClose,
  apartment,
  settings,
  cycle,
  onSaveApartment,
}) => {
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [currentCycleRent, setCurrentCycleRent] = useState<string>('');
  const [startingMeter, setStartingMeter] = useState<string>('');

  useEffect(() => {
    if (isOpen && apartment) {
      setFormData({
        id: apartment.id,
        number: apartment.number,
        floor: apartment.floor,
        tenantName: apartment.tenantName,
        tenantPhone: apartment.tenantPhone,
        defaultRent: apartment.defaultRent,
        meterNumber: apartment.meterNumber,
        status: apartment.status,
        notes: apartment.notes || '',
      });

      const rec = cycle.records[apartment.id];
      setCurrentCycleRent(String(rec?.rentAmount || apartment.defaultRent));
      setStartingMeter(String(rec?.meterPrevious || 0));
    }
  }, [isOpen, apartment, cycle]);

  if (!isOpen || !apartment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number) return;

    const updatedApt: Apartment = {
      ...apartment,
      number: formData.number || apartment.number,
      floor: formData.floor || apartment.floor,
      tenantName: formData.tenantName || 'شاغرة',
      tenantPhone: formData.tenantPhone || '',
      defaultRent: Number(formData.defaultRent) || apartment.defaultRent,
      meterNumber: formData.meterNumber || apartment.meterNumber,
      status: formData.status || 'occupied',
      notes: formData.notes || '',
    };

    const newMeterNum = startingMeter.trim() !== '' ? parseFloat(startingMeter) : undefined;
    const newRentNum = currentCycleRent.trim() !== '' ? parseFloat(currentCycleRent) : undefined;

    onSaveApartment(updatedApt, newMeterNum, newRentNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                تعديل بيانات الشقة والمستأجر
              </h2>
              <p className="text-xs text-neutral-500">
                {apartment.number} · {apartment.floor}
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
          
          {/* Apt Number & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                رقم / مسمى الشقة: *
              </label>
              <input
                type="text"
                required
                value={formData.number || ''}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="مثلاً: شقة 1 أو ملحق 2"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                الدور / الطابق:
              </label>
              <input
                type="text"
                value={formData.floor || ''}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="مثلاً: الدور الأول"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Tenant Name & Mobile Phone */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-bold text-amber-950 block">
              بيانات المستأجر الحالي:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  اسم المستأجر:
                </label>
                <input
                  type="text"
                  value={formData.tenantName || ''}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  placeholder="اسم المستأجر الجديد"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900 font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  رقم جوال المستأجر:
                </label>
                <input
                  type="text"
                  value={formData.tenantPhone || ''}
                  onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900 font-mono focus:ring-2 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                حالة الإشغال:
              </label>
              <select
                value={formData.status || 'occupied'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900 font-semibold focus:ring-2 focus:ring-amber-500"
              >
                <option value="occupied">مشغولة / مؤجرة</option>
                <option value="vacant">شاغرة / غير مؤجرة</option>
              </select>
            </div>
          </div>

          {/* Rent & Electricity Meter Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                الإيجار الشهري التعاقدي ({settings.currency}):
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.defaultRent || ''}
                onChange={(e) => setFormData({ ...formData, defaultRent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-bold font-mono-numbers text-neutral-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                رقم عداد الكهرباء:
              </label>
              <input
                type="text"
                value={formData.meterNumber || ''}
                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                placeholder="مثلاً: E-101"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-mono text-neutral-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Current Month Rent & Starting Meter */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-neutral-800 block">
              تحديث الدورة الحالية ({cycle.label}):
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 mb-0.5">القراءة السابقة / بداية العقد:</label>
                <input
                  type="number"
                  value={startingMeter}
                  onChange={(e) => setStartingMeter(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-1.5 font-mono-numbers"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-0.5">إيجار هذا الشهر المطالب به:</label>
                <input
                  type="number"
                  value={currentCycleRent}
                  onChange={(e) => setCurrentCycleRent(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-1.5 font-mono-numbers"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              ملاحظات إضافية عن العقد أو الشقة:
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="مثلاً: تأمين 500 ريال مدفوع، تجديد سنوي في محرم"
              className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بيانات الشقة</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
