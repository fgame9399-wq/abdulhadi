import React, { useState, useEffect } from 'react';
import { Apartment, BuildingSettings, MonthCycle } from '../types';
import { calculateApartmentBalance, generateWhatsAppMessage } from '../utils/calculations';
import { MessageCircle, Copy, Check, ExternalLink, X } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  cycle: MonthCycle;
  settings: BuildingSettings;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  apartment,
  cycle,
  settings,
}) => {
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && apartment) {
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
      const generated = generateWhatsAppMessage(apartment, cycle, calc, settings);
      setMessage(generated);
      setCopied(false);
    }
  }, [isOpen, apartment, cycle, settings]);

  if (!isOpen || !apartment) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = (apartment.tenantPhone || '').replace(/[^0-9]/g, '');
    // If Saudi number starts with 05, format with 966
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '966' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('5')) {
      cleanPhone = '966' + cleanPhone;
    }
    
    const encoded = encodeURIComponent(message);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                إرسال مطالبة واتساب للمستأجر
              </h2>
              <p className="text-xs text-neutral-500">
                {apartment.number} · {apartment.tenantName} ({apartment.tenantPhone || 'بدون رقم'})
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

        {/* Textarea for message preview & customization */}
        <div className="p-6 space-y-3 flex-1 text-sm">
          <label className="block text-xs font-semibold text-neutral-600">
            نص الرسالة الجاهزة (يمكنك التعديل عليها قبل الإرسال):
          </label>

          <textarea
            rows={12}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3.5 text-xs text-neutral-800 font-mono leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />

          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>سيتم فتح تطبيق واتساب مباشرة أو يمكنك نسخ النص فقط.</span>
            {copied && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                تم نسخ النص بنجاح!
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-bold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-600" />}
            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-200/60 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>إرسال عبر واتساب</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
