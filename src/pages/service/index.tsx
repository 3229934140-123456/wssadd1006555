import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate, getAbnormalLabel, getIssueIcon, getStatusLabel, getStatusColor } from '@/utils';
import type { AbnormalReport } from '@/types';

type FilterType = 'all' | 'pending' | 'reviewed' | 'resolved';

const ServicePage: React.FC = () => {
  const { reports, updateReportStatus, patientCase, addRecord, records, currentStatus } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingReport, setEditingReport] = useState<AbnormalReport | null>(null);
  const [handlerNote, setHandlerNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<'pending' | 'reviewed' | 'resolved' | null>(null);

  const [newRecordStart, setNewRecordStart] = useState('');
  const [newRecordEnd, setNewRecordEnd] = useState('');
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordNotes, setNewRecordNotes] = useState('');
  const [newRecordNurse, setNewRecordNurse] = useState('李护士');

  const filteredReports = useMemo(() => {
    if (activeFilter === 'all') return reports;
    return reports.filter(r => r.status === activeFilter);
  }, [reports, activeFilter]);

  const stats = useMemo(() => ({
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  }), [reports]);

  const handleUpdateStatus = useCallback((report: AbnormalReport) => {
    const statusList: { value: 'pending' | 'reviewed' | 'resolved'; label: string }[] = [
      { value: 'pending', label: '待处理' },
      { value: 'reviewed', label: '已查看' },
      { value: 'resolved', label: '已解决' }
    ];

    Taro.showActionSheet({
      itemList: statusList.map(s => `${s.label}${report.status === s.value ? '（当前）' : ''}`),
      success: (res) => {
        const newStatus = statusList[res.tapIndex].value;
        setEditingReport(report);
        setTargetStatus(newStatus);
        setHandlerNote(report.handlerNote || '');
      }
    });
  }, []);

  const handleConfirmUpdate = useCallback(() => {
    if (!editingReport || !targetStatus) return;
    updateReportStatus(editingReport.id, targetStatus, handlerNote.trim());
    Taro.showToast({
      title: `已更新为${getStatusLabel(targetStatus)}`,
      icon: 'success'
    });
    setEditingReport(null);
    setTargetStatus(null);
    setHandlerNote('');
  }, [editingReport, targetStatus, handlerNote, updateReportStatus]);

  const handleQuickReview = useCallback((report: AbnormalReport) => {
    updateReportStatus(report.id, 'reviewed', '已查看患者情况，将跟进后续进展');
    Taro.showToast({ title: '已标记为已查看', icon: 'success' });
  }, [updateReportStatus]);

  const handleAddRecord = useCallback(() => {
    if (!newRecordStart || !newRecordEnd || !newRecordDate) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const start = parseInt(newRecordStart);
    const end = parseInt(newRecordEnd);
    if (isNaN(start) || isNaN(end) || start > end) {
      Taro.showToast({
        title: '请填写正确的副数范围',
        icon: 'none'
      });
      return;
    }

    addRecord({
      startAligner: start,
      endAligner: end,
      receiveDate: newRecordDate,
      notes: newRecordNotes || '请按医嘱佩戴，按时更换。保持口腔卫生，有问题及时联系诊所。',
      nurseName: newRecordNurse || '李护士'
    });

    Taro.showToast({
      title: `已添加第${start}-${end}副`,
      icon: 'success'
    });

    setShowAddRecord(false);
    setNewRecordStart('');
    setNewRecordEnd('');
    setNewRecordDate('');
    setNewRecordNotes('');
  }, [newRecordStart, newRecordEnd, newRecordDate, newRecordNotes, newRecordNurse, addRecord]);

  const handleQuickAddNext = useCallback(() => {
    const lastRecord = [...records].sort((a, b) => b.endAligner - a.endAligner)[0];
    const nextStart = lastRecord ? lastRecord.endAligner + 1 : (currentStatus?.currentAligner || 1);
    const nextEnd = nextStart + 5;

    const today = new Date();
    today.setDate(today.getDate() + 14);
    const nextDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    setNewRecordStart(String(nextStart));
    setNewRecordEnd(String(nextEnd));
    setNewRecordDate(nextDate);
    setShowAddRecord(true);
  }, [records, currentStatus]);

  const getFilterLabel = (key: FilterType): string => {
    const map: Record<FilterType, string> = {
      all: '全部',
      pending: '待处理',
      reviewed: '已查看',
      resolved: '已解决'
    };
    return map[key];
  };

  const getFilterCount = (key: FilterType): number => {
    return stats[key];
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>诊所客服视图</Text>
        <Text className={styles.subtitle}>
          {patientCase?.clinicName || '微笑口腔诊所'} · 患者协同管理
        </Text>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#FF9F43' }}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#54A0FF' }}>{stats.reviewed}</Text>
          <Text className={styles.statLabel}>已查看</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#00B894' }}>{stats.resolved}</Text>
          <Text className={styles.statLabel}>已解决</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#666' }}>{stats.all}</Text>
          <Text className={styles.statLabel}>总计</Text>
        </View>
      </View>

      <View className={styles.toolbar}>
        <Button className={styles.toolBtnPrimary} onClick={handleQuickAddNext}>
          ➕ 快速新增下一批
        </Button>
        <Button className={styles.toolBtn} onClick={() => setShowAddRecord(true)}>
          自定义新增
        </Button>
      </View>

      <View className={styles.filterTabs}>
        {(['all', 'pending', 'reviewed', 'resolved'] as FilterType[]).map((key) => (
          <Button
            key={key}
            className={`${styles.tabItem} ${activeFilter === key ? styles.active : ''}`}
            onClick={() => setActiveFilter(key)}
          >
            {getFilterLabel(key)} ({getFilterCount(key)})
          </Button>
        ))}
      </View>

      {filteredReports.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>暂无相关记录</Text>
        </View>
      ) : (
        <View className={styles.reportList}>
          {filteredReports.map((report) => (
            <View key={report.id} className={styles.reportCard}>
              <View className={styles.reportHeader}>
                <View className={styles.reportType}>
                  <Text className={styles.reportIcon}>{getIssueIcon(report.type)}</Text>
                  <Text className={styles.reportTypeText}>{getAbnormalLabel(report.type)}</Text>
                </View>
                <View
                  className={styles.statusTag}
                  style={{
                    backgroundColor: getStatusColor(report.status) + '20',
                    color: getStatusColor(report.status)
                  }}
                >
                  {getStatusLabel(report.status)}
                </View>
              </View>

              <Text className={styles.reportDesc}>{report.description}</Text>

              <View className={styles.reportMeta}>
                <Text className={styles.reportDate}>📅 {formatDate(report.reportDate)}</Text>
                {(report.contactName || report.contactPhone) && (
                  <Text className={styles.reportContact}>
                    📞 {report.contactName || ''} {report.contactPhone || ''}
                  </Text>
                )}
              </View>

              {report.handlerNote && (
                <View className={styles.handlerNote}>
                  <Text className={styles.handlerLabel}>
                    💬 {report.handlerName || '客服'} · {report.handledDate ? formatDate(report.handledDate) : ''}
                  </Text>
                  <Text className={styles.handlerContent}>{report.handlerNote}</Text>
                </View>
              )}

              <View className={styles.reportActions}>
                <Button
                  className={styles.actionBtn}
                  onClick={() => handleUpdateStatus(report)}
                >
                  更新状态+备注
                </Button>
                {report.status === 'pending' && (
                  <Button
                    className={styles.quickBtn}
                    onClick={() => handleQuickReview(report)}
                  >
                    快速查看
                  </Button>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {editingReport && targetStatus && (
        <View className={styles.modalMask}>
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>更新处理状态</Text>
            <Text className={styles.modalSubtitle}>
              将状态从「{getStatusLabel(editingReport.status)}」更新为「{getStatusLabel(targetStatus)}」
            </Text>

            <Text className={styles.inputLabel}>处理意见（患者端可见）</Text>
            <Textarea
              className={styles.modalTextarea}
              value={handlerNote}
              onInput={(e) => setHandlerNote(e.detail.value)}
              placeholder="请输入处理意见或回复内容，患者端可以看到这条回复"
              maxlength={200}
              autoHeight
            />

            <View className={styles.quickNotes}>
              <Text
                className={styles.quickNoteTag}
                onClick={() => setHandlerNote('已收到您的反馈，客服正在处理中，会尽快联系您')}
              >
                已收到，处理中
              </Text>
              <Text
                className={styles.quickNoteTag}
                onClick={() => setHandlerNote('已安排复诊，请按预约时间到诊所检查')}
              >
                安排复诊
              </Text>
              <Text
                className={styles.quickNoteTag}
                onClick={() => setHandlerNote('已电话沟通，问题已解决，继续观察')}
              >
                已电话解决
              </Text>
            </View>

            <View className={styles.modalActions}>
              <Button
                className={styles.cancelBtn}
                onClick={() => {
                  setEditingReport(null);
                  setTargetStatus(null);
                }}
              >
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmUpdate}>
                确认更新
              </Button>
            </View>
          </View>
        </View>
      )}

      {showAddRecord && (
        <View className={styles.modalMask}>
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>诊所新增领取批次</Text>
            <Text className={styles.modalSubtitle}>
              患者将在领取记录和首页看到新的领取信息
            </Text>

            <View className={styles.formRow}>
              <Text className={styles.inputLabel}>起始副号</Text>
              <input
                className={styles.formInput}
                type="number"
                value={newRecordStart}
                onInput={(e) => setNewRecordStart(e.detail.value)}
                placeholder="例如：19"
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.inputLabel}>结束副号</Text>
              <input
                className={styles.formInput}
                type="number"
                value={newRecordEnd}
                onInput={(e) => setNewRecordEnd(e.detail.value)}
                placeholder="例如：24"
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.inputLabel}>领取日期</Text>
              <input
                className={styles.formInput}
                value={newRecordDate}
                onInput={(e) => setNewRecordDate(e.detail.value)}
                placeholder="格式：YYYY-MM-DD"
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.inputLabel}>护士姓名</Text>
              <input
                className={styles.formInput}
                value={newRecordNurse}
                onInput={(e) => setNewRecordNurse(e.detail.value)}
                placeholder="护士姓名"
              />
            </View>

            <Text className={styles.inputLabel}>注意事项（可选）</Text>
            <Textarea
              className={styles.modalTextarea}
              value={newRecordNotes}
              onInput={(e) => setNewRecordNotes(e.detail.value)}
              placeholder="请输入给患者的注意事项和医嘱"
              maxlength={300}
              autoHeight
            />

            <View className={styles.modalActions}>
              <Button
                className={styles.cancelBtn}
                onClick={() => setShowAddRecord(false)}
              >
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleAddRecord}>
                确认新增
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ServicePage;
