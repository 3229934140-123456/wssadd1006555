import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { CurrentStatus, PatientCase } from '@/types';
import { formatDate, getDaysUntil } from '@/utils';

interface StatusCardProps {
  patientCase: PatientCase;
  status: CurrentStatus;
}

const StatusCard: React.FC<StatusCardProps> = ({ patientCase, status }) => {
  const daysUntilChange = getDaysUntil(status.changeDate);

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.patientName}>{patientCase.patientName}</Text>
        <Text className={styles.caseTag}>{patientCase.clinicName}</Text>
      </View>

      <View className={styles.currentAligner}>
        <Text className={styles.label}>当前佩戴</Text>
        <View>
          <Text className={styles.number}>第{status.currentAligner}副</Text>
        </View>
        <Text className={styles.label}>已佩戴 {status.daysInThisAligner} 天</Text>
      </View>

      <View className={styles.infoGrid}>
        <View className={styles.infoItem}>
          <Text className={styles.value}>{status.dailyWearHours}小时</Text>
          <Text className={styles.text}>每日佩戴</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.value}>
            {daysUntilChange > 0 ? `${daysUntilChange}天后` : daysUntilChange === 0 ? '今天' : `${Math.abs(daysUntilChange)}天前`}
          </Text>
          <Text className={styles.text}>更换下一副</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.value}>{formatDate(status.nextPickupDate)}</Text>
          <Text className={styles.text}>下次领取</Text>
        </View>
      </View>
    </View>
  );
};

export default StatusCard;
