import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import StatusCard from '@/components/StatusCard';
import ProgressBar from '@/components/ProgressBar';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { abnormalTypeList } from '@/data/mock';
import { formatDate } from '@/utils';
import type { AbnormalType } from '@/types';

const HomePage: React.FC = () => {
  const {
    patientCase,
    currentStatus,
    progress,
    reminders,
    hasCheckedToday,
    getTodayCheckIn,
    addCheckIn,
    refreshCurrentStatus
  } = useAppStore();

  const [showIssueOptions, setShowIssueOptions] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<AbnormalType[]>([]);

  const todayChecked = hasCheckedToday();
  const todayCheckIn = getTodayCheckIn();

  const handleToggleIssue = useCallback((type: AbnormalType) => {
    setSelectedIssues(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  const handleCheckIn = useCallback(() => {
    if (todayChecked) return;
    setShowIssueOptions(true);
  }, [todayChecked]);

  const handleConfirmCheckIn = useCallback(() => {
    if (!currentStatus) return;

    addCheckIn({
      alignerNumber: currentStatus.currentAligner,
      wornHours: currentStatus.dailyWearHours,
      isChecked: true,
      hasIssue: selectedIssues.length > 0,
      issues: selectedIssues
    });

    setShowIssueOptions(false);
    setSelectedIssues([]);

    if (selectedIssues.length > 0) {
      Taro.showToast({
        title: '打卡成功！已记录异常情况',
        icon: 'none',
        duration: 2500
      });
    } else {
      Taro.showToast({
        title: '打卡成功！继续加油~',
        icon: 'success',
        duration: 2000
      });
    }
    console.log('[HomePage] 今日打卡完成，异常:', selectedIssues);
  }, [currentStatus, addCheckIn, selectedIssues]);

  const handleCancelCheckIn = useCallback(() => {
    setShowIssueOptions(false);
    setSelectedIssues([]);
  }, []);

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

  const getIssueLabel = (type: AbnormalType) => {
    const item = abnormalTypeList.find(t => t.type === type);
    return item?.label || type;
  };

  const displayedReminders = useMemo(() => {
    return reminders.slice(0, 5);
  }, [reminders]);

  if (!patientCase || !currentStatus || !progress) {
    return (
      <View className={styles.container} style={{ textAlign: 'center', paddingTop: '200rpx' }}>
        <Text style={{ fontSize: '32rpx', color: '#A0A0A0' }}>正在加载...</Text>
      </View>
    );
  }

  return (
    <ScrollView className={styles.container} scrollY onRefresh={refreshCurrentStatus} refresherEnabled>
      {currentStatus.needPhotoToday && (
        <View className={styles.photoNotice} onClick={handlePhotoUpload}>
          <View className={styles.photoIcon}>📷</View>
          <Text className={styles.photoText}>今天需要拍口腔照片哦，点击这里上传吧~</Text>
        </View>
      )}

      <View className={styles.section}>
        <StatusCard patientCase={patientCase} status={currentStatus} />
      </View>

      <View className={styles.section}>
        <ProgressBar progress={progress} />
      </View>

      <View className={styles.section}>
        <View className={styles.checkInCard}>
          <Text className={styles.checkInTitle}>今日佩戴打卡</Text>
          <Text className={styles.checkInSubtitle}>
            {todayChecked
              ? todayCheckIn?.hasIssue
                ? '今日已打卡，已记录异常情况'
                : '今日已打卡，坚持就是胜利！'
              : `今天是佩戴第${currentStatus.currentAligner}副的第${currentStatus.daysInThisAligner}天`}
          </Text>

          {todayChecked && todayCheckIn?.hasIssue && todayCheckIn.issues && (
            <View style={{ marginBottom: '32rpx', padding: '16rpx', background: '#FFF3E6', borderRadius: '12rpx' }}>
              <Text style={{ fontSize: '24rpx', color: '#FF9F43' }}>
                今日记录的异常：{todayCheckIn.issues.map(getIssueLabel).join('、')}
              </Text>
            </View>
          )}

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
          {patientCase.isTeenager && (
            <View className={styles.familyNotice}>
              <Text className={styles.familyText}>
                👨‍👩‍👧 家长提醒已开启：{patientCase.familyContact}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>重要提醒</Text>
        {displayedReminders.length === 0 ? (
          <View style={{ textAlign: 'center', padding: '48rpx 0', color: '#A0A0A0' }}>
            暂无提醒
          </View>
        ) : (
          <View className={styles.reminderList}>
            {displayedReminders.map((reminder) => (
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
        )}
      </View>

      {showIssueOptions && (
        <View className={styles.modalMask}>
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>今日佩戴情况</Text>
            <Text className={styles.modalSubtitle}>
              今天佩戴过程中有没有遇到以下情况？（可多选）
            </Text>
            <View className={styles.issueList}>
              {abnormalTypeList.slice(0, 4).map((item) => (
                <View
                  key={item.type}
                  className={`${styles.issueItem} ${selectedIssues.includes(item.type) ? styles.selected : ''}`}
                  onClick={() => handleToggleIssue(item.type)}
                >
                  <View className={styles.issueCheck}>
                    {selectedIssues.includes(item.type) && <Text style={{ color: '#fff', fontSize: '24rpx' }}>✓</Text>}
                  </View>
                  <Text className={styles.issueLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={handleCancelCheckIn}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmCheckIn}>
                {selectedIssues.length > 0 ? '确认打卡并记录' : '确认打卡，一切正常'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HomePage;
