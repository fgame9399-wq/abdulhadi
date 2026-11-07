import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, Share2, PlusSquare, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running inside standalone app, no need to show install button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button in Header/Top Bar */}
      <button
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
        title="تثبيت التطبيق على هاتفك المحمول للعمل كتطبيق مستقل"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-700" />
        <span className="hidden sm:inline">تثبيت التطبيق على الجوال</span>
        <span className="sm:hidden">تثبيت التطبيق</span>
      </button>

      {/* Guide Modal for iOS or manual instructions */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-neutral-200 overflow-hidden text-neutral-900">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    تثبيت التطبيق على هاتفك المحمول
                  </h3>
                  <p className="text-xs text-neutral-500">
                    يعمل كتطبيق جوال مستقل وسريع وبدون إنترنت
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              {isIOS ? (
                /* iOS Safari instructions */
                <div className="space-y-3">
                  <p className="font-semibold text-neutral-800">
                    لتثبيت التطبيق على أجهزة الآيفون والآيباد (iPhone / iPad):
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block text-neutral-900">اضغط على زر المشاركة</strong>
                        <span className="text-neutral-500 text-xs flex items-center gap-1">
                          أيقونة <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> في أسفل شاشة متصفح Safari.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block text-neutral-900">اختر "إضافة إلى الشاشة الرئيسية"</strong>
                        <span className="text-neutral-500 text-xs flex items-center gap-1">
                          (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline text-neutral-700" /> من القائمة.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block text-emerald-900">اضغط "إضافة" (Add) في الزاوية العلوية</strong>
                        <span className="text-emerald-700 text-xs">
                          سيظهر التطبيق كأيقونة مستقلة على شاشتك الرئيسية، ويفتح بملء الشاشة مع حفظ البيانات.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Chrome instructions */
                <div className="space-y-3">
                  <p className="font-semibold text-neutral-800">
                    لتثبيت التطبيق على هواتف أندرويد (Android) أو الكمبيوتر:
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block text-neutral-900">من خيارات المتصفح (⋮)</strong>
                        <span className="text-neutral-500 text-xs">
                          اضغط على قائمة الثلاث نقاط في أعلى أو أسفل المتصفح.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block text-neutral-900">اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</strong>
                        <span className="text-neutral-500 text-xs">
                          (Install app / Add to Home screen)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block text-emerald-900">استخدام فوري وسريع</strong>
                        <span className="text-emerald-700 text-xs">
                          سيتم تثبيت التطبيق وفتحه كبرنامج مستقل بدون شريط المتصفح.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق الآن مباشرة</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
              >
                فهمت، حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
