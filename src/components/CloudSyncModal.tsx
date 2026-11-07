import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Mail,
  Smartphone,
  X,
  UploadCloud,
  DownloadCloud,
} from 'lucide-react';
import { AppData } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onManualSyncUp: () => Promise<void>;
  onManualSyncDown: () => Promise<void>;
  appData: AppData;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSyncing,
  lastSyncedAt,
  onSignIn,
  onSignOut,
  onManualSyncUp,
  onManualSyncDown,
  appData,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleAction = async (name: string, fn: () => Promise<void>, successText: string) => {
    try {
      setLoadingAction(name);
      setActionMessage(null);
      await fn();
      setActionMessage({ text: successText, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setActionMessage({
        text: err?.message || 'حدث خطأ أثناء تنفيذ العملية، يرجى المحاولة مرة أخرى.',
        type: 'error',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-l from-blue-50/50 to-neutral-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              currentUser ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                المزامنة والحفظ السحابي
              </h2>
              <p className="text-xs text-neutral-500">
                ربط حساب المالك وحفظ الشقق والحسابات على السحابة (Firebase)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Status Banner */}
          {currentUser ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>أنت متصل بالسحابة حالياً ومفعل الحفظ التلقائي</span>
                </div>
                {isSyncing && (
                  <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>جاري المزامنة...</span>
                  </span>
                )}
              </div>

              {/* User Identity info */}
              <div className="flex items-center gap-3 bg-white/80 border border-emerald-100 rounded-lg p-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'صورة المستخدم'}
                    className="w-10 h-10 rounded-full border border-emerald-300 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-neutral-900 text-xs sm:text-sm truncate">
                    {currentUser.displayName || 'مالك العمارة'}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 truncate" dir="ltr">
                    <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span>{currentUser.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-emerald-900/80 flex items-center justify-between pt-1">
                <span>آخر مزامنة ناجحة:</span>
                <span className="font-mono-numbers font-medium">
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('ar-SA') : 'منذ قليل'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span>سجل دخولك لحفظ بياناتك سحابياً والوصول إليها من أي مكان</span>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                حالياً بياناتك محفوظة محلياً على هذا المتصفح فقط. عند تسجيل الدخول بايميلك (حساب Google)، سيتم رفع بيانات العمارة والـ {appData.apartments.length} شقة والدفعات إلى قاعدة بيانات سحابية مشفرة خاصة بك وحدك.
              </p>
            </div>
          )}

          {/* Action Message Alert */}
          {actionMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Cloud Features Bullet Points */}
          <div className="space-y-2 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
            <div className="font-bold text-neutral-800">مزايا الحفظ السحابي لعقاراتك:</div>
            <ul className="space-y-1.5 list-disc list-inside text-neutral-600">
              <li>
                <strong>الوصول من أي هاتف أو كمبيوتر:</strong> افتح نفس الرابط وسجل دخولك لتجد كل حساباتك وسجلاتك محدثة.
              </li>
              <li>
                <strong>حماية من ضياع البيانات:</strong> حتى لو قمت بمسح ذاكرة المتصفح أو غيرت الهاتف، بياناتك محفوظة دائماً.
              </li>
              <li>
                <strong>خصوصية وأمان كامل:</strong> قواعد أمان Firebase تضمن ألا يتمكن أي شخص آخر من قراءة أو تعديل بيانات عمارتك.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2.5">
            {currentUser ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleAction(
                        'syncUp',
                        onManualSyncUp,
                        'تم حفظ ورفع كامل بيانات العمارة للشفرة السحابية بنجاح!'
                      )
                    }
                    disabled={!!loadingAction}
                    className="px-3 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>{loadingAction === 'syncUp' ? 'جاري الرفع...' : 'رفع الحالي للسحابة'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        'syncDown',
                        onManualSyncDown,
                        'تم تحديث البيانات وجلب أحدث نسخة من السحابة بنجاح!'
                      )
                    }
                    disabled={!!loadingAction}
                    className="px-3 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <DownloadCloud className="w-4 h-4 text-emerald-600" />
                    <span>{loadingAction === 'syncDown' ? 'جاري الجلب...' : 'جلب أحدث نسخة'}</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    handleAction('signOut', onSignOut, 'تم تسجيل الخروج بنجاح. البيانات المحلية ما زالت محفوظة.')
                  }
                  disabled={!!loadingAction}
                  className="w-full px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج من الحساب السحابي</span>
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  handleAction(
                    'signIn',
                    onSignIn,
                    'تم تسجيل الدخول بنجاح! تم تفعيل الحفظ السحابي التلقائي.'
                  )
                }
                disabled={!!loadingAction}
                className="w-full px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                <span>
                  {loadingAction === 'signIn'
                    ? 'جاري تسجيل الدخول...'
                    : 'تسجيل الدخول باستخدام حساب Google (بالإيميل)'}
                </span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
