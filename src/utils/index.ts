import type { AbnormalType } from '@/types';

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

export const formatFullDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysUntil = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getAbnormalLabel = (type: AbnormalType): string => {
  const labelMap: Record<AbnormalType, string> = {
    lost: '牙套丢失',
    pain: '压痛明显',
    bracket: '附件脱落',
    broken: '牙套破损',
    other: '其他问题'
  };
  return labelMap[type] || '未知问题';
};

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '处理中',
    reviewed: '已查看',
    resolved: '已解决'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: '#FF9F43',
    reviewed: '#54A0FF',
    resolved: '#00B894'
  };
  return map[status] || '#A0A0A0';
};
