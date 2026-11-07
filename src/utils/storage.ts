import { AppData, Apartment, MonthCycle, BuildingSettings, ApartmentMonthlyData } from '../types';

const STORAGE_KEY = 'building_accounting_app_data_v2';

export const INITIAL_APARTMENTS: Apartment[] = [
  { id: 'apt-1', number: 'شقة 1', floor: 'الدور الأرضي', tenantName: 'أحمد سالم القرني', tenantPhone: '0501112233', defaultRent: 1500, meterNumber: 'E-101', status: 'occupied' },
  { id: 'apt-2', number: 'شقة 2', floor: 'الدور الأرضي', tenantName: 'محمد عبدالله العتيبي', tenantPhone: '0502223344', defaultRent: 1500, meterNumber: 'E-102', status: 'occupied' },
  { id: 'apt-3', number: 'شقة 3', floor: 'الدور الأول', tenantName: 'طارق زياد المصري', tenantPhone: '0503334455', defaultRent: 1600, meterNumber: 'E-103', status: 'occupied' },
  { id: 'apt-4', number: 'شقة 4', floor: 'الدور الأول', tenantName: 'سعيد مبارك الدوسري', tenantPhone: '0504445566', defaultRent: 1600, meterNumber: 'E-104', status: 'occupied' },
  { id: 'apt-5', number: 'شقة 5', floor: 'الدور الأول', tenantName: 'إبراهيم يوسف الحازمي', tenantPhone: '0505556677', defaultRent: 1600, meterNumber: 'E-105', status: 'occupied' },
  { id: 'apt-6', number: 'شقة 6', floor: 'الدور الثاني', tenantName: 'عمر فهد السبيعي', tenantPhone: '0506667788', defaultRent: 1700, meterNumber: 'E-106', status: 'occupied' },
  { id: 'apt-7', number: 'شقة 7', floor: 'الدور الثاني', tenantName: 'خالد ناصر المطيري', tenantPhone: '0507778899', defaultRent: 1700, meterNumber: 'E-107', status: 'occupied' },
  { id: 'apt-8', number: 'شقة 8', floor: 'الدور الثاني', tenantName: 'ماجد عبدالعزيز الغامدي', tenantPhone: '0508889900', defaultRent: 1700, meterNumber: 'E-108', status: 'occupied' },
  { id: 'apt-9', number: 'شقة 9', floor: 'الدور الثالث', tenantName: 'عبدالرحمن صالح العمري', tenantPhone: '0509990011', defaultRent: 1750, meterNumber: 'E-109', status: 'occupied' },
  { id: 'apt-10', number: 'شقة 10', floor: 'الدور الثالث', tenantName: 'فيصل حمد الشمري', tenantPhone: '0551122334', defaultRent: 1750, meterNumber: 'E-110', status: 'occupied' },
  { id: 'apt-11', number: 'شقة 11', floor: 'الدور الثالث', tenantName: 'ياسر وليد المغربي', tenantPhone: '0552233445', defaultRent: 1750, meterNumber: 'E-111', status: 'occupied' },
  { id: 'apt-12', number: 'شقة 12', floor: 'الدور الرابع', tenantName: 'سلطان ممدوح العنزي', tenantPhone: '0553344556', defaultRent: 1800, meterNumber: 'E-112', status: 'occupied' },
  { id: 'apt-13', number: 'شقة 13', floor: 'الدور الرابع', tenantName: 'عادل حسن الزهراني', tenantPhone: '0554455667', defaultRent: 1800, meterNumber: 'E-113', status: 'occupied' },
  { id: 'apt-14', number: 'شقة 14', floor: 'الدور الرابع', tenantName: 'وليد محمود الكردي', tenantPhone: '0555566778', defaultRent: 1800, meterNumber: 'E-114', status: 'occupied' },
  { id: 'apt-15', number: 'شقة 15', floor: 'الملحق العلوي', tenantName: 'بدر خالد الشهري', tenantPhone: '0556677889', defaultRent: 1900, meterNumber: 'E-115', status: 'occupied' },
];

export const INITIAL_SETTINGS: BuildingSettings = {
  buildingName: 'عمارة الأمل السكنية (15 شقة)',
  ownerName: 'أبو فهد (مالك العمارة)',
  ownerPhone: '0500000000',
  currency: 'ر.س',
  defaultKwhRate: 0.20,
  defaultFixedServiceFee: 15, // 15 ريال رسوم خدمة شهرية
  rentDueDay: 1,
};

