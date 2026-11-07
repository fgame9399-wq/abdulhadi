import React, { useState } from 'react';
import { BuildingSettings, Apartment, AppData } from '../types';
import { exportBackup, getDefaultAppData } from '../utils/storage';
import { Settings, Save, Download, Upload, RotateCcw, X, Plus, Edit2, Check, Trash2, Building, Cloud } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BuildingSettings;
  apartments: Apartment[];
  fullAppData: AppData;
  initialTab?: 'general' | 'apartments' | 'backup';
  onSaveSettings: (settings: BuildingSettings) => void;
  onUpdateApartments: (apartments: Apartment[]) => void;
  onRestoreData: (restored: AppData) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  apartments,
  fullAppData,
  initialTab = 'general',
  onSaveSettings,
  onUpdateApartments,
  onRestoreData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'apartments' | 'backup'>(initialTab);
  const [formData, setFormData] = useState<BuildingSettings>({ ...settings });
  const [aptsList, setAptsList] = useState<Apartment[]>([...apartments]);
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [aptForm, setAptForm] = useState<Partial<Apartment>>({});
  const [savedAlert, setSavedAlert] = useState(false);

  // Quick generator wizard state
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorCount, setGeneratorCount] = useState<number>(apartments.length || 10);
  const [generatorRent, setGeneratorRent] = useState<number>(1600);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFormData({ ...settings });
      setAptsList([...apartments]);
      setEditingAptId(null);
      setAptForm({});
      setSavedAlert(false);
      setGeneratorCount(apartments.length || 10);
    }
  }, [isOpen, settings, apartments, initialTab]);

  if (!isOpen) return null;

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  const handleSaveApartment = (aptId: string) => {
    const updated = aptsList.map((a) => {
      if (a.id === aptId) {
        return {
          ...a,
          ...aptForm,
        };
      }
      return a;
    });
    setAptsList(updated);
    onUpdateApartments(updated);
    setEditingAptId(null);
    setAptForm({});
  };

  const handleAddNewApartment = () => {
    const newNum = aptsList.length + 1;
    const newApt: Apartment = {
      id: `apt-${Date.now()}`,
      number: `شقة ${newNum}`,
      floor: 'الدور الأرضي',
      tenantName: 'مستأجر جديد',
      tenantPhone: '',
      defaultRent: 1500,
      meterNumber: `E-${newNum + 100}`,
      status: 'occupied',
    };
    const nextList = [...aptsList, newApt];
    setAptsList(nextList);
    onUpdateApartments(nextList);
  };

  const handleBatchGenerate = () => {
    const count = Number(generatorCount);
    if (!count || count < 1 || count > 100) {
      alert('يرجى تحديد عدد شقق صحيح بين 1 و 100');
      return;
    }

    if (window.confirm(`هل أنت متأكد من رغبتك في تهيئة العمارة بعدد ${count} شقة؟ سيتم توليد القائمة ويمكنك تعديل بيانات المستأجرين وأرقام العدادات بعدها.`)) {
      const generated: Apartment[] = [];
      for (let i = 1; i <= count; i++) {
        const floorIdx = Math.floor((i - 1) / 3);
        const floorText = floorIdx === 0 ? 'الدور الأرضي' : `الدور ${floorIdx}`;
        generated.push({
          id: `apt-${i}`,
          number: `شقة ${i}`,
          floor: floorText,
          tenantName: `مستأجر شقة ${i}`,
          tenantPhone: '',
          defaultRent: generatorRent || 1500,
          meterNumber: `E-${i + 100}`,
          status: 'occupied',
        });
      }
      setAptsList(generated);
      onUpdateApartments(generated);
      setShowGenerator(false);
    }
  };

  const handleDeleteApartment = (aptId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الشقة من النظام؟')) {
      const nextList = aptsList.filter((a) => a.id !== aptId);
      setAptsList(nextList);
      onUpdateApartments(nextList);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings && parsed.apartments && parsed.cycles) {
          onRestoreData(parsed);
          alert('تم استيراد النسخة الاحتياطية بنجاح!');
          onClose();
        } else {
          alert('الملف غير صالح أو لا يحتوي على بنية البيانات المطلوبة.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (window.confirm('هل أنت متأكد من استعادة البيانات النموذجية الافتراضية؟ سيتم استبدال البيانات الحالية.')) {
      const defaultData = getDefaultAppData();
      onRestoreData(defaultData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                إعدادات العمارة والشقق والبيانات
              </h2>
              <p className="text-xs text-neutral-500">
                تخصيص الأسعار، معلومات المستأجرين، والنسخ الاحتياطي
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-neutral-200 flex items-center gap-2 bg-neutral-50/50">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            الإعدادات العامة والأسعار
          </button>

          <button
            onClick={() => setActiveTab('apartments')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'apartments'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            إدارة بيانات الشقق الـ {aptsList.length}
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            النسخ الاحتياطي واستعادة البيانات
          </button>
        </div>

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleGeneralSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  اسم العمارة:
                </label>
                <input
                  type="text"
                  required
                  value={formData.buildingName}
                  onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  رمز / اسم العملة:
                </label>
                <input
                  type="text"
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="ر.س"
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  اسم مالك العمارة / المسؤول:
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  رقم هاتف المالك (للتواصل في الإشعارات):
                </label>
                <input
                  type="text"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono-numbers focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  سعر الكيلوواط/ساعة الافتراضي ({formData.currency}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.defaultKwhRate}
                  onChange={(e) => setFormData({ ...formData, defaultKwhRate: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono-numbers focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-neutral-500 mt-1 block">
                  مثال: 0.18 أو 0.20 أو 0.30 حسب تسعيرة شركة الكهرباء.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  رسوم خدمة أو نظافة شهرية ثابتة ({formData.currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.defaultFixedServiceFee}
                  onChange={(e) => setFormData({ ...formData, defaultFixedServiceFee: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-mono-numbers focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-neutral-500 mt-1 block">
                  رسوم إضافية تضاف لفاتورة الخدمات (يمكن تركها 0).
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
              {savedAlert ? (
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  تم حفظ وتحديث الإعدادات بنجاح!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Apartment List Management */}
        {activeTab === 'apartments' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
            
            {/* Quick Generator & Setup Card */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-950">
                    تهيئة وتخصيص عدد شقق العمارة (لأصحاب العمائر الجديدة)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerator(!showGenerator)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  {showGenerator ? 'إخفاء المعالج' : 'تحديد عدد الشقق دفعة واحدة...'}
                </button>
              </div>

              {showGenerator && (
                <div className="pt-2 border-t border-amber-200/60 space-y-3 text-xs">
                  <p className="text-neutral-600">
                    حدد إجمالي عدد الشقق في عمارتك لإنشاء وهيكلة القائمة بالكامل تلقائياً:
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-700">عدد الشقق:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={generatorCount}
                        onChange={(e) => setGeneratorCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 bg-white border border-amber-300 rounded px-2 py-1 font-bold text-center font-mono-numbers"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-700">الإيجار الافتراضي للشقة:</span>
                      <input
                        type="number"
                        value={generatorRent}
                        onChange={(e) => setGeneratorRent(parseFloat(e.target.value) || 0)}
                        className="w-24 bg-white border border-amber-300 rounded px-2 py-1 font-bold text-center font-mono-numbers"
                      />
                      <span>{formData.currency}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBatchGenerate}
                      className="px-3.5 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      تطبيق وتوليد {generatorCount} شقة
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-xs text-neutral-600">
                قائمة شقق العمارة ({aptsList.length} شقة) · انقر على أيقونة القلم لتعديل أي شقة ومستأجر:
              </span>
              <button
                type="button"
                onClick={handleAddNewApartment}
                className="px-3 py-1.5 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شقة فردية</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-700 font-bold">
                    <th className="p-2.5">الشقة</th>
                    <th className="p-2.5">الدور</th>
                    <th className="p-2.5">اسم المستأجر</th>
                    <th className="p-2.5">رقم الهاتف</th>
                    <th className="p-2.5">الإيجار التعاقدي</th>
                    <th className="p-2.5">رقم العداد</th>
                    <th className="p-2.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {aptsList.map((apt) => {
                    const isEditing = editingAptId === apt.id;

                    if (isEditing) {
                      return (
                        <tr key={apt.id} className="bg-amber-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={aptForm.number ?? apt.number}
                              onChange={(e) => setAptForm({ ...aptForm, number: e.target.value })}
                              className="w-20 bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={aptForm.floor ?? apt.floor}
                              onChange={(e) => setAptForm({ ...aptForm, floor: e.target.value })}
                              className="w-24 bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={aptForm.tenantName ?? apt.tenantName}
                              onChange={(e) => setAptForm({ ...aptForm, tenantName: e.target.value })}
                              className="w-36 bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={aptForm.tenantPhone ?? apt.tenantPhone}
                              onChange={(e) => setAptForm({ ...aptForm, tenantPhone: e.target.value })}
                              className="w-28 bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={aptForm.defaultRent ?? apt.defaultRent}
                              onChange={(e) => setAptForm({ ...aptForm, defaultRent: parseFloat(e.target.value) || 0 })}
                              className="w-24 bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={aptForm.meterNumber ?? apt.meterNumber}
                              onChange={(e) => setAptForm({ ...aptForm, meterNumber: e.target.value })}
                              className="w-20 bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleSaveApartment(apt.id)}
                              className="p-1 text-emerald-700 hover:text-emerald-900"
                              title="حفظ"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAptId(null);
                                setAptForm({});
                              }}
                              className="p-1 text-neutral-500 hover:text-neutral-700"
                              title="إلغاء"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={apt.id} className="hover:bg-neutral-50">
                        <td className="p-2.5 font-bold text-neutral-900">{apt.number}</td>
                        <td className="p-2.5 text-neutral-600">{apt.floor}</td>
                        <td className="p-2.5 font-semibold text-neutral-800">{apt.tenantName}</td>
                        <td className="p-2.5 font-mono text-neutral-600" dir="ltr">{apt.tenantPhone || '—'}</td>
                        <td className="p-2.5 font-mono font-bold text-neutral-900">{apt.defaultRent} {formData.currency}</td>
                        <td className="p-2.5 font-mono text-neutral-600">{apt.meterNumber}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingAptId(apt.id);
                              setAptForm({
                                number: apt.number,
                                floor: apt.floor,
                                tenantName: apt.tenantName,
                                tenantPhone: apt.tenantPhone,
                                defaultRent: apt.defaultRent,
                                meterNumber: apt.meterNumber,
                              });
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-900"
                            title="تعديل الشقة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {aptsList.length > 1 && (
                            <button
                              onClick={() => handleDeleteApartment(apt.id)}
                              className="p-1 text-neutral-400 hover:text-rose-600"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
            {/* Cloud Auto-Backup Highlight */}
            <div className="bg-gradient-to-l from-blue-50 via-white to-blue-50/40 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Cloud className="w-5 h-5 text-blue-600 shrink-0" />
                <span>النسخ الاحتياطي والمزامنة السحابية (Firebase Cloud)</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                التطبيق متصل الآن بالسحابة! يمكنك تسجيل الدخول بحساب Google الخاص بك من الشريط العلوي لحفظ كافة البيانات والشقق والدفعات ومزامنتها تلقائياً بين أجهزتك وهاتفك المحمول دون الحاجة لتنزيل ملفات يدوياً.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-neutral-700" />
                <span>تصدير نسخة احتياطية من البيانات</span>
              </h3>
              <p className="text-xs text-neutral-600">
                قم بتنزيل ملف يحتوي على كافة بيانات العمارة، الشقق، سجلات القراءات، والدفعات للرجوع إليها في أي وقت.
              </p>
              <button
                type="button"
                onClick={() => exportBackup(fullAppData)}
                className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل ملف النسخة الاحتياطية (JSON)</span>
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-neutral-700" />
                <span>استيراد واستعادة نسخة احتياطية</span>
              </h3>
              <p className="text-xs text-neutral-600">
                استرجاع بيانات سابقة من ملف تم تنزيله مسبقاً.
              </p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-neutral-600" />
                <span>اختيار ملف النسخة الاحتياطية</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-rose-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-700" />
                <span>إعادة تعيين البيانات للوضع الافتراضي (15 شقة نموذجية)</span>
              </h3>
              <p className="text-xs text-rose-700">
                تنبيه: هذا الإجراء سيستبدل البيانات الحالية بالبيانات النموذجية الافتراضية للعمارة.
              </p>
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg"
              >
                إعادة ضبط البيانات النموذجية
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
