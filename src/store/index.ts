import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import type {
  PatientCase,
  AlignerRecord,
  DailyCheckIn,
  AbnormalReport,
  ScheduleReminder,
  CurrentStatus,
  TreatmentProgress,
  AbnormalType
} from '@/types';

interface AppState {
  isBound: boolean;
  patientCase: PatientCase | null;
  currentStatus: CurrentStatus | null;
  progress: TreatmentProgress | null;
  records: AlignerRecord[];
  checkIns: DailyCheckIn[];
  reports: AbnormalReport[];
  reminders: ScheduleReminder[];

  bindCase: (bindCode: string) => Promise<boolean>;
  unbind: () => void;

  addCheckIn: (checkIn: Omit<DailyCheckIn, 'id' | 'date'> & { issues?: AbnormalType[] }) => void;
  hasCheckedToday: () => boolean;
  getTodayCheckIn: () => DailyCheckIn | undefined;

  addReport: (report: Omit<AbnormalReport, 'id' | 'reportDate' | 'status'>) => void;
  updateReportStatus: (id: string, status: 'pending' | 'reviewed' | 'resolved') => void;

  confirmRecord: (recordId: string) => void;
  refreshCurrentStatus: () => void;

  generateReminders: () => void;
}

const storage = {
  getItem: (name: string) => {
    try {
      return Taro.getStorageSync(name);
    } catch (e) {
      console.error('[Storage] getItem error:', e);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value);
    } catch (e) {
      console.error('[Storage] setItem error:', e);
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name);
    } catch (e) {
      console.error('[Storage] removeItem error:', e);
    }
  }
};

