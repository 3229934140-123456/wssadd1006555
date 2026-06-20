import type {
  PatientCase,
  AlignerRecord,
  DailyCheckIn,
  AbnormalReport,
  AbnormalTypeInfo,
  ScheduleReminder,
  CurrentStatus,
  TreatmentProgress
} from '@/types';

export const mockPatientCase: PatientCase = {
  caseId: 'CASE202406001',
  patientName: '小明同学',
  clinicName: '微笑口腔诊所',
  bindingDate: '2024-03-15',
  totalAligners: 48,
  isTeenager: true,
  familyContact: '妈妈 138****8888'
};

export const mockCurrentStatus: CurrentStatus = {
  currentAligner: 12,
  totalAligners: 48,
  dailyWearHours: 22,
  nextPickupDate: '2024-07-15',
  nextPickupAligners: '第13-18副',
  needPhotoToday: true,
  daysInThisAligner: 5,
  changeDate: '2024-06-25'
};

export const mockProgress: TreatmentProgress = {
  currentAligner: 12,
  totalAligners: 48,
  percent: 25,
  estimatedEndDate: '2025-06-15'
};

export const mockRecords: AlignerRecord[] = [
  {
    id: 'REC001',
    startAligner: 7,
    endAligner: 12,
    receiveDate: '2024-05-15',
    notes: '每天佩戴不少于22小时，进食时请摘下牙套并清洁。每2周更换下一副。如有不适请及时联系诊所。',
    confirmed: true,
    nurseName: '张护士'
  },
  {
    id: 'REC002',
    startAligner: 1,
    endAligner: 6,
    receiveDate: '2024-03-15',
    notes: '初次佩戴可能会有轻微酸胀感，通常2-3天会缓解。注意保持口腔卫生，饭后及时刷牙。',
    confirmed: true,
    nurseName: '李护士'
  },
  {
    id: 'REC003',
    startAligner: 13,
    endAligner: 18,
    receiveDate: '2024-07-15',
    notes: '请按顺序佩戴，不要跳副。如牙套丢失，请及时联系诊所重新制作，费用可能需要自理。',
    confirmed: false,
    nurseName: '王护士'
  }
];

export const mockCheckIns: DailyCheckIn[] = [
  { id: 'C001', date: '2024-06-14', alignerNumber: 12, wornHours: 22, isChecked: true, hasIssue: false },
  { id: 'C002', date: '2024-06-13', alignerNumber: 12, wornHours: 21, isChecked: true, hasIssue: false },
  { id: 'C003', date: '2024-06-12', alignerNumber: 12, wornHours: 22, isChecked: true, hasIssue: true },
  { id: 'C004', date: '2024-06-11', alignerNumber: 11, wornHours: 23, isChecked: true, hasIssue: false },
  { id: 'C005', date: '2024-06-10', alignerNumber: 11, wornHours: 22, isChecked: true, hasIssue: false },
  { id: 'C006', date: '2024-06-09', alignerNumber: 11, wornHours: 22, isChecked: true, hasIssue: false },
  { id: 'C007', date: '2024-06-08', alignerNumber: 11, wornHours: 20, isChecked: true, hasIssue: false }
];

export const abnormalTypeList: AbnormalTypeInfo[] = [
  { type: 'lost', label: '牙套丢失', description: '不小心弄丢了牙套' },
  { type: 'pain', label: '压痛明显', description: '佩戴时有明显的疼痛或不适' },
  { type: 'bracket', label: '附件脱落', description: '牙齿上的小附件掉了' },
  { type: 'broken', label: '牙套破损', description: '牙套出现裂纹或断裂' },
  { type: 'other', label: '其他问题', description: '其他情况需要联系诊所' }
];

export const mockReports: AbnormalReport[] = [
  {
    id: 'R001',
    type: 'pain',
    description: '左侧后牙区佩戴第二天仍然有明显痛感，吃东西的时候更明显',
    reportDate: '2024-06-12',
    status: 'resolved',
    contactName: '王妈妈',
    contactPhone: '138****8888'
  }
];

export const mockReminders: ScheduleReminder[] = [
  {
    id: 'REM001',
    type: 'change',
    title: '明天该换新牙套啦',
    content: '您已佩戴第12副14天，明天（6月25日）记得更换为第13副哦',
    date: '2024-06-24',
    isRead: false,
    priority: 'high'
  },
  {
    id: 'REM002',
    type: 'pickup',
    title: '下周可以领取新牙套',
    content: '7月15日可到诊所领取第13-18副，建议提前预约',
    date: '2024-07-08',
    isRead: false,
    priority: 'medium'
  },
  {
    id: 'REM003',
    type: 'visit',
    title: '复诊拍照提醒',
    content: '今天需要拍摄口腔照片上传，请在良好光线下拍摄清晰的照片',
    date: '2024-06-20',
    isRead: false,
    priority: 'high'
  }
];
