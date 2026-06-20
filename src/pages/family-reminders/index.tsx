import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate, getDaysUntil, getAbnormalLabel } from '@/utils';
import type { ScheduleReminder, AlignerRecord } from '@/types';

interface TimelineItem {
  id: string;
  type: 'change' | 'pickup' | 'visit';
  date: string;
  title: string;
  subtitle: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  relatedRecord?: AlignerRecord;
}

const FamilyRemindersPage: React.FC = () => {
  const {
    patientCase,
    currentStatus,
    records,
    reminders,
    reports,
    markReminderRead,
    getFamilyReminders,
    checkIns
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'change' | 'pickup' | 'overdue'>('all');
  const [showVisitDetail, setShowVisitDetail] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState<TimelineItem | null>(null);
  const [showTimelineDetail, setShowTimelineDetail] = useState(false);

  const familyReminders = useMemo(() => getFamilyReminders(), [getFamilyReminders]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    if (!currentStatus || !patientCase) return items;

    if (currentStatus.changeDate) {
      const days = getDaysUntil(currentStatus.changeDate);
      items.push({
        id: 'tl-change',
        type: 'change',
        date: currentStatus.changeDate,
        title: `更换第${currentStatus.currentAligner + 1}副牙套`,
        subtitle: days > 0 ? `${days}天后换副` : days === 0 ? '今天要换副啦' : `换副已逾期${Math.abs(days)}天`,
        icon: '🔄',
        priority: days <= 1 ? 'high' : days <= 7 ? 'medium' : 'low'
      });
    }

    records
      .filter(r => !r.confirmed)
      .sort((a, b) => a.startAligner - b.startAligner)
      .forEach(r => {
        const days = getDaysUntil(r.receiveDate);
        items.push({
          id: `tl-pickup-${r.id}`,
          type: 'pickup',
          date: r.receiveDate,
          title: `领取第${r.startAligner}-${r.endAligner}副`,
          subtitle: days > 0 ? `${days}天后领取` : days === 0 ? '今天可以领取啦' : `领取已逾期${Math.abs(days)}天`,
          icon: '🎁',
          priority: days <= 3 ? 'high' : days <= 14 ? 'medium' : 'low',
          relatedRecord: r
        });
      });

    if (currentStatus.needPhotoToday) {
      items.push({
        id: 'tl-visit-photo',
        type: 'visit',
        date: new Date().toISOString().slice(0, 10),
        title: '复诊拍照上传',
        subtitle: '今天需要拍口腔照片',
        icon: '📷',
        priority: 'high'
      });
    }

    return items.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da.getTime() - db.getTime();
    });
  }, [currentStatus, records, patientCase]);

  const pendingReports = useMemo(() =>
    reports.filter(r => r.status === 'pending'),
    [reports]
  );

  const recentWeekCheckIns = checkIns.slice(0, 7);
  const checkedInDays = recentWeekCheckIns.filter(c => c.isChecked).length;
  const hasIssueDays = recentWeekCheckIns.filter(c => c.hasIssue).length;
  const unconfirmedRecords = records.filter(r => !r.confirmed);
  const daysUntilChange = currentStatus ? getDaysUntil(currentStatus.changeDate) : 0;

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
  const visitReminders = useMemo(() =>
    familyReminders.filter(r => r.type === 'visit'),
    [familyReminders]
  );

  const displayedReminders = useMemo(() => {
    switch (activeTab) {
      case 'change': return changeReminders;
      case 'pickup': return pickupReminders;
      case 'overdue': return overdueReminders;
      default: return familyReminders;
    }
  }, [activeTab, changeReminders, pickupReminders, overdueReminders, familyReminders]);

  const handleMarkRead = useCallback((id: string) => { markReminderRead(id); }, [markReminderRead]);
  const handleGoHome = useCallback(() => { Taro.switchTab({ url: '/pages/home/index' }); }, []);
  const handleGoRecords = useCallback(() => { Taro.switchTab({ url: '/pages/records/index' }); }, []);
  const handleGoReport = useCallback(() => { Taro.switchTab({ url: '/pages/report/index' }); }, []);

  const handleOpenTimeline = useCallback((item: TimelineItem) => {
    setActiveTimeline(item);
    setShowTimelineDetail(true);
  }, []);

  const getTabLabel = (key: string): string => {
    const map: Record<string, string> = { all: '全部', change: '换副提醒', pickup: '复诊提醒', overdue: '逾期提醒' };
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
    const map: Record<string, string> = { change: '🔄', pickup: '🏥', overdue: '⚠️', visit: '📷' };
    return map[type] || '🔔';
  };
  const getReminderTypeLabel = (type: string): string => {
    const map: Record<string, string> = { change: '换副提醒', pickup: '领取提醒', overdue: '逾期提醒', visit: '拍照提醒' };
    return map[type] || '提醒';
  };
  const getPriorityClass = (p: string) => {
    if (p === 'high') return styles.tlHigh;
    if (p === 'medium') return styles.tlMedium;
    return styles.tlLow;
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

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <View className={styles.headerInfo}>
          <Text className={styles.title}>👨‍👩‍👧 家长中心</Text>
          <Text className={styles.subtitle}>
            {patientCase.familyContact} · 关注 {patientCase.patientName} 的矫治进度
          </Text>
        </View>
        <Button className={styles.backHomeBtn} onClick={handleGoHome}>返回首页</Button>
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
            <Text className={styles.summaryValue} style={{ color: pendingReports.length > 0 ? '#FF4D4F' : '#00B894' }}>
              {pendingReports.length}
            </Text>
            <Text className={styles.summaryLabel}>待处理问题</Text>
          </View>
        </View>
      </View>

      <View className={styles.weekCard}>
        <Text className={styles.sectionTitle}>📊 近7天佩戴情况</Text>
        <View className={styles.weekStats}>
          <View className={styles.weekStat}>
            <Text className={styles.weekValue} style={{ color: '#4CAF90' }}>{checkedInDays}</Text>
            <Text className={styles.weekLabel}>已打卡</Text>
          </View>
          <View className={styles.weekStat}>
            <Text className={styles.weekValue} style={{ color: '#FF9F43' }}>{hasIssueDays}</Text>
            <Text className={styles.weekLabel}>有异常</Text>
          </View>
          <View className={styles.weekStat}>
            <Text className={styles.weekValue} style={{ color: '#86909C' }}>{7 - checkedInDays}</Text>
            <Text className={styles.weekLabel}>未打卡</Text>
          </View>
        </View>
      </View>

      <View className={styles.timelineCard}>
        <Text className={styles.sectionTitle}>🗓️ 陪同事项时间线</Text>
        <Text className={styles.timelineSubtitle}>按日期排列，点击查看准备清单</Text>
        <View className={styles.timelineList}>
          {timelineItems.length === 0 ? (
            <View style={{ textAlign: 'center', padding: '48rpx 0', color: '#A0A0A0' }}>暂无事项安排</View>
          ) : (
            timelineItems.map((item, idx) => (
              <View key={item.id} className={styles.timelineItem} onClick={() => handleOpenTimeline(item)}>
                <View className={`${styles.timelineDot} ${getPriorityClass(item.priority)}`}>
                  <Text className={styles.timelineIcon}>{item.icon}</Text>
                </View>
                {idx < timelineItems.length - 1 && <View className={styles.timelineLine}></View>}
                <View className={styles.timelineContent}>
                  <View className={styles.timelineTop}>
                    <Text className={styles.timelineTitle}>{item.title}</Text>
                    <Text className={styles.timelineArrow}>›</Text>
                  </View>
                  <Text className={styles.timelineDate}>📅 {formatDate(item.date)} · {item.subtitle}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {visitReminders.length > 0 && (
        <View className={styles.visitCard} onClick={() => setShowVisitDetail(true)}>
          <View className={styles.visitHeader}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
              <Text style={{ fontSize: '32rpx' }}>📷</Text>
              <Text className={styles.visitTitle}>复诊拍照陪同提醒</Text>
            </View>
            <Text className={styles.visitArrow}>›</Text>
          </View>
          <Text className={styles.visitContent}>今天需要帮孩子拍摄口腔照片，{visitReminders.length}项待准备</Text>
        </View>
      )}

      {(pickupReminders.length > 0 || currentStatus.needPhotoToday || daysUntilChange <= 1) && (
        <View className={styles.visitCard} onClick={() => setShowVisitDetail(true)}>
          <View className={styles.visitHeader}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
              <Text style={{ fontSize: '32rpx' }}>🏥</Text>
              <Text className={styles.visitTitle}>复诊陪同准备事项</Text>
            </View>
            <Text className={styles.visitArrow}>›</Text>
          </View>
          <Text className={styles.visitContent}>复诊前需要确认的事项清单，点击查看详情</Text>
        </View>
      )}

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
              <Button className={styles.todoAction} onClick={() => setShowVisitDetail(true)}>拍照指南</Button>
            </View>
          )}
          {unconfirmedRecords.length > 0 && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#FF9F43' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>有{unconfirmedRecords.length}批牙套待领取</Text>
                <Text className={styles.todoDate}>请及时安排时间到诊所</Text>
              </View>
              <Button className={styles.todoAction} onClick={handleGoRecords}>查看记录</Button>
            </View>
          )}
          {pendingReports.length > 0 && (
            <View className={styles.todoItem}>
              <View className={styles.todoDot} style={{ background: '#FF4D4F' }}></View>
              <View className={styles.todoContent}>
                <Text className={styles.todoText}>有{pendingReports.length}个异常问题等待诊所处理</Text>
                <Text className={styles.todoDate}>可联系诊所跟进进度</Text>
              </View>
              <Button className={styles.todoAction} onClick={handleGoReport}>查看上报</Button>
            </View>
          )}
          {daysUntilChange > 1 && !currentStatus.needPhotoToday && unconfirmedRecords.length === 0 && pendingReports.length === 0 && (
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

      {showVisitDetail && (
        <View className={styles.modalMask} onClick={() => setShowVisitDetail(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>🏥 复诊/拍照陪同指南</Text>
            <Text className={styles.modalSubtitle}>
              孩子当前佩戴第{currentStatus.currentAligner}副，共{currentStatus.totalAligners}副
            </Text>

            <View className={styles.detailSection}>
              <Text className={styles.detailSectionTitle}>📷 拍照要求（如有需要）</Text>
              <View className={styles.detailList}>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>在光线充足的地方拍摄，避免反光</Text></View>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>拍摄牙齿正面（上下牙咬合状态）</Text></View>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>拍摄牙齿左右侧面各一张</Text></View>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>拍摄牙齿上下面（咬合面）各一张</Text></View>
              </View>
            </View>

            <View className={styles.detailSection}>
              <Text className={styles.detailSectionTitle}>📋 复诊前准备</Text>
              <View className={styles.detailList}>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>确认最近7天打卡情况（{checkedInDays}/7天）</Text></View>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>检查孩子是否有异常疼痛或不适</Text></View>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>带上换下来的旧牙套（如有）</Text></View>
                <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>提前预约诊所，安排好陪同时间</Text></View>
              </View>
            </View>

            {pendingReports.length > 0 && (
              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>⚠️ 待处理问题</Text>
                <View className={styles.detailList}>
                  {pendingReports.map((r) => (
                    <View key={r.id} className={styles.detailItem}>
                      <Text className={styles.detailDot}>•</Text>
                      <Text className={styles.detailText}>
                        [{getAbnormalLabel(r.type)}] {r.description}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className={styles.modalActions}>
              <Button className={styles.modalCancelBtn} onClick={() => setShowVisitDetail(false)}>我知道了</Button>
            </View>
          </View>
        </View>
      )}

      {showTimelineDetail && activeTimeline && (
        <View className={styles.modalMask} onClick={() => { setShowTimelineDetail(false); setActiveTimeline(null); }}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>
              {activeTimeline.icon} {activeTimeline.title}
            </Text>
            <Text className={styles.modalSubtitle}>
              📅 {formatDate(activeTimeline.date)} · {activeTimeline.subtitle}
            </Text>

            {activeTimeline.type === 'change' && (
              <>
                <View className={styles.detailSection}>
                  <Text className={styles.detailSectionTitle}>🔄 换副准备清单</Text>
                  <View className={styles.detailList}>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>确认当前牙套已佩戴满14天</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>找到新牙套（第{currentStatus.currentAligner + 1}副），核对编号</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>清洗双手，确保指甲干净</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>取下旧牙套，保存好（复诊带给医生）</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>戴上新牙套，确认完全贴合</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>清洁旧牙套放入牙套盒保存</Text></View>
                  </View>
                </View>
                <View className={styles.detailSection}>
                  <Text className={styles.detailSectionTitle}>💬 给家长的话</Text>
                  <Text style={{ fontSize: '26rpx', color: '#666', lineHeight: 1.6 }}>
                    换副初期孩子可能会有轻微酸胀感，通常2-3天会缓解。
                    请提醒孩子每天佩戴不少于22小时，进食时记得摘下并清洁牙套。
                  </Text>
                </View>
              </>
            )}

            {activeTimeline.type === 'pickup' && activeTimeline.relatedRecord && (
              <>
                <View className={styles.detailSection}>
                  <Text className={styles.detailSectionTitle}>🎁 领取准备清单</Text>
                  <View className={styles.detailList}>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>提前和诊所预约领取时间</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>带上换下来的旧牙套（给医生检查）</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>确认孩子最近佩戴情况，有问题可当面咨询</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>领取新牙套时核对副号范围（第{activeTimeline.relatedRecord.startAligner}-{activeTimeline.relatedRecord.endAligner}副）</Text></View>
                    {activeTimeline.relatedRecord.notes && (
                      <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>诊所提示：{activeTimeline.relatedRecord.notes}</Text></View>
                    )}
                    {activeTimeline.relatedRecord.nurseName && (
                      <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>负责护士：{activeTimeline.relatedRecord.nurseName}</Text></View>
                    )}
                  </View>
                </View>
              </>
            )}

            {activeTimeline.type === 'visit' && (
              <>
                <View className={styles.detailSection}>
                  <Text className={styles.detailSectionTitle}>📷 拍照准备清单</Text>
                  <View className={styles.detailList}>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>找一处光线充足的地方（窗边自然光最好）</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>让孩子张大嘴，拍摄牙齿正面咬合状态</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>拍摄左右侧面各一张（可以用勺子轻轻拉开嘴唇）</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>拍摄上下牙齿咬合面各一张</Text></View>
                    <View className={styles.detailItem}><Text className={styles.detailDot}>•</Text><Text className={styles.detailText}>检查照片清晰度，确保牙齿细节可见</Text></View>
                  </View>
                </View>
              </>
            )}

            <View className={styles.detailSection}>
              <Text className={styles.detailSectionTitle}>⚠️ 关联异常记录（{pendingReports.length}条待处理）</Text>
              {pendingReports.length === 0 ? (
                <Text style={{ fontSize: '26rpx', color: '#A0A0A0' }}>暂无未处理的异常问题</Text>
              ) : (
                <View className={styles.detailList}>
                  {pendingReports.map((r) => (
                    <View key={r.id} className={styles.issueBox}>
                      <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#333' }}>
                        {getAbnormalLabel(r.type)} · {formatDate(r.reportDate)}
                      </Text>
                      <Text style={{ fontSize: '24rpx', color: '#666', marginTop: '8rpx', lineHeight: 1.6 }}>
                        {r.description}
                      </Text>
                      {(r.contactName || r.contactPhone) && (
                        <Text style={{ fontSize: '22rpx', color: '#86909C', marginTop: '6rpx' }}>
                          📞 {r.contactName || ''} {r.contactPhone || ''}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.modalCancelBtn} onClick={() => { setShowTimelineDetail(false); setActiveTimeline(null); }}>我知道了</Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyRemindersPage;