const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isBound: false,
      patientCase: null,
      currentStatus: null,
      progress: null,
      records: [],
      checkIns: [],
      reports: [],
      reminders: [],

      bindCase: async (bindCode: string) => {
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!bindCode || bindCode.length < 6) {
          return false;
        }

        const mockCase: PatientCase = {
          caseId: bindCode,
          patientName: '小明同学',
          clinicName: '微笑口腔诊所',
          bindingDate: getTodayStr(),
          totalAligners: 48,
          isTeenager: true,
          familyContact: '妈妈 138****8888'
        };

        const mockRecords: AlignerRecord[] = [
          {
            id: 'REC001',
            startAligner: 1,
            endAligner: 6,
            receiveDate: '2024-03-15',
            notes: '初次佩戴可能会有轻微酸胀感，通常2-3天会缓解。注意保持口腔卫生，饭后及时刷牙。',
            confirmed: true,
            nurseName: '李护士'
          },
          {
            id: 'REC002',
            startAligner: 7,
            endAligner: 12,
            receiveDate: '2024-05-15',
            notes: '每天佩戴不少于22小时，进食时请摘下牙套并清洁。每2周更换下一副。如有不适请及时联系诊所。',
            confirmed: true,
            nurseName: '张护士'
          },
          {
            id: 'REC003',
            startAligner: 13,
            endAligner: 18,
            receiveDate: '2024-06-25',
            notes: '请按顺序佩戴，不要跳副。如牙套丢失，请及时联系诊所重新制作。每天要认真清洁牙套和牙齿哦~',
            confirmed: false,
            nurseName: '王护士'
          }
        ];

        const mockStatus: CurrentStatus = {
          currentAligner: 12,
          totalAligners: 48,
          dailyWearHours: 22,
          nextPickupDate: '2024-06-25',
          nextPickupAligners: '第13-18副',
          needPhotoToday: true,
          daysInThisAligner: 14,
          changeDate: '2024-06-25'
        };

        const mockProgress: TreatmentProgress = {
          currentAligner: 12,
          totalAligners: 48,
          percent: 25,
          estimatedEndDate: '2025-06-15'
        };

        const mockCheckIns: DailyCheckIn[] = [
          { id: 'C001', date: '2024-06-19', alignerNumber: 12, wornHours: 22, isChecked: true, hasIssue: false },
          { id: 'C002', date: '2024-06-18', alignerNumber: 12, wornHours: 21, isChecked: true, hasIssue: false },
          { id: 'C003', date: '2024-06-17', alignerNumber: 12, wornHours: 22, isChecked: true, hasIssue: true },
          { id: 'C004', date: '2024-06-16', alignerNumber: 11, wornHours: 23, isChecked: true, hasIssue: false },
          { id: 'C005', date: '2024-06-15', alignerNumber: 11, wornHours: 22, isChecked: true, hasIssue: false },
          { id: 'C006', date: '2024-06-14', alignerNumber: 11, wornHours: 22, isChecked: true, hasIssue: false },
          { id: 'C007', date: '2024-06-13', alignerNumber: 11, wornHours: 20, isChecked: true, hasIssue: false }
        ];

        const mockReports: AbnormalReport[] = [
          {
            id: 'R001',
            type: 'pain',
            description: '左侧后牙区佩戴第二天仍然有明显痛感，吃东西的时候更明显',
            reportDate: '2024-06-17',
            status: 'resolved',
            contactName: '王妈妈',
            contactPhone: '138****8888'
          }
        ];

        set({
          isBound: true,
          patientCase: mockCase,
          currentStatus: mockStatus,
          progress: mockProgress,
          records: mockRecords,
          checkIns: mockCheckIns,
          reports: mockReports
        });

        get().generateReminders();
        console.log('[Store] 绑定病例成功:', mockCase);
        return true;
      },

      unbind: () => {
        set({
          isBound: false,
          patientCase: null,
          currentStatus: null,
          progress: null,
          records: [],
          checkIns: [],
          reports: [],
          reminders: []
        });
      },

      addCheckIn: (checkIn) => {
        const today = getTodayStr();
        const existing = get().checkIns.find(c => c.date === today);
        if (existing) return;

        const newCheckIn: DailyCheckIn = {
          id: `C${Date.now()}`,
          date: today,
          alignerNumber: checkIn.alignerNumber,
          wornHours: checkIn.wornHours,
          isChecked: true,
          hasIssue: (checkIn.issues && checkIn.issues.length > 0) || false
        };

        set(state => ({
          checkIns: [newCheckIn, ...state.checkIns]
        }));
        console.log('[Store] 新增打卡记录:', newCheckIn);
      },

      hasCheckedToday: () => {
        const today = getTodayStr();
        return get().checkIns.some(c => c.date === today);
      },

      getTodayCheckIn: () => {
        const today = getTodayStr();
        return get().checkIns.find(c => c.date === today);
      },

      addReport: (report) => {
        const newReport: AbnormalReport = {
          id: `R${Date.now()}`,
          ...report,
          reportDate: getTodayStr(),
          status: 'pending'
        };

        set(state => ({
          reports: [newReport, ...state.reports]
        }));
        console.log('[Store] 新增异常上报:', newReport);
      },

      updateReportStatus: (id, status) => {
        set(state => ({
          reports: state.reports.map(r => r.id === id ? { ...r, status } : r)
        }));
        console.log('[Store] 更新上报状态:', id, status);
      },

      confirmRecord: (recordId) => {
        set(state => {
          const updatedRecords = state.records.map(r =>
            r.id === recordId ? { ...r, confirmed: true } : r
          );

          const confirmedRecord = updatedRecords.find(r => r.id === recordId);
          if (!confirmedRecord || !state.currentStatus) {
            return { records: updatedRecords };
          }

          const newCurrentAligner = confirmedRecord.startAligner;
          const totalAligners = state.patientCase?.totalAligners || state.currentStatus.totalAligners;
          const newProgressPercent = Math.round((newCurrentAligner / totalAligners) * 100);

          const unconfirmedRecords = updatedRecords.filter(r => !r.confirmed);
          const nextRecord = unconfirmedRecords.sort((a, b) => a.startAligner - b.startAligner)[0];

          const newStatus: CurrentStatus = {
            ...state.currentStatus,
            currentAligner: newCurrentAligner,
            daysInThisAligner: 0,
            changeDate: addDays(getTodayStr(), 14),
            nextPickupDate: nextRecord ? nextRecord.receiveDate : state.currentStatus.nextPickupDate,
            nextPickupAligners: nextRecord ? `第${nextRecord.startAligner}-${nextRecord.endAligner}副` : '已完成全部'
          };

          const newProgress: TreatmentProgress = {
            currentAligner: newCurrentAligner,
            totalAligners: totalAligners,
            percent: newProgressPercent,
            estimatedEndDate: state.progress?.estimatedEndDate || '2025-06-15'
          };

          console.log('[Store] 领取确认成功，更新当前状态:', newStatus);
          return {
            records: updatedRecords,
            currentStatus: newStatus,
            progress: newProgress
          };
        });
        get().generateReminders();
      },

      refreshCurrentStatus: () => {
        get().generateReminders();
      },

      generateReminders: () => {
        const { currentStatus, records, patientCase, progress } = get();
        if (!currentStatus || !patientCase) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = getTodayStr();

        const newReminders: ScheduleReminder[] = [];

        const changeDate = new Date(currentStatus.changeDate);
        changeDate.setHours(0, 0, 0, 0);
        const daysUntilChange = Math.ceil((changeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilChange === 1) {
          newReminders.push({
            id: `REM_CHANGE_${todayStr}`,
            type: 'change',
            title: '明天该换新牙套啦',
            content: `您已佩戴第${currentStatus.currentAligner}副14天，明天记得更换为第${currentStatus.currentAligner + 1}副哦~`,
            date: todayStr,
            isRead: false,
            priority: 'high'
          });
        } else if (daysUntilChange < 0) {
          newReminders.push({
            id: `REM_CHANGE_OVERDUE_${todayStr}`,
            type: 'change',
            title: '⚠️ 换副提醒已逾期',
            content: `您应该在${currentStatus.changeDate}更换为第${currentStatus.currentAligner + 1}副，现在已经晚了${Math.abs(daysUntilChange)}天啦，记得及时更换！`,
            date: todayStr,
            isRead: false,
            priority: 'high'
          });
        }

        if (currentStatus.needPhotoToday) {
          newReminders.push({
            id: `REM_PHOTO_${todayStr}`,
            type: 'visit',
            title: '复诊拍照提醒',
            content: '今天需要拍摄口腔照片上传，请在光线充足的地方拍摄清晰的照片，方便医生了解矫治进度~',
            date: todayStr,
            isRead: false,
            priority: 'high'
          });
        }

        const unconfirmedRecords = records.filter(r => !r.confirmed);
        unconfirmedRecords.forEach(record => {
          const pickupDate = new Date(record.receiveDate);
          pickupDate.setHours(0, 0, 0, 0);
          const daysUntilPickup = Math.ceil((pickupDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilPickup === 7) {
            newReminders.push({
              id: `REM_PICKUP_${record.id}`,
              type: 'pickup',
              title: '下周可以领取新牙套',
              content: `${record.receiveDate} 可到诊所领取第${record.startAligner}-${record.endAligner}副，建议提前预约哦~`,
              date: todayStr,
              isRead: false,
              priority: 'medium'
            });
          }

          if (daysUntilPickup === 3 && patientCase.isTeenager) {
            newReminders.push({
              id: `REM_FAMILY_PICKUP_${record.id}`,
              type: 'pickup',
              title: '👨‍👩‍👧 家长提醒：复诊前3天',
              content: `孩子将在3天后（${record.receiveDate}）到诊所领取第${record.startAligner}-${record.endAligner}副，记得提前安排时间陪同就诊~`,
              date: todayStr,
              isRead: false,
              priority: 'high'
            });
          }

          if (daysUntilPickup < 0) {
            newReminders.push({
              id: `REM_OVERDUE_${record.id}`,
              type: 'overdue',
              title: '⚠️ 牙套领取已逾期',
              content: `第${record.startAligner}-${record.endAligner}副的领取时间是${record.receiveDate}，现已逾期${Math.abs(daysUntilPickup)}天，请尽快到诊所领取或联系诊所重新安排！`,
              date: todayStr,
              isRead: false,
              priority: 'high'
            });
          }
        });

        if (patientCase.isTeenager && daysUntilChange === 1) {
          newReminders.push({
            id: `REM_FAMILY_CHANGE_${todayStr}`,
            type: 'change',
            title: '👨‍👩‍👧 家长提醒：换副前1天',
            content: `孩子明天（${currentStatus.changeDate}）需要更换第${currentStatus.currentAligner + 1}副牙套，请提醒孩子按顺序更换，不要跳副哦~`,
            date: todayStr,
            isRead: false,
            priority: 'high'
          });
        }

        const existingIds = get().reminders.map(r => r.id);
        const uniqueNewReminders = newReminders.filter(r => !existingIds.includes(r.id));

        if (uniqueNewReminders.length > 0) {
          set(state => ({
            reminders: [...uniqueNewReminders, ...state.reminders]
          }));
          console.log('[Store] 生成新提醒:', uniqueNewReminders);
        }
      }
    }),
    {
      name: 'aligner-app-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        isBound: state.isBound,
        patientCase: state.patientCase,
        currentStatus: state.currentStatus,
        progress: state.progress,
        records: state.records,
        checkIns: state.checkIns,
        reports: state.reports,
        reminders: state.reminders
      })
    }
  )
);

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
