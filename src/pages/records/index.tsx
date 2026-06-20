import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import RecordCard from '@/components/RecordCard';
import styles from './index.module.scss';
import { mockRecords, mockCheckIns, mockCurrentStatus } from '@/data/mock';
import { formatDate, getDaysUntil } from '@/utils';
import type { AlignerRecord } from '@/types';

type FilterType = 'all' | 'confirmed' | 'pending';

const RecordsPage: React.FC = () => {
  const [records, setRecords] = useState<AlignerRecord[]>(mockRecords);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const daysUntilPickup = getDaysUntil(mockCurrentStatus.nextPickupDate);

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return records;
    if (activeFilter === 'confirmed') return records.filter(r => r.confirmed);
    return records.filter(r => !r.confirmed);
  }, [records, activeFilter]);

  const confirmedCount = useMemo(() => records.filter(r => r.confirmed).length, [records]);
  const pendingCount = useMemo(() => records.filter(r => !r.confirmed).length, [records]);
  const totalAlignersReceived = useMemo(() => {
    return records
      .filter(r => r.confirmed)
      .reduce((sum, r) => sum + (r.endAligner - r.startAligner + 1), 0);
  }, [records]);

  const handleConfirmRecord = useCallback((id: string) => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, confirmed: true } : r))
    );
    Taro.showToast({
      title: '确认成功！',
      icon: 'success'
    });
    console.log('[RecordsPage] 领取确认成功:', id);
  }, []);

  const handleFilter = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const handleAppointment = useCallback(() => {
    Taro.showModal({
      title: '预约领取',
      content: '是否需要帮您预约到诊所领取牙套的时间？',
      confirmText: '去预约',
      confirmColor: '#FF9F43',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '预约功能演示',
            icon: 'none'
          });
        }
      }
    });
  }, []);

  const getDayName = (dateStr: string) => {
    const dayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return dayMap[date.getDay()];
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>我的矫治牙套</Text>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{totalAlignersReceived}</Text>
            <Text className={styles.statLabel}>已领取（副）</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{confirmedCount}</Text>
            <Text className={styles.statLabel}>领取批次</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{mockCurrentStatus.currentAligner}</Text>
            <Text className={styles.statLabel}>当前佩戴</Text>
          </View>
        </View>
      </View>

      {daysUntilPickup > 0 && daysUntilPickup <= 30 && (
        <View className={styles.nextPickupCard}>
          <View className={styles.nextPickupHeader}>
            <Text className={styles.nextPickupTitle}>⏰ 下次领取提醒</Text>
            <Text className={styles.nextPickupDate}>{daysUntilPickup}天后</Text>
          </View>
          <Text className={styles.nextPickupContent}>
            {formatDate(mockCurrentStatus.nextPickupDate)} 可领取 {mockCurrentStatus.nextPickupAligners}，
            建议提前预约诊所，避免白跑一趟哦~
          </Text>
          <Button className={styles.nextPickupBtn} onClick={handleAppointment}>
            预约领取时间
          </Button>
        </View>
      )}

      <View className={styles.dailySection}>
        <View className={styles.sectionTitle}>
          <Text>近7天打卡</Text>
          <Text style={{ fontSize: '24rpx', color: '#86909C', fontWeight: 'normal' }}>
            {mockCheckIns.filter(c => c.isChecked).length}/7 天
          </Text>
        </View>
        <View className={styles.weekStats}>
          {mockCheckIns.slice(0, 7).map((checkIn) => (
            <View key={checkIn.id} className={styles.dayItem}>
              <Text className={styles.dayName}>{getDayName(checkIn.date)}</Text>
              <View
                className={`${styles.dayStatus} ${
                  checkIn.isChecked
                    ? checkIn.hasIssue
                      ? styles.hasIssue
                      : styles.checked
                    : ''
                }`}
              ></View>
              <Text className={styles.dayAligner}>#{checkIn.alignerNumber}</Text>
            </View>
          ))}
        </View>
        <View className={styles.tipCard}>
          <Text className={styles.tipText}>
            💚 绿色=正常打卡 &nbsp; 🧡 橙色=当天有上报问题
          </Text>
        </View>
      </View>

      <View className={styles.filterTabs}>
        <Button
          className={`${styles.tabItem} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => handleFilter('all')}
        >
          全部 ({records.length})
        </Button>
        <Button
          className={`${styles.tabItem} ${activeFilter === 'confirmed' ? styles.active : ''}`}
          onClick={() => handleFilter('confirmed')}
        >
          已领取 ({confirmedCount})
        </Button>
        <Button
          className={`${styles.tabItem} ${activeFilter === 'pending' ? styles.active : ''}`}
          onClick={() => handleFilter('pending')}
        >
          待领取 ({pendingCount})
        </Button>
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>暂无相关记录</Text>
        </View>
      ) : (
        filteredRecords.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onConfirm={handleConfirmRecord}
          />
        ))
      )}
    </ScrollView>
  );
};

export default RecordsPage;
