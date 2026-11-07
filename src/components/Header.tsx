import React from 'react';
import { User } from 'firebase/auth';
import { BuildingSettings, MonthCycle } from '../types';
import { Building2, Plus, Zap, Settings, Calendar, Users, Smartphone, Cloud, RefreshCw } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  settings: BuildingSettings;
  cycles: MonthCycle[];
  activeCycleId: string;
  onSelectCycle: (cycleId: string) => void;
  onOpenNewMonth: () => void;
  onOpenBatchMeters: () => void;
  onOpenNewPayment: () => void;
  onOpenSettings: (initialTab?: 'general' | 'apartments' | 'backup') => void;
  activeView: 'dashboard' | 'batchMeters';
  setActiveView: (view: 'dashboard' | 'batchMeters') => void;
  currentUser?: User | null;
  isSyncing?: boolean;
  onOpenCloudModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cycles,
  activeCycleId,
  onSelectCycle,
  onOpenNewMonth,
  onOpenBatchMeters,
  onOpenNewPayment,
  onOpenSettings,
  activeView,
  setActiveView,
  currentUser,
  isSyncing,
  onOpenCloudModal,
}) => {
  const activeCycle = cycles.find((c) => c.id === activeCycleId) || cycles[0];

  return (
    <header className="no-print bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
      {/* Zone 1, 2, 3 Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap block">
                {settings.buildingName || 'حسابات العمارة'}
              </span>
              <span className="text-xs text-neutral-500 hidden sm:block">
                الإيجارات الشهرية وفواتير الكهرباء
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'dashboard'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              لوحة الشقق والحسابات
            </button>
            <button
              onClick={() => setActiveView('batchMeters')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeView === 'batchMeters'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 group-hover:text-amber-600" />
              <span>قراءة عدادات الكهرباء</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cloud Sync Status / Sign In Button */}
            {onOpenCloudModal && (
              <button
                onClick={onOpenCloudModal}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ${
                  currentUser
                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                }`}
                title={
                  currentUser
                    ? `متصل بالسحابة (${currentUser.email}) - اضغط للإدارة والمزامنة`
                    : 'تسجيل الدخول بالإيميل وحفظ البيانات على السحابة'
                }
              >
                <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-600' : 'text-blue-600'}`} />
                <span className="hidden sm:inline max-w-28 truncate">
                  {currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0]) : 'حفظ سحابي'}
                </span>
                <span className="sm:hidden">
                  {currentUser ? 'سحابي' : 'سحابة'}
                </span>
                {isSyncing && <RefreshCw className="w-3 h-3 text-emerald-700 animate-spin" />}
              </button>
            )}

            {/* PWA Install Button for Mobile and Desktop */}
            <PWAInstallButton />

            {/* Quick Manage Apartments Button */}
            <button
              onClick={() => onOpenSettings('apartments')}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="تعديل عدد الشقق وإضافة مستأجرين جدد"
            >
              <Users className="w-4 h-4 text-neutral-600" />
              <span className="hidden lg:inline">تهيئة الشقق والمستأجرين</span>
              <span className="lg:hidden">الشقق</span>
            </button>

            <button
              onClick={onOpenNewPayment}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="تسجيل دفعة أو سداد من مستأجر"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل سداد</span>
              <span className="sm:hidden">سداد</span>
            </button>

            <button
              onClick={() => onOpenSettings('general')}
              className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              title="إعدادات العمارة والأسعار والنسخ الاحتياطي"
              aria-label="الإعدادات"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Sub Bar: Cycle Selector & Cycle Actions */}
      <div className="bg-neutral-50/80 border-t border-neutral-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
          
          {/* Month selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>الشهر الحالي:</span>
            </div>
            <select
              value={activeCycleId}
              onChange={(e) => onSelectCycle(e.target.value)}
              className="bg-white border border-neutral-300 rounded-md px-3 py-1 font-semibold text-neutral-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick cycle tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBatchMeters}
              className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-amber-700" />
              <span>تسجيل قراءات العدادات دفعة واحدة</span>
            </button>

            <button
              onClick={onOpenNewMonth}
              className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-md transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-600" />
              <span>بدء شهر جديد + تدوير القراءات</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