function generateInitialCycle(): MonthCycle {
  const records: Record<string, ApartmentMonthlyData> = {};

  // Sample data simulating the current month with varied realistic states
  const sampleReadings = [
    { id: 'apt-1', prev: 14200, curr: 14850, rent: 1500, paid: 1645, carry: 0 }, // Fully settled
    { id: 'apt-2', prev: 21300, curr: 21950, rent: 1500, paid: 1500, carry: 50 }, // Owes electricity + small carryover
    { id: 'apt-3', prev: 8900, curr: 9420, rent: 1600, paid: 1719, carry: 0 }, // Settled
    { id: 'apt-4', prev: 33400, curr: 34100, rent: 1600, paid: 1000, carry: 5200 }, // Over 3 months overdue! (5,200 / 1600 = 3.25 months)
    { id: 'apt-5', prev: 12500, curr: 13150, rent: 1600, paid: 1745, carry: 0 }, // Settled
    { id: 'apt-6', prev: 17800, curr: 18550, rent: 1700, paid: 1900, carry: 0 }, // Overpaid (credit)
    { id: 'apt-7', prev: 9800, curr: 10420, rent: 1700, paid: 1839, carry: 0 }, // Settled
    { id: 'apt-8', prev: 25400, curr: 26180, rent: 1700, paid: 0, carry: 5500 }, // Over 3 months overdue! (5,500 / 1700 = 3.23 months)
    { id: 'apt-9', prev: 11200, curr: null, rent: 1750, paid: 1750, carry: 0 }, // Meter reading pending
    { id: 'apt-10', prev: 19400, curr: 20120, rent: 1750, paid: 1909, carry: 0 }, // Settled
    { id: 'apt-11', prev: 14600, curr: 15300, rent: 1750, paid: 1800, carry: 0 }, // Partial
    { id: 'apt-12', prev: 31000, curr: 31750, rent: 1800, paid: 1965, carry: 0 }, // Settled
    { id: 'apt-13', prev: 22100, curr: null, rent: 1800, paid: 0, carry: 0 }, // Meter reading pending
    { id: 'apt-14', prev: 18300, curr: 19050, rent: 1800, paid: 1965, carry: 0 }, // Settled
    { id: 'apt-15', prev: 27900, curr: 28720, rent: 1900, paid: 2079, carry: 0 }, // Settled
  ];

  for (const item of sampleReadings) {
    const payments = [];
    if (item.paid > 0) {
      payments.push({
        id: `pay-${item.id}-1`,
        date: '2026-10-02',
        amount: item.paid,
        category: 'general' as const,
        method: 'transfer' as const,
        receiptNumber: `REC-${item.id.replace('apt-', '')}01`,
        notes: 'سداد عن طريق تحويل بنكي',
        createdAt: '2026-10-02T10:00:00Z',
      });
    }

    records[item.id] = {
      apartmentId: item.id,
      rentAmount: item.rent,
      meterPrevious: item.prev,
      meterCurrent: item.curr,
      kwhRate: 0.20,
      fixedServiceFee: 15,
      previousCarryover: item.carry,
      payments,
      notes: '',
    };
  }

  return {
    id: '2026-10',
    label: 'أكتوبر 2026',
    year: 2026,
    month: 10,
    isClosed: false,
    records,
  };
}

export function getDefaultAppData(): AppData {
  const currentCycle = generateInitialCycle();
  return {
    settings: INITIAL_SETTINGS,
    apartments: INITIAL_APARTMENTS,
    cycles: [currentCycle],
    activeCycleId: currentCycle.id,
    version: 2,
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if v1 exists, if so migrate and add sample overdue carryover if absent
      const oldRaw = localStorage.getItem('building_accounting_app_data_v1');
      if (oldRaw) {
        try {
          const parsedOld = JSON.parse(oldRaw) as AppData;
          if (parsedOld && parsedOld.cycles && parsedOld.cycles.length > 0) {
            const firstCycle = parsedOld.cycles[0];
            if (firstCycle?.records['apt-4'] && (firstCycle.records['apt-4'].previousCarryover || 0) === 0) {
              firstCycle.records['apt-4'].previousCarryover = 5200;
            }
            if (firstCycle?.records['apt-8'] && (firstCycle.records['apt-8'].previousCarryover || 0) === 0) {
              firstCycle.records['apt-8'].previousCarryover = 5500;
            }
            parsedOld.version = 2;
            saveAppData(parsedOld);
            return parsedOld;
          }
        } catch (e) {
          console.error('Error migrating v1 data:', e);
        }
      }
      const initial = getDefaultAppData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Basic integrity check
    if (!parsed.apartments || !parsed.cycles || !parsed.activeCycleId) {
      const initial = getDefaultAppData();
      saveAppData(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading app data from localStorage:', err);
    return getDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving app data to localStorage:', err);
  }
}

export function exportBackup(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bayanat-al-imara-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
