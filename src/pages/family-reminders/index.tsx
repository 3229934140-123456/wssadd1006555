import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate, getDaysUntil } from '@/utils';
import type { ScheduleReminder } from '@/types';

const FamilyRemindersPage: React.FC = () => {
  const {
    patientCase,
    currentStatus,
    records,
    reminders,
    reports,
    markReminderRead,
    getFamilyReminders
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'change' | 'pickup' | 'overdue'>('all');

  const familyReminders = useMemo(() => getFamilyReminders(), [getFamilyReminders]);

  const changeReminders = useMemo(() =>
    familyReminders.filter(r => r.type === 'change' && r.title.includes('家长提醒')),
    [familyReminders]
  );

  const pickupReminders = useMemo(() =>
    familyReminders.filter(r => r.type === 'pickup' && r.title.includes('家长提醒')),
    [familyReminders]
  );

  const overdueReminders = useMemo(() =>
    familyReminders.filter(r => r.type === 'overdue'),
    [familyReminders]
  );

  const pendingReports = useMemo(() =>
    reports.filter(r => r.status === 'pending').length,
    [reports]
  );

  const displayedReminders = useMemo(() => {
    switch (activeTab) {
      case 'change': return changeReminders;
      case 'pickup': return pickupReminders;
      case 'overdue': return overdueReminders;
      default: return familyReminders;
    }
  }, [activeTab, changeReminders, pickupReminders, overdueReminders, familyReminders]);

  const handleMarkRead = useCallback((id: string) => {
    markReminderRead(id);
  }, [markReminderRead]);

  const handleGoHome = useCallback(() => {
    Taro.switchTab({ url: '/pages/home/index' });
  }, []);

  const handleGoRecords = useCallback(() => {
    Taro.switchTab({ url: '/pages/records/index' });
  }, []);

  const handleGoReport = useCallback(() => {
    Taro.switchTab({ url: '/pages/report/index' });
  }, []);

  const getTabLabel = (key: string): string => {
    const map: Record<string, string> = {
      all: '全部',
      change: '换副提醒',
      pickup: '复诊提醒',
      overdue: '逾期提醒'
    };
    return map[key] || key;
  };

  const getTabCount = (key: string): number => {
    const map: Record<string, number> = {
      all: familyReminders.length,
      change: changeReminders.length,
      pickup: pickupReminders.length,
      overdue: overdueReminders.length
    };
    return map[key] || 0;
  };

  const getReminderIcon = (type: string): string => {
    const map: Record<string, string> = {
      change: '🔄',
      pickup: '🏥',
      overdue: '⚠️',
      visit: '📷'
    };
    return map[type] || '🔔';
  };

  const getReminderTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      change: '换副提醒',
      pickup: '领取提醒',
      overdue: '逾期提醒',
      visit: '拍照提醒'
    };
    return map[type] || '提醒';
  };

  if (!patientCase || !currentStatus) {
    return (
      <View className={styles.container}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ fontSize: '32rpx', color: '#A0A0A0' }}>正在加载...</Text>
        </View>
      </View>
    );
  }

  const unconfirmedRecords = records.filter(r => !r.confirmed);
  const daysUntilChange = getDaysUntil(currentStatus.changeDate);

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <View className={styles.headerInfo}>
          <Text className={styles.title}>👨‍👩‍👧 家长中心</Text>
          <Text className={styles.subtitle}>
            {patientCase.familyContact} · 关注 {patientCase.patientName} 的矫治进度
          </Text>
        </View>
      </View>

      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>孩子当前情况</Text>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>第{currentStatus.currentAligner}副</Text>
            <Text className={styles.summaryLabel}>当前佩戴</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>
              {daysUntilChange > 0 ? `${daysUntilChange}天后` : daysUntilChange === 0 ? '今天' : `逾期${Math.abs(daysUntilChange)}天`}
            </Text>
            <Text className={styles.summaryLabel}>下次换副</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{unconfirmedRecords.length}</Text>
            <Text className={styles.summaryLabel}>待领取批次</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue} style={{ color: pendingReports > 0 ? '#FF4D4F' : '#00B894' }}>
              {pendingReports}
            </Text>
            <Text className={styles.summaryLabel}>待处理问题</Text>
          </View>
        </View>
      </View>

      <View className={styles.todoCard}>
        <Text className={styles.todoTitle}>📋 今日关注事项</Text>
        <View className={styles.todoList}>
          {daysUntilChange <= 1 && daysUntilChange >= 0 && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#6366F1' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>
                  {daysUntilChange === 0 ? '今天' : '明天'} 提醒孩子更换第{currentStatus.currentAligner + 1}副牙套
                </Text>
                <Text className={styles.todoDate}>📅 {formatDate(currentStatus.changeDate)}</Text>
              </View>
              <Button className={styles.todoAction} onClick={handleGoHome}>查看详情</Button>
            </View>
          )}

          {currentStatus.needPhotoToday && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#54A0FF' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>今天需要拍口腔照片上传</Text>
                <Text className={styles.todoDate}>帮助医生了解矫治进度</Text>
              </View>
              <Button className={styles.todoAction} onClick={handleGoHome}>去拍照</Button>
            </View>
          )}

          {unconfirmedRecords.length > 0 && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#FF9F43' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>
                  有{unconfirmedRecords.length}批牙套待领取
                </Text>
                <Text className={styles.todoDate}>请及时安排时间到诊所</Text>
              </View>
              <Button className={styles.todoAction} onClick={handleGoRecords}>查看记录</Button>
            </View>
          )}

          {pendingReports > 0 && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#FF4D4F' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>
                  有{pendingReports}个异常问题等待诊所处理
                </Text>
                <Text className={styles.todoDate}>可联系诊所跟进进度</Text>
              </View>
              <Button className={styles.todoAction} onClick={handleGoReport}>查看上报</Button>
            </View>
          )}

          {daysUntilChange > 1 && !currentStatus.needPhotoToday && unconfirmedRecords.length === 0 && pendingReports === 0 && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#00B894' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>一切正常~</Text>
                <Text className={styles.todoDate}>孩子的矫治进度顺利，继续保持！</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>🔔 提醒记录</Text>
      </View>

      <View className={styles.tabBar}>
        {(['all', 'change', 'pickup', 'overdue'] as const).map((key) => (
          <Button
            key={key}
            className={`${styles.tabItem} ${activeTab === key ? styles.active : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {getTabLabel(key)} ({getTabCount(key)})
          </Button>
        ))}
      </View>

      {displayedReminders.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✨</Text>
          <Text className={styles.emptyTitle}>暂无相关提醒</Text>
          <Text className={styles.emptyText}>一切顺利，继续保持哦~</Text>
        </View>
      ) : (
        <View className={styles.reminderList}>
          {displayedReminders.map((reminder: ScheduleReminder) => (
            <View
              key={reminder.id}
              className={`${styles.reminderCard} ${reminder.isRead ? styles.read : ''}`}
              onClick={() => handleMarkRead(reminder.id)}
            >
              <View className={styles.reminderIcon}>
                {getReminderIcon(reminder.type)}
              </View>
              <View className={styles.reminderContent}>
                <View className={styles.reminderHeader}>
                  <Text className={styles.reminderType}>
                    {getReminderTypeLabel(reminder.type)}
                  </Text>
                  <Text className={styles.reminderDate}>
                    {formatDate(reminder.date)}
                  </Text>
                </View>
                <Text className={styles.reminderTitle}>{reminder.title}</Text>
                <Text className={styles.reminderDesc}>{reminder.content}</Text>
              </View>
              {!reminder.isRead && <View className={styles.unreadDot}></View>}
            </View>
          ))}
        </View>
      )}

      <View className={styles.tipCard}>
        <Text className={styles.tipIcon}>💡</Text>
        <View className={styles.tipContent}>
          <Text className={styles.tipTitle}>小提示</Text>
          <Text className={styles.tipText}>
            孩子的矫治需要家长的配合和鼓励，每天提醒孩子佩戴够{currentStatus.dailyWearHours}小时，
            按时间换副，遇到问题及时联系诊所，这样矫治效果会更好哦~
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default FamilyRemindersPage;
