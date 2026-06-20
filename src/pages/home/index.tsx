import React, { useState, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import StatusCard from '@/components/StatusCard';
import ProgressBar from '@/components/ProgressBar';
import styles from './index.module.scss';
import {
  mockPatientCase,
  mockCurrentStatus,
  mockProgress,
  mockReminders
} from '@/data/mock';
import { formatDate } from '@/utils';
import type { ScheduleReminder } from '@/types';

const HomePage: React.FC = () => {
  const [todayChecked, setTodayChecked] = useState(false);
  const [reminders, setReminders] = useState<ScheduleReminder[]>(mockReminders);

  const handleCheckIn = useCallback(() => {
    if (todayChecked) return;
    Taro.showToast({
      title: '打卡成功！继续加油~',
      icon: 'success',
      duration: 2000
    });
    setTodayChecked(true);
    console.log('[HomePage] 今日打卡完成');
  }, [todayChecked]);

  const handleReportIssue = useCallback(() => {
    Taro.switchTab({
      url: '/pages/report/index'
    });
  }, []);

  const handleViewRecords = useCallback(() => {
    Taro.switchTab({
      url: '/pages/records/index'
    });
  }, []);

  const handlePhotoUpload = useCallback(() => {
    Taro.showModal({
      title: '拍照上传',
      content: '请在光线充足的环境下拍摄清晰的口腔照片，方便医生了解您的矫治情况。',
      confirmText: '去拍照',
      confirmColor: '#4CAF90',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '拍照功能演示',
            icon: 'none'
          });
        }
      }
    });
  }, []);

  const getPriorityClass = (priority: string) => {
    if (priority === 'high') return styles.highPriority;
    if (priority === 'medium') return styles.mediumPriority;
    return '';
  };

  return (
    <ScrollView className={styles.container} scrollY>
      {mockCurrentStatus.needPhotoToday && (
        <View className={styles.photoNotice} onClick={handlePhotoUpload}>
          <View className={styles.photoIcon}>📷</View>
          <Text className={styles.photoText}>今天需要拍口腔照片哦，点击这里上传吧~</Text>
        </View>
      )}

      <View className={styles.section}>
        <StatusCard patientCase={mockPatientCase} status={mockCurrentStatus} />
      </View>

      <View className={styles.section}>
        <ProgressBar progress={mockProgress} />
      </View>

      <View className={styles.section}>
        <View className={styles.checkInCard}>
          <Text className={styles.checkInTitle}>今日佩戴打卡</Text>
          <Text className={styles.checkInSubtitle}>
            {todayChecked
              ? '今日已打卡，坚持就是胜利！'
              : `今天是佩戴第${mockCurrentStatus.currentAligner}副的第${mockCurrentStatus.daysInThisAligner}天`}
          </Text>
          <Button
            className={`${styles.checkInBtn} ${todayChecked ? styles.checked : ''}`}
            onClick={handleCheckIn}
            disabled={todayChecked}
          >
            {todayChecked ? '✓ 已完成打卡' : '点击打卡，已佩戴22小时'}
          </Button>
          <View className={styles.quickActions}>
            <Button className={styles.quickBtn} onClick={handleReportIssue}>
              遇到问题
            </Button>
            <Button className={styles.quickBtn} onClick={handleViewRecords}>
              查看记录
            </Button>
          </View>
          {mockPatientCase.isTeenager && (
            <View className={styles.familyNotice}>
              <Text className={styles.familyText}>
                👨‍👩‍👧 家长提醒已开启：{mockPatientCase.familyContact}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>重要提醒</Text>
        <View className={styles.reminderList}>
          {reminders.map((reminder) => (
            <View
              key={reminder.id}
              className={`${styles.reminderItem} ${getPriorityClass(reminder.priority)}`}
            >
              <View className={styles.reminderDot}></View>
              <View className={styles.reminderContent}>
                <Text className={styles.reminderTitle}>{reminder.title}</Text>
                <Text className={styles.reminderText}>{reminder.content}</Text>
                <Text className={styles.reminderDate}>{formatDate(reminder.date)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
