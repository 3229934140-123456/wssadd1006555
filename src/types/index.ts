// 病例信息
export interface PatientCase {
  caseId: string;
  patientName: string;
  clinicName: string;
  bindingDate: string;
  totalAligners: number;
  isTeenager: boolean;
  familyContact?: string;
}

// 牙套领取记录
export interface AlignerRecord {
  id: string;
  startAligner: number;
  endAligner: number;
  receiveDate: string;
  notes: string;
  confirmed: boolean;
  nurseName: string;
}

// 每日打卡记录
export interface DailyCheckIn {
  id: string;
  date: string;
  alignerNumber: number;
  wornHours: number;
  isChecked: boolean;
  hasIssue: boolean;
  issues?: AbnormalType[];
  note?: string;
}

// 领取批次状态
export type PickupStatus = 'available' | 'pending' | 'completed' | 'none';

// 待处理异常概览
export interface PendingIssuesSummary {
  pendingReports: number;
  overduePickups: number;
  checkInIssues: number;
}

// 异常上报
export interface AbnormalReport {
  id: string;
  type: AbnormalType;
  description: string;
  reportDate: string;
  status: 'pending' | 'reviewed' | 'resolved';
  contactName?: string;
  contactPhone?: string;
  handlerNote?: string;
  handlerName?: string;
  handledDate?: string;
}

// 异常类型
export type AbnormalType = 
  | 'lost'      // 牙套丢失
  | 'pain'      // 压痛明显
  | 'bracket'   // 附件脱落
  | 'broken'    // 牙套破损
  | 'other';    // 其他问题

// 异常类型信息
export interface AbnormalTypeInfo {
  type: AbnormalType;
  label: string;
  description: string;
}

// 日程提醒
export interface ScheduleReminder {
  id: string;
  type: 'pickup' | 'change' | 'visit' | 'overdue';
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

// 当前佩戴状态
export interface CurrentStatus {
  currentAligner: number;
  totalAligners: number;
  dailyWearHours: number;
  nextPickupDate: string;
  nextPickupAligners: string;
  needPhotoToday: boolean;
  daysInThisAligner: number;
  changeDate: string;
}

// 进度信息
export interface TreatmentProgress {
  currentAligner: number;
  totalAligners: number;
  percent: number;
  estimatedEndDate: string;
}
