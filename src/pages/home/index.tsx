import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import StatusCard from '@/components/StatusCard';
import ProgressBar from '@/components/ProgressBar';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { abnormalTypeList } from '@/data/mock';
import { formatDate, getDaysUntil, getAbnormalLabel } from '@/utils';
import type { AbnormalType } from '@/types';

const HomePage: React.FC = () => {
  const {
    patientCase,
    currentStatus,
    progress,
    reminders,
    reports,
    records,
    hasCheckedToday,
    getTodayCheckIn,
    addCheckIn,
    refreshCurrentStatus,
    getPendingIssuesSummary,
    getNextPickupStatus
  } = useAppStore();

  const [showIssueOptions, setShowIssueOptions] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<AbnormalType[]>([]);

  const todayChecked = hasCheckedToday();
  const todayCheckIn = getTodayCheckIn();
  const pendingIssues = getPendingIssuesSummary();
  const pickupStatus = getNextPickupStatus();

  const totalPending = pendingIssues.pendingReports + pendingIssues.overduePickups + pendingIssues.checkInIssues;

  const handleToggleIssue = useCallback((type: AbnormalType) => {
    setSelectedIssues(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  const handleCheckIn = useCallback(() => {
    if (todayChecked) {
      if (todayCheckIn) {
        Taro.navigateTo({
          url: `/pages/checkin-detail/index?id=${todayCheckIn.id}`
        });
      }
      return;
    }
    setShowIssueOptions(true);
  }, [todayChecked, todayCheckIn]);

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

  const handleViewFamilyReminders = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/family-reminders/index'
    });
  }, []);

  const handleViewPendingIssues = useCallback(() => {
    if (pendingIssues.overduePickups > 0) {
      Taro.switchTab({
        url: '/pages/records/index'
      });
    } else {
      Taro.switchTab({
        url: '/pages/report/index'
      });
    }
  }, [pendingIssues.overduePickups]);

  const handleViewCheckInDetail = useCallback((id: string) => {
    Taro.navigateTo({
      url: `/pages/checkin-detail/index?id=${id}`
    });
  }, []);

  const getPriorityClass = (priority: string) => {
    if (priority === 'high') return styles.highPriority;
    if (priority === 'medium') return styles.mediumPriority;
    return '';
  };

  const displayedReminders = useMemo(() => {
    return reminders.slice(0, 5);
  }, [reminders]);

  const nextPickupRecord = useMemo(() => {
    return records
      .filter(r => !r.confirmed)
      .sort((a, b) => a.startAligner - b.startAligner)[0];
  }, [records]);

  if (!patientCase || !currentStatus || !progress) {
    return (
      <View className={styles.container} style={{ textAlign: 'center', paddingTop: '200rpx' }}>
        <Text style={{ fontSize: '32rpx', color: '#A0A0A0' }}>正在加载...</Text>
      </View>
    );
  }

  const daysUntilChange = getDaysUntil(currentStatus.changeDate);

  return (
    <ScrollView className={styles.container} scrollY onRefresh={refreshCurrentStatus} refresherEnabled>
      <View className={styles.header}>
        <View className={styles.patientInfo}>
          <Text className={styles.greeting}>Hi，{patientCase.patientName} 👋</Text>
          <View className={styles.clinicInfo}>
            <Text>🏥 {patientCase.clinicName}</Text>
          </View>
          {patientCase.isTeenager && (
            <Text className={styles.familyBadge}>👨‍👩‍👧 家属提醒已开启</Text>
          )}
        </View>
        <View className={styles.headerActions}>
          {patientCase.isTeenager && (
            <Button className={styles.actionBtn} onClick={handleViewFamilyReminders}>
              家长中心
            </Button>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.dashboardGrid}>
          <View className={styles.dashboardCard}>
            <View className={`${styles.cardIcon} ${styles.alignerIcon}`}>🦷</View>
            <Text className={styles.cardLabel}>当前佩戴</Text>
            <Text className={styles.cardValue}>第{currentStatus.currentAligner}副</Text>
            <Text className={styles.cardSub}>
              {daysUntilChange > 0
                ? `还剩${daysUntilChange}天换副`
                : daysUntilChange === 0
                  ? '今天该换副啦'
                  : `换副已逾期${Math.abs(daysUntilChange)}天`}
            </Text>
          </View>

          <View className={styles.dashboardCard}>
            <View className={`${styles.cardIcon} ${styles.checkInIcon}`}>✅</View>
            <Text className={styles.cardLabel}>今日打卡</Text>
            <Text className={styles.cardValue}>
              {todayChecked ? '已完成' : '未打卡'}
            </Text>
            {todayChecked ? (
              todayCheckIn?.hasIssue
                ? <Text className={styles.issueBadge}>⚠️ 有异常记录</Text>
                : <Text className={styles.okBadge}>一切正常</Text>
            ) : (
              <Text className={styles.cardSub}>点下方按钮打卡</Text>
            )}
          </View>

          <View className={styles.dashboardCard}>
            <View className={`${styles.cardIcon} ${styles.photoIcon}`}>📷</View>
            <Text className={styles.cardLabel}>复诊拍照</Text>
            <Text className={styles.cardValueSmall}>
              {currentStatus.needPhotoToday ? '今天需要' : '暂时不用'}
            </Text>
            {currentStatus.needPhotoToday && (
              <Text className={styles.issueBadge}>记得上传哦</Text>
            )}
          </View>

          <View className={styles.dashboardCard}>
            <View className={`${styles.cardIcon} ${styles.issueIcon}`}>📋</View>
            <Text className={styles.cardLabel}>待跟进事项</Text>
            <Text className={styles.cardValue}>{totalPending}</Text>
            {totalPending > 0 && (
              <Text className={styles.issueBadge}>请尽快处理</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <ProgressBar progress={progress} />
      </View>

      <View className={styles.section}>
        <View className={styles.checkInCard}>
          <View className={styles.checkInStatus}>
            <View
              className={`${styles.statusDot} ${
                todayChecked
                  ? todayCheckIn?.hasIssue
                    ? styles.hasIssue
                    : styles.checked
                  : ''
              }`}
            ></View>
            <Text className={styles.checkInTitle}>
              {todayChecked
                ? todayCheckIn?.hasIssue
                  ? '今日已打卡（带异常）'
                  : '今日打卡完成'
                : '今日佩戴打卡'}
            </Text>
          </View>
          <Text className={styles.checkInSubtitle}>
            {todayChecked
              ? todayCheckIn?.hasIssue
                ? '今天是佩戴第' + currentStatus.currentAligner + '副，已记录异常情况，点击查看详情'
                : '今天是佩戴第' + currentStatus.currentAligner + '副，已佩戴约' + currentStatus.dailyWearHours + '小时'
              : '今天是佩戴第' + currentStatus.currentAligner + '副的第' + currentStatus.daysInThisAligner + '天，点击确认已佩戴~'}
          </Text>

          {todayChecked && todayCheckIn?.hasIssue && todayCheckIn.issues && (
            <View className={styles.issueTags}>
              {todayCheckIn.issues.map((issue, idx) => (
                <Text key={idx} className={styles.issueTag}>
                  {getAbnormalLabel(issue)}
                </Text>
              ))}
            </View>
          )}

          <Button
            className={`${styles.checkInBtn} ${todayChecked ? styles.checked : ''}`}
            onClick={handleCheckIn}
          >
            {todayChecked
              ? todayCheckIn?.hasIssue
                ? '查看打卡详情'
                : '✓ 已完成打卡'
              : '点击打卡，已佩戴' + currentStatus.dailyWearHours + '小时'}
          </Button>

          {todayChecked && todayCheckIn && (
            <View style={{ marginTop: '20rpx' }}>
              <Button
                className={styles.quickBtn}
                onClick={() => handleViewCheckInDetail(todayCheckIn.id)}
                style={{ width: '100%', marginBottom: '16rpx' }}
              >
                查看打卡详情
              </Button>
            </View>
          )}

          <View className={styles.quickActions}>
            <Button className={styles.quickBtn} onClick={handleReportIssue}>
              遇到问题
            </Button>
            <Button className={styles.quickBtn} onClick={handleViewRecords}>
              领取记录
            </Button>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📅 日程安排</Text>
        </View>
        <View className={styles.scheduleCard}>
          {pickupStatus !== 'none' && nextPickupRecord ? (
            <View className={styles.scheduleItem}>
              <View className={styles.scheduleIcon}>🎁</View>
              <View className={styles.scheduleContent}>
                <Text className={styles.scheduleTitle}>领取牙套</Text>
                <Text className={styles.scheduleDesc}>
                  可领取 {currentStatus.nextPickupAligners}
                </Text>
                <Text className={styles.scheduleDate}>
                  📅 {formatDate(currentStatus.nextPickupDate)}
                  {pickupStatus === 'available' && (
                    <Text style={{ color: '#FF4D4F', marginLeft: '12rpx' }}>（已到领取日期）</Text>
                  )}
                </Text>
              </View>
              <Text className={styles.scheduleAction} onClick={handleViewRecords}>去确认</Text>
            </View>
          ) : (
            <View className={styles.waitingCard}>
              <Text className={styles.waitingText}>
                📋 暂无下一批次安排，请等待诊所录入下一批牙套领取信息
              </Text>
            </View>
          )}

          {currentStatus.needPhotoToday && (
            <View className={styles.scheduleItem}>
              <View className={styles.scheduleIcon}>📷</View>
              <View className={styles.scheduleContent}>
                <Text className={styles.scheduleTitle}>复诊拍照</Text>
                <Text className={styles.scheduleDesc}>
                  请拍摄口腔内照片上传，方便医生了解矫治进度
                </Text>
                <Text className={styles.scheduleDate}>📅 今天</Text>
              </View>
              <Text className={styles.scheduleAction} onClick={handlePhotoUpload}>去拍照</Text>
            </View>
          )}

          {daysUntilChange <= 1 && daysUntilChange >= 0 && (
            <View className={styles.scheduleItem}>
              <View className={styles.scheduleIcon}>🔄</View>
              <View className={styles.scheduleContent}>
                <Text className={styles.scheduleTitle}>
                  {daysUntilChange === 0 ? '今天更换新牙套' : '明天更换新牙套'}
                </Text>
                <Text className={styles.scheduleDesc}>
                  记得更换为第{currentStatus.currentAligner + 1}副，按顺序佩戴不要跳副哦
                </Text>
                <Text className={styles.scheduleDate}>
                  📅 {formatDate(currentStatus.changeDate)}
                </Text>
              </View>
            </View>
          )}

          {totalPending > 0 && (
            <View className={styles.scheduleItem}>
              <View className={styles.scheduleIcon} style={{ background: 'linear-gradient(135deg, #FFE8E8 0%, #FFD6D6 100%)' }}>⚠️</View>
              <View className={styles.scheduleContent}>
                <Text className={styles.scheduleTitle}>待跟进事项</Text>
                <Text className={styles.scheduleDesc}>
                  共{totalPending}项待处理：
                  {pendingReports > 0 && ` 待处理上报${pendingReports}项`}
                  {pendingIssues.overduePickups > 0 && ` 逾期领取${pendingIssues.overduePickups}项`}
                  {pendingIssues.checkInIssues > 0 && ` 打卡异常${pendingIssues.checkInIssues}项`}
                </Text>
              </View>
              <Text className={styles.scheduleAction} onClick={handleViewPendingIssues}>去处理</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>🔔 重要提醒</Text>
        </View>
        {displayedReminders.length === 0 ? (
          <View style={{ textAlign: 'center', padding: '48rpx 0', color: '#A0A0A0', background: '#fff', borderRadius: '16rpx' }}>
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
