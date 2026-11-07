import { ApartmentMonthlyData, Apartment, MonthCycle, BuildingSettings } from '../types';

export interface CalculatedApartmentBalance {
  apartmentId: string;
  hasMeterReading: boolean;
  meterPrevious: number;
  meterCurrent: number | null;
  kwhConsumed: number;
  electricityCost: number;
  fixedFee: number;
  totalElectricityBill: number;
  rentAmount: number;
  monthTotalBilled: number; // rent + electricity
  previousCarryover: number; // positive = owed from before, negative = had credit
  totalNetDue: number; // carryover + monthTotalBilled
  totalPaid: number;
  paidRent: number;
  paidElectricity: number;
  paidGeneral: number;
  balance: number; // positive = owes, negative = credit, 0 = settled
  status: 'owes' | 'credit' | 'settled';
}

export function calculateApartmentBalance(data: ApartmentMonthlyData): CalculatedApartmentBalance {
  const hasMeterReading = data.meterCurrent !== null && data.meterCurrent !== undefined;
  
  let kwhConsumed = 0;
  if (hasMeterReading && data.meterCurrent !== null) {
    kwhConsumed = Math.max(0, data.meterCurrent - data.meterPrevious);
  }

  const electricityCost = hasMeterReading ? Math.round((kwhConsumed * data.kwhRate) * 100) / 100 : 0;
  const fixedFee = hasMeterReading || data.fixedServiceFee > 0 ? (data.fixedServiceFee || 0) : 0;
  const totalElectricityBill = electricityCost + fixedFee;

  const rentAmount = data.rentAmount || 0;
  const monthTotalBilled = rentAmount + totalElectricityBill;
  const previousCarryover = data.previousCarryover || 0;
  const totalNetDue = previousCarryover + monthTotalBilled;

  const payments = data.payments || [];
  let totalPaid = 0;
  let paidRent = 0;
  let paidElectricity = 0;
  let paidGeneral = 0;

  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    totalPaid += amt;
    if (p.category === 'rent') paidRent += amt;
    else if (p.category === 'electricity') paidElectricity += amt;
    else paidGeneral += amt;
  }

  const balance = Math.round((totalNetDue - totalPaid) * 100) / 100;
  
  let status: 'owes' | 'credit' | 'settled' = 'settled';
  if (balance > 0.01) {
    status = 'owes';
  } else if (balance < -0.01) {
    status = 'credit';
  }

  return {
    apartmentId: data.apartmentId,
    hasMeterReading,
    meterPrevious: data.meterPrevious || 0,
    meterCurrent: data.meterCurrent,
    kwhConsumed,
    electricityCost,
    fixedFee,
    totalElectricityBill,
    rentAmount,
    monthTotalBilled,
    previousCarryover,
    totalNetDue,
    totalPaid,
    paidRent,
    paidElectricity,
    paidGeneral,
    balance,
    status,
  };
}

export function formatCurrency(amount: number, currency: string = 'ر.س'): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export const ARABIC_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function getArabicMonthLabel(year: number, month: number): string {
  const monthName = ARABIC_MONTH_NAMES[month - 1] || `شهر ${month}`;
  return `${monthName} ${year}`;
}

export function generateWhatsAppMessage(
  apartment: Apartment,
  cycle: MonthCycle,
  calc: CalculatedApartmentBalance,
  settings: BuildingSettings
): string {
  const lines: string[] = [];

  lines.push(`السلام عليكم ورحمة الله وبركاته`);
  lines.push(`الأخ الفاضل/ ${apartment.tenantName || 'المستأجر الكريم'}`);
  lines.push(`تحية طيبة، مرفق لكم بيان حساب (${apartment.number} - ${settings.buildingName}) لشهر ${cycle.label}:`);
  lines.push(`---------------------------------`);
  
  // Rent
  lines.push(`🏢 إيجار الشقة: ${calc.rentAmount.toFixed(2)} ${settings.currency}`);
  
  // Electricity
  if (calc.hasMeterReading) {
    lines.push(`⚡ فاتورة الكهرباء: ${calc.totalElectricityBill.toFixed(2)} ${settings.currency}`);
    lines.push(`   ▪ القراءة السابقة: ${calc.meterPrevious}`);
    lines.push(`   ▪ القراءة الحالية: ${calc.meterCurrent}`);
    lines.push(`   ▪ الاستهلاك: ${calc.kwhConsumed} ك.و/س (${calc.kwhConsumed} × ${calc.electricityCost > 0 ? (calc.electricityCost / (calc.kwhConsumed || 1)).toFixed(2) : settings.defaultKwhRate})`);
    if (calc.fixedFee > 0) {
      lines.push(`   ▪ رسوم إضافية/خدمات: ${calc.fixedFee.toFixed(2)} ${settings.currency}`);
    }
  } else {
    lines.push(`⚡ فاتورة الكهرباء: (لم تُسجل قراءة العداد بعد)`);
  }

  // Previous balance
  if (calc.previousCarryover > 0) {
    lines.push(`⏳ رصيد سابق متبقي عليك: ${calc.previousCarryover.toFixed(2)} ${settings.currency}`);
  } else if (calc.previousCarryover < 0) {
    lines.push(`💰 رصيد سابق فائض لك: ${Math.abs(calc.previousCarryover).toFixed(2)} ${settings.currency}`);
  }

  lines.push(`---------------------------------`);
  lines.push(`📋 إجمالي المطلوب: ${calc.totalNetDue.toFixed(2)} ${settings.currency}`);
  lines.push(`💵 إجمالي المدفوع: ${calc.totalPaid.toFixed(2)} ${settings.currency}`);
  lines.push(`---------------------------------`);

  if (calc.balance > 0.01) {
    lines.push(`🔴 المتبقي عليك سداده: ${calc.balance.toFixed(2)} ${settings.currency}`);
    lines.push(`يرجى التكرم بالتحويل والسداد شاكرين لكم حسن تعاونكم.`);
  } else if (calc.balance < -0.01) {
    lines.push(`🟢 لك رصيد متبقٍ وفائض: ${Math.abs(calc.balance).toFixed(2)} ${settings.currency}`);
    lines.push(`تم قيد الرصيد الفائض في حسابكم للشهر القادم بإذن الله.`);
  } else {
    lines.push(`✅ الحساب خالص ومسدد بالكامل (المتبقي: 0.00 ${settings.currency})`);
    lines.push(`شكراً لكم وبارك الله فيكم.`);
  }

  if (settings.ownerName) {
    lines.push(`---------------------------------`);
    lines.push(`إدارة: ${settings.ownerName}${settings.ownerPhone ? ` | ${settings.ownerPhone}` : ''}`);
  }

  return lines.join('\n');
}
