export interface Payment {
  id: string;
  date: string;
  amount: number;
  category: 'rent' | 'electricity' | 'general';
  method: 'cash' | 'transfer' | 'cheque';
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Apartment {
  id: string;
  number: string; // e.g. "شقة 1", "شقة 2"
  floor: string; // e.g. "الدور الأول"
  tenantName: string;
  tenantPhone: string;
  defaultRent: number;
  meterNumber: string; // e.g. "E-101"
  status: 'occupied' | 'vacant';
  notes?: string;
}

export interface ApartmentMonthlyData {
  apartmentId: string;
  rentAmount: number;
  meterPrevious: number;
  meterCurrent: number | null; // null if not yet entered
  kwhRate: number; // electricity price per kWh
  fixedServiceFee: number; // optional fixed fee (water/services)
  previousCarryover: number; // balance carried over from previous months (positive = owes money, negative = has credit)
  payments: Payment[];
  notes?: string;
}

export interface MonthCycle {
  id: string; // e.g. "2026-10"
  label: string; // e.g. "أكتوبر 2026"
  year: number;
  month: number; // 1 - 12
  isClosed?: boolean;
  records: Record<string, ApartmentMonthlyData>; // key is apartmentId
}

export interface BuildingSettings {
  buildingName: string;
  ownerName: string;
  ownerPhone: string;
  currency: string; // e.g. "ر.س", "ج.م", "$", "د.ك", "د.إ"
  defaultKwhRate: number; // e.g. 0.20
  defaultFixedServiceFee: number; // e.g. 0
  rentDueDay: number; // 1st of month
}

export interface AppData {
  settings: BuildingSettings;
  apartments: Apartment[];
  cycles: MonthCycle[];
  activeCycleId: string;
  version: number;
}
