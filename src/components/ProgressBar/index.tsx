import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { TreatmentProgress } from '@/types';
import { formatDate } from '@/utils';

interface ProgressBarProps {
  progress: TreatmentProgress;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <View className={styles.wrapper}>
      <View className={styles.header}>
        <Text className={styles.title}>矫治进度</Text>
        <Text className={styles.percent}>{progress.percent}%</Text>
      </View>
      <View className={styles.track}>
        <View className={styles.fill} style={{ width: `${progress.percent}%` }}></View>
      </View>
      <View className={styles.footer}>
        <Text className={styles.text}>第 {progress.currentAligner} / {progress.totalAligners} 副</Text>
        <Text className={styles.text}>预计完成 {formatDate(progress.estimatedEndDate)}</Text>
      </View>
    </View>
  );
};

export default ProgressBar;
