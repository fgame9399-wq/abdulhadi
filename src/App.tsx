import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { AppData, Apartment, MonthCycle, BuildingSettings, Payment, ApartmentMonthlyData } from './types';
import { loadAppData, saveAppData } from './utils/storage';
import { calculateApartmentBalance } from './utils/calculations';
import {
  auth,
  testConnection,
  signInWithGooglePopup,
  logout,
  saveBuildingDataToCloud,
  loadBuildingDataFromCloud,
  subscribeToBuildingData,
} from './services/firebase';
import { Header } from './components/Header';
import { BuildingStats } from './components/BuildingStats';
import { ApartmentCard } from './components/ApartmentCard';
import { BatchMeterModal } from './components/BatchMeterModal';
import { PaymentModal } from './components/PaymentModal';
import { StatementModal } from './components/StatementModal';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { NewMonthModal } from './components/NewMonthModal';
import { SettingsModal } from './components/SettingsModal';
import { EditApartmentModal } from './components/EditApartmentModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Search, Zap, Plus, Filter, Users, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  
  // Cloud & Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const isSyncingFromCloudRef = useRef(false);

  // Connection check & Auth listener on boot
  useEffect(() => {
    testConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          setIsSyncing(true);
          const cloudData = await loadBuildingDataFromCloud(user.uid);
          if (cloudData && cloudData.apartments && cloudData.apartments.length > 0) {
            isSyncingFromCloudRef.current = true;
            setAppData(cloudData);
            saveAppData(cloudData);
            setLastSyncedAt(new Date());
          } else {
            // First time login for this user: back up local data to cloud immediately
            await saveBuildingDataToCloud(user.uid, appData);
            setLastSyncedAt(new Date());
          }
        } catch (e) {
          console.error('Error on initial cloud sync:', e);
        } finally {
          setIsSyncing(false);
          setTimeout(() => {
            isSyncingFromCloudRef.current = false;
          }, 500);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time subscription to cloud document changes
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToBuildingData(
      currentUser.uid,
      (liveData) => {
        if (liveData && !isSyncingFromCloudRef.current) {
          isSyncingFromCloudRef.current = true;
          setAppData(liveData);
          saveAppData(liveData);
          setLastSyncedAt(new Date());
          setTimeout(() => {
            isSyncingFromCloudRef.current = false;
          }, 400);
        }
      },
      (err) => {
        console.warn('Real-time sync error/offline:', err);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Persist locally and sync automatically to cloud
  useEffect(() => {
    saveAppData(appData);

    if (currentUser && !isSyncingFromCloudRef.current) {
      const timer = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await saveBuildingDataToCloud(currentUser.uid, appData);
          setLastSyncedAt(new Date());
        } catch (e) {
          console.error('Cloud auto-save error:', e);
        } finally {
          setIsSyncing(false);
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [appData, currentUser]);

  // View state
  const [activeView, setActiveView] = useState<'dashboard' | 'batchMeters'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isBatchMetersOpen, setIsBatchMetersOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [preSelectedAptId, setPreSelectedAptId] = useState<string | undefined>(undefined);
  
  const [selectedAptForModal, setSelectedAptForModal] = useState<Apartment | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  
  const [selectedAptForEdit, setSelectedAptForEdit] = useState<Apartment | null>(null);
  const [isEditAptOpen, setIsEditAptOpen] = useState(false);
  
  const [isNewMonthOpen, setIsNewMonthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'apartments' | 'backup'>('general');

  // Active Cycle
  const currentCycle = useMemo(() => {
    return appData.cycles.find((c) => c.id === appData.activeCycleId) || appData.cycles[0];
  }, [appData.cycles, appData.activeCycleId]);

  // Select Cycle Handler
  const handleSelectCycle = (cycleId: string) => {
    setAppData((prev) => ({
      ...prev,
      activeCycleId: cycleId,
    }));
  };

  // Add Payment Handler
  const handleAddPayment = (apartmentId: string, paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setAppData((prev) => {
      const cycleIndex = prev.cycles.findIndex((c) => c.id === prev.activeCycleId);
      if (cycleIndex === -1) return prev;

      const currentCycleObj = prev.cycles[cycleIndex];
      const existingRec = currentCycleObj.records[apartmentId] || {
        apartmentId,
        rentAmount: prev.apartments.find((a) => a.id === apartmentId)?.defaultRent || 1500,
        meterPrevious: 0,
        meterCurrent: null,
        kwhRate: prev.settings.defaultKwhRate,
        fixedServiceFee: prev.settings.defaultFixedServiceFee,
        previousCarryover: 0,
        payments: [],
      };

      const updatedRecords = {
        ...currentCycleObj.records,
        [apartmentId]: {
          ...existingRec,
          payments: [newPayment, ...(existingRec.payments || [])],
        },
      };

      const updatedCycles = [...prev.cycles];
      updatedCycles[cycleIndex] = {
        ...currentCycleObj,
        records: updatedRecords,
      };

      return {
        ...prev,
        cycles: updatedCycles,
      };
    });
  };

  // Delete Payment Handler
  const handleDeletePayment = (apartmentId: string, paymentId: string) => {
    setAppData((prev) => {
      const cycleIndex = prev.cycles.findIndex((c) => c.id === prev.activeCycleId);
      if (cycleIndex === -1) return prev;

      const currentCycleObj = prev.cycles[cycleIndex];
      const existingRec = currentCycleObj.records[apartmentId];
      if (!existingRec) return prev;

      const updatedPayments = (existingRec.payments || []).filter((p) => p.id !== paymentId);

      const updatedRecords = {
        ...currentCycleObj.records,
        [apartmentId]: {
          ...existingRec,
          payments: updatedPayments,
        },
      };

      const updatedCycles = [...prev.cycles];
      updatedCycles[cycleIndex] = {
        ...currentCycleObj,
        records: updatedRecords,
      };

      return {
        ...prev,
        cycles: updatedCycles,
      };
    });
  };

  // Update Single Meter Reading Handler
  const handleUpdateMeter = (apartmentId: string, currentReading: number | null) => {
    setAppData((prev) => {
      const cycleIndex = prev.cycles.findIndex((c) => c.id === prev.activeCycleId);
      if (cycleIndex === -1) return prev;

      const currentCycleObj = prev.cycles[cycleIndex];
      const existingRec = currentCycleObj.records[apartmentId] || {
        apartmentId,
        rentAmount: prev.apartments.find((a) => a.id === apartmentId)?.defaultRent || 1500,
        meterPrevious: 0,
        meterCurrent: null,
        kwhRate: prev.settings.defaultKwhRate,
        fixedServiceFee: prev.settings.defaultFixedServiceFee,
        previousCarryover: 0,
        payments: [],
      };

      const updatedRecords = {
        ...currentCycleObj.records,
        [apartmentId]: {
          ...existingRec,
          meterCurrent: currentReading,
        },
      };

      const updatedCycles = [...prev.cycles];
      updatedCycles[cycleIndex] = {
        ...currentCycleObj,
        records: updatedRecords,
      };

      return {
        ...prev,
        cycles: updatedCycles,
      };
    });
  };

  // Batch Save Meters Handler
  const handleBatchSaveMeters = (updatedRecords: Record<string, Partial<ApartmentMonthlyData>>) => {
    setAppData((prev) => {
      const cycleIndex = prev.cycles.findIndex((c) => c.id === prev.activeCycleId);
      if (cycleIndex === -1) return prev;

      const currentCycleObj = prev.cycles[cycleIndex];
      const nextRecords = { ...currentCycleObj.records };

      for (const aptId in updatedRecords) {
        const partial = updatedRecords[aptId];
        const existing = nextRecords[aptId] || {
          apartmentId: aptId,
          rentAmount: prev.apartments.find((a) => a.id === aptId)?.defaultRent || 1500,
          meterPrevious: 0,
          meterCurrent: null,
          kwhRate: prev.settings.defaultKwhRate,
          fixedServiceFee: prev.settings.defaultFixedServiceFee,
          previousCarryover: 0,
          payments: [],
        };

        nextRecords[aptId] = {
          ...existing,
          ...partial,
        };
      }

      const updatedCycles = [...prev.cycles];
      updatedCycles[cycleIndex] = {
        ...currentCycleObj,
        records: nextRecords,
      };

      return {
        ...prev,
        cycles: updatedCycles,
      };
    });
  };

  // Update Carryover Balance Handler
  const handleUpdateCarryover = (apartmentId: string, carryover: number) => {
    setAppData((prev) => {
      const cycleIndex = prev.cycles.findIndex((c) => c.id === prev.activeCycleId);
      if (cycleIndex === -1) return prev;

      const currentCycleObj = prev.cycles[cycleIndex];
      const existing = currentCycleObj.records[apartmentId];
      if (!existing) return prev;

      const updatedRecords = {
        ...currentCycleObj.records,
        [apartmentId]: {
          ...existing,
          previousCarryover: carryover,
        },
      };

      const updatedCycles = [...prev.cycles];
      updatedCycles[cycleIndex] = {
        ...currentCycleObj,
        records: updatedRecords,
      };

      return {
        ...prev,
        cycles: updatedCycles,
      };
    });
  };

  // Create New Month Cycle
  const handleCreateCycle = (newCycle: MonthCycle) => {
    setAppData((prev) => ({
      ...prev,
      cycles: [newCycle, ...prev.cycles],
      activeCycleId: newCycle.id,
    }));
  };

  // Settings & Apartments updates
  const handleSaveSettings = (newSettings: BuildingSettings) => {
    setAppData((prev) => ({ ...prev, settings: newSettings }));
  };

  const handleUpdateApartments = (newApts: Apartment[]) => {
    setAppData((prev) => ({ ...prev, apartments: newApts }));
  };

  const handleSaveApartmentDetails = (updatedApt: Apartment, newStartingMeter?: number, newRentAmount?: number) => {
    setAppData((prev) => {
      const nextApts = prev.apartments.map((a) => (a.id === updatedApt.id ? updatedApt : a));

      const cycleIndex = prev.cycles.findIndex((c) => c.id === prev.activeCycleId);
      let nextCycles = prev.cycles;
      if (cycleIndex !== -1) {
        const curCycle = prev.cycles[cycleIndex];
        const existingRec = curCycle.records[updatedApt.id] || {
          apartmentId: updatedApt.id,
          rentAmount: updatedApt.defaultRent,
          meterPrevious: 0,
          meterCurrent: null,
          kwhRate: prev.settings.defaultKwhRate,
          fixedServiceFee: prev.settings.defaultFixedServiceFee,
          previousCarryover: 0,
          payments: [],
        };

        const updatedRec = {
          ...existingRec,
          rentAmount: newRentAmount !== undefined ? newRentAmount : (existingRec.rentAmount || updatedApt.defaultRent),
          meterPrevious: newStartingMeter !== undefined ? newStartingMeter : existingRec.meterPrevious,
        };

        const updatedCycles = [...prev.cycles];
        updatedCycles[cycleIndex] = {
          ...curCycle,
          records: {
            ...curCycle.records,
            [updatedApt.id]: updatedRec,
          },
        };
        nextCycles = updatedCycles;
      }

      return {
        ...prev,
        apartments: nextApts,
        cycles: nextCycles,
      };
    });
  };

  const handleRestoreData = (restored: AppData) => {
    setAppData(restored);
  };

  // Cloud Handlers (Google Sign-In & Synchronization)
  const handleSignInWithGoogle = async () => {
    const user = await signInWithGooglePopup();
    setCurrentUser(user);
    if (user) {
      setIsSyncing(true);
      try {
        const cloudData = await loadBuildingDataFromCloud(user.uid);
        if (cloudData && cloudData.apartments && cloudData.apartments.length > 0) {
          isSyncingFromCloudRef.current = true;
          setAppData(cloudData);
          saveAppData(cloudData);
          setLastSyncedAt(new Date());
        } else {
          await saveBuildingDataToCloud(user.uid, appData);
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.error('Error on sign in cloud sync:', err);
      } finally {
        setIsSyncing(false);
        setTimeout(() => {
          isSyncingFromCloudRef.current = false;
        }, 500);
      }
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
  };

  const handleManualSyncUp = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await saveBuildingDataToCloud(currentUser.uid, appData);
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSyncDown = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const cloudData = await loadBuildingDataFromCloud(currentUser.uid);
      if (cloudData) {
        isSyncingFromCloudRef.current = true;
        setAppData(cloudData);
        saveAppData(cloudData);
        setLastSyncedAt(new Date());
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        isSyncingFromCloudRef.current = false;
      }, 500);
    }
  };

  // Filtered and Searched Apartments
  const filteredApartments = useMemo(() => {
    return appData.apartments.filter((apt) => {
      // Search
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchNumber = apt.number.toLowerCase().includes(query);
        const matchTenant = apt.tenantName.toLowerCase().includes(query);
        const matchPhone = apt.tenantPhone.includes(query);
        const matchMeter = apt.meterNumber.toLowerCase().includes(query);
        if (!matchNumber && !matchTenant && !matchPhone && !matchMeter) {
          return false;
        }
      }

      // Status Filter
      if (filterStatus === 'all') return true;

      const rec = currentCycle?.records[apt.id] || {
        apartmentId: apt.id,
        rentAmount: apt.defaultRent,
        meterPrevious: 0,
        meterCurrent: null,
        kwhRate: appData.settings.defaultKwhRate,
        fixedServiceFee: appData.settings.defaultFixedServiceFee,
        previousCarryover: 0,
        payments: [],
      };
      const calc = calculateApartmentBalance(rec);

      if (filterStatus === 'owes') return calc.status === 'owes';
      if (filterStatus === 'critical_overdue') {
        const monthlyRent = rec.rentAmount > 0 ? rec.rentAmount : (apt.defaultRent > 0 ? apt.defaultRent : 1);
        return (calc.balance / monthlyRent) >= 3;
      }
      if (filterStatus === 'settled') return calc.status === 'settled';
      if (filterStatus === 'credit') return calc.status === 'credit';
      if (filterStatus === 'missing_reading') return !calc.hasMeterReading;

      return true;
    });
  }, [appData.apartments, currentCycle, searchQuery, filterStatus, appData.settings]);

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      
      {/* 3-Zone Top Navigation Bar */}
      <Header
        settings={appData.settings}
        cycles={appData.cycles}
        activeCycleId={appData.activeCycleId}
        onSelectCycle={handleSelectCycle}
        onOpenNewMonth={() => setIsNewMonthOpen(true)}
        onOpenBatchMeters={() => setIsBatchMetersOpen(true)}
        onOpenNewPayment={() => {
          setPreSelectedAptId(undefined);
          setIsPaymentOpen(true);
        }}
        onOpenSettings={(tab) => {
          setSettingsInitialTab(tab || 'general');
          setIsSettingsOpen(true);
        }}
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Dashboard Stats */}
        <BuildingStats
          apartments={appData.apartments}
          cycle={currentCycle}
          settings={appData.settings}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onSendWhatsApp={(targetApt) => {
            setSelectedAptForModal(targetApt);
            setIsWhatsAppOpen(true);
          }}
          onViewStatement={(targetApt) => {
            setSelectedAptForModal(targetApt);
            setIsStatementOpen(true);
          }}
          onExportMonthlyReport={() => setIsMonthlyReportOpen(true)}
        />

        {/* Toolbar: Search & View Switches */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث برقم الشقة (مثلاً: شقة 1) أو اسم المستأجر أو رقم الهاتف أو العداد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsBatchMetersOpen(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-950 bg-amber-200/70 hover:bg-amber-300/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Zap className="w-4 h-4 text-amber-800" />
              <span>إدخال قراءات العدادات دفعة واحدة</span>
            </button>

            <button
              onClick={() => {
                setPreSelectedAptId(undefined);
                setIsPaymentOpen(true);
              }}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>سداد دفعة جديدة</span>
            </button>
          </div>
        </div>

        {/* Apartments Grid */}
        {filteredApartments.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="text-base font-bold text-neutral-800">لا توجد شقق مطابقة لخيارات البحث</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              جرب تغيير عبارة البحث أو اختيار مرشح آخر من شريط الحالة بالأعلى.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors inline-block"
            >
              عرض جميع الشقق الـ {appData.apartments.length}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApartments.map((apt) => {
              const monthlyData = currentCycle.records[apt.id] || {
                apartmentId: apt.id,
                rentAmount: apt.defaultRent,
                meterPrevious: 0,
                meterCurrent: null,
                kwhRate: appData.settings.defaultKwhRate,
                fixedServiceFee: appData.settings.defaultFixedServiceFee,
                previousCarryover: 0,
                payments: [],
              };

              return (
                <ApartmentCard
                  key={apt.id}
                  apartment={apt}
                  monthlyData={monthlyData}
                  settings={appData.settings}
                  onRecordPayment={(targetApt) => {
                    setPreSelectedAptId(targetApt.id);
                    setIsPaymentOpen(true);
                  }}
                  onViewStatement={(targetApt) => {
                    setSelectedAptForModal(targetApt);
                    setIsStatementOpen(true);
                  }}
                  onPrintReceipt={(targetApt) => {
                    setSelectedAptForModal(targetApt);
                    setIsPrintOpen(true);
                  }}
                  onSendWhatsApp={(targetApt) => {
                    setSelectedAptForModal(targetApt);
                    setIsWhatsAppOpen(true);
                  }}
                  onUpdateMeter={(aptId, currReading) => handleUpdateMeter(aptId, currReading)}
                  onEditApartment={(targetApt) => {
                    setSelectedAptForEdit(targetApt);
                    setIsEditAptOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-neutral-200 mt-12 py-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-neutral-400" />
            <span>{appData.settings.buildingName} · نظام إدارة وتحصيل الإيجارات وفواتير الكهرباء</span>
          </div>
          <div>
            <span>جميع الحسابات والبيانات تحفظ محلياً على جهازك مع إمكانية التصدير في أي وقت.</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Batch Meters Entry Modal */}
      {isBatchMetersOpen && (
        <BatchMeterModal
          isOpen={isBatchMetersOpen}
          onClose={() => setIsBatchMetersOpen(false)}
          apartments={appData.apartments}
          cycle={currentCycle}
          settings={appData.settings}
          onSaveBatch={handleBatchSaveMeters}
        />
      )}

      {/* 2. Quick Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          apartments={appData.apartments}
          cycle={currentCycle}
          settings={appData.settings}
          preSelectedApartmentId={preSelectedAptId}
          onAddPayment={handleAddPayment}
        />
      )}

      {/* 3. Apartment Statement & Ledger Modal */}
      {isStatementOpen && selectedAptForModal && (
        <StatementModal
          isOpen={isStatementOpen}
          onClose={() => {
            setIsStatementOpen(false);
            setSelectedAptForModal(null);
          }}
          apartment={selectedAptForModal}
          cycle={currentCycle}
          settings={appData.settings}
          onDeletePayment={handleDeletePayment}
          onUpdateCarryover={handleUpdateCarryover}
          onOpenPaymentModal={(apt) => {
            setIsStatementOpen(false);
            setPreSelectedAptId(apt.id);
            setIsPaymentOpen(true);
          }}
          onOpenPrintModal={(apt) => {
            setIsStatementOpen(false);
            setSelectedAptForModal(apt);
            setIsPrintOpen(true);
          }}
          onOpenWhatsAppModal={(apt) => {
            setIsStatementOpen(false);
            setSelectedAptForModal(apt);
            setIsWhatsAppOpen(true);
          }}
        />
      )}

      {/* 4. Receipt & Invoice Print Modal */}
      {isPrintOpen && selectedAptForModal && (
        <ReceiptPrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setSelectedAptForModal(null);
          }}
          apartment={selectedAptForModal}
          cycle={currentCycle}
          settings={appData.settings}
        />
      )}

      {/* 5. WhatsApp Message Modal */}
      {isWhatsAppOpen && selectedAptForModal && (
        <WhatsAppModal
          isOpen={isWhatsAppOpen}
          onClose={() => {
            setIsWhatsAppOpen(false);
            setSelectedAptForModal(null);
          }}
          apartment={selectedAptForModal}
          cycle={currentCycle}
          settings={appData.settings}
        />
      )}

      {/* 6. New Month Cycle Modal */}
      {isNewMonthOpen && (
        <NewMonthModal
          isOpen={isNewMonthOpen}
          onClose={() => setIsNewMonthOpen(false)}
          cycles={appData.cycles}
          activeCycleId={appData.activeCycleId}
          apartments={appData.apartments}
          settings={appData.settings}
          onCreateCycle={handleCreateCycle}
        />
      )}

      {/* 7. Edit Apartment & Tenant Modal */}
      {isEditAptOpen && selectedAptForEdit && (
        <EditApartmentModal
          isOpen={isEditAptOpen}
          onClose={() => {
            setIsEditAptOpen(false);
            setSelectedAptForEdit(null);
          }}
          apartment={selectedAptForEdit}
          settings={appData.settings}
          cycle={currentCycle}
          onSaveApartment={handleSaveApartmentDetails}
        />
      )}

      {/* 8. Settings & Backup Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={appData.settings}
          apartments={appData.apartments}
          fullAppData={appData}
          initialTab={settingsInitialTab}
          onSaveSettings={handleSaveSettings}
          onUpdateApartments={handleUpdateApartments}
          onRestoreData={handleRestoreData}
        />
      )}

      {/* 9. Monthly Report & PDF Export Modal */}
      {isMonthlyReportOpen && (
        <MonthlyReportModal
          isOpen={isMonthlyReportOpen}
          onClose={() => setIsMonthlyReportOpen(false)}
          apartments={appData.apartments}
          cycle={currentCycle}
          settings={appData.settings}
        />
      )}

      {/* 10. Cloud Sync & Auth Modal */}
      {isCloudModalOpen && (
        <CloudSyncModal
          isOpen={isCloudModalOpen}
          onClose={() => setIsCloudModalOpen(false)}
          currentUser={currentUser}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
          onSignIn={handleSignInWithGoogle}
          onSignOut={handleSignOut}
          onManualSyncUp={handleManualSyncUp}
          onManualSyncDown={handleManualSyncDown}
          appData={appData}
        />
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />

    </div>
  );
}
