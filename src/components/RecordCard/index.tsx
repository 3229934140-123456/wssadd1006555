import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { AlignerRecord } from '@/types';
import { formatDate } from '@/utils';

interface RecordCardProps {
  record: AlignerRecord;
  onConfirm?: (id: string) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onConfirm }) => {
  const handleConfirm = () => {
    Taro.showModal({
      title: '确认领取',
      content: `请确认已领取第${record.startAligner}副到第${record.endAligner}副牙套`,
      confirmText: '已领取',
      confirmColor: '#4CAF90',
      success: (res) => {
        if (res.confirm && onConfirm) {
          onConfirm(record.id);
        }
      }
    });
  };

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.alignerRange}>第{record.startAligner}-{record.endAligner}副</Text>
        <Text className={`${styles.statusTag} ${record.confirmed ? styles.confirmed : styles.pending}`}>
          {record.confirmed ? '已确认' : '待领取'}
        </Text>
      </View>

      <View className={styles.meta}>
        <View className={styles.metaItem}>
          <Text>领取日期：{formatDate(record.receiveDate)}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text>护士：{record.nurseName}</Text>
        </View>
      </View>

      <View className={styles.notes}>
        <Text className={styles.notesTitle}>注意事项</Text>
        <Text className={styles.notesContent}>{record.notes}</Text>
      </View>

      {!record.confirmed && (
        <Button className={styles.confirmBtn} onClick={handleConfirm}>
          确认已领取
        </Button>
      )}
    </View>
  );
};

export default RecordCard;
