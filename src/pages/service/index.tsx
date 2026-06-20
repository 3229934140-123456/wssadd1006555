import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate, getAbnormalLabel, getIssueIcon, getStatusLabel, getStatusColor, getDaysUntil } from '@/utils';
import type { AbnormalReport, AlignerRecord } from '@/types';

type FilterType = 'all' | 'pending' | 'reviewed' | 'resolved';

const ServicePage: React.FC = () => {
  const {
    reports,
    updateReportStatus,
    patientCase,
    addRecord,
    updateRecord,
    deleteRecord,
    records,
    currentStatus,
    getWeekCheckIns,
    getPendingRecords
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingReport, setEditingReport] = useState<AbnormalReport | null>(null);
  const [handlerNote, setHandlerNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<'pending' | 'reviewed' | 'resolved' | null>(null);

  const [selectedReport, setSelectedReport] = useState<AbnormalReport | null>(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);

  const [editingRecord, setEditingRecord] = useState<AlignerRecord | null>(null);
  const [newRecordStart, setNewRecordStart] = useState('');
  const [newRecordEnd, setNewRecordEnd] = useState('');
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordNotes, setNewRecordNotes] = useState('');
  const [newRecordNurse, setNewRecordNurse] = useState('李护士');
  const [showRecordsPanel, setShowRecordsPanel] = useState(false);

  const weekCheckIns = useMemo(() => getWeekCheckIns(), [getWeekCheckIns]);
  const pendingRecords = useMemo(() => getPendingRecords(), [getPendingRecords]);

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

  const openReportDetail = useCallback((report: AbnormalReport) => {
    setSelectedReport(report);
    setShowPatientProfile(true);
  }, []);

  const handleAddRecord = useCallback(() => {
    if (!newRecordStart || !newRecordEnd || !newRecordDate) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    const start = parseInt(newRecordStart);
    const end = parseInt(newRecordEnd);
    if (isNaN(start) || isNaN(end) || start > end) {
      Taro.showToast({ title: '请填写正确的副数范围', icon: 'none' });
      return;
    }

    if (editingRecord) {
      updateRecord(editingRecord.id, {
        startAligner: start,
        endAligner: end,
        receiveDate: newRecordDate,
        notes: newRecordNotes || '请按医嘱佩戴，按时更换。保持口腔卫生，有问题及时联系诊所。',
        nurseName: newRecordNurse || '李护士'
      });
      Taro.showToast({ title: '已更新批次', icon: 'success' });
    } else {
      addRecord({
        startAligner: start,
        endAligner: end,
        receiveDate: newRecordDate,
        notes: newRecordNotes || '请按医嘱佩戴，按时更换。保持口腔卫生，有问题及时联系诊所。',
        nurseName: newRecordNurse || '李护士'
      });
      Taro.showToast({ title: `已添加第${start}-${end}副`, icon: 'success' });
    }

    setShowAddRecord(false);
    setEditingRecord(null);
    setNewRecordStart('');
    setNewRecordEnd('');
    setNewRecordDate('');
    setNewRecordNotes('');
    setNewRecordNurse('李护士');
  }, [newRecordStart, newRecordEnd, newRecordDate, newRecordNotes, newRecordNurse, addRecord, updateRecord, editingRecord]);

  const handleQuickAddNext = useCallback(() => {
    const lastRecord = [...records].sort((a, b) => b.endAligner - a.endAligner)[0];
    const nextStart = lastRecord ? lastRecord.endAligner + 1 : (currentStatus?.currentAligner || 1);
    const nextEnd = nextStart + 5;
    const today = new Date();
    today.setDate(today.getDate() + 14);
    const nextDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    setEditingRecord(null);
    setNewRecordStart(String(nextStart));
    setNewRecordEnd(String(nextEnd));
    setNewRecordDate(nextDate);
    setNewRecordNotes('');
    setNewRecordNurse('李护士');
    setShowAddRecord(true);
  }, [records, currentStatus]);

  const handleEditRecord = useCallback((record: AlignerRecord) => {
    setEditingRecord(record);
    setNewRecordStart(String(record.startAligner));
    setNewRecordEnd(String(record.endAligner));
    setNewRecordDate(record.receiveDate);
    setNewRecordNotes(record.notes);
    setNewRecordNurse(record.nurseName);
    setShowAddRecord(true);
  }, []);

  const handleDeleteRecord = useCallback((record: AlignerRecord) => {
    if (record.confirmed) {
      Taro.showToast({ title: '已确认的批次不能删除', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认删除',
      content: `删除第${record.startAligner}-${record.endAligner}副领取批次？患者端将不再显示。`,
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          deleteRecord(record.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }, [deleteRecord]);

  const getFilterLabel = (key: FilterType): string => {
    const map: Record<FilterType, string> = { all: '全部', pending: '待处理', reviewed: '已查看', resolved: '已解决' };
    return map[key];
  };

  const getFilterCount = (key: FilterType): number => stats[key];

  const checkedInDays = weekCheckIns.filter(c => c.isChecked).length;
  const issueDays = weekCheckIns.filter(c => c.hasIssue).length;

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
        <Button className={styles.toolBtn} onClick={() => setShowRecordsPanel(true)}>
          📋 管理批次
        </Button>
        <Button className={styles.toolBtn} onClick={() => setShowPatientProfile(true)}>
          👤 患者档案
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
            <View key={report.id} className={styles.reportCard} onClick={() => openReportDetail(report)}>
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
                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(report); }}
                >
                  更新状态+备注
                </Button>
                {report.status === 'pending' && (
                  <Button
                    className={styles.quickBtn}
                    onClick={(e) => { e.stopPropagation(); handleQuickReview(report); }}
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
        <View className={styles.modalMask} onClick={() => { setEditingReport(null); setTargetStatus(null); }}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>更新处理状态</Text>
            <Text className={styles.modalSubtitle}>
              将状态从「{getStatusLabel(editingReport.status)}」更新为「{getStatusLabel(targetStatus)}」
            </Text>

            <Text className={styles.inputLabel}>处理意见（患者端可见）</Text>
            <Textarea
              className={styles.modalTextarea}
              value={handlerNote}
              onInput={(e) => setHandlerNote(e.detail.value)}
              placeholder="请输入处理意见或回复内容"
              maxlength={200}
              autoHeight
            />

            <View className={styles.quickNotes}>
              <Text className={styles.quickNoteTag} onClick={() => setHandlerNote('已收到您的反馈，客服正在处理中，会尽快联系您')}>已收到，处理中</Text>
              <Text className={styles.quickNoteTag} onClick={() => setHandlerNote('已安排复诊，请按预约时间到诊所检查')}>安排复诊</Text>
              <Text className={styles.quickNoteTag} onClick={() => setHandlerNote('已电话沟通，问题已解决，继续观察')}>已电话解决</Text>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => { setEditingReport(null); setTargetStatus(null); }}>取消</Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmUpdate}>确认更新</Button>
            </View>
          </View>
        </View>
      )}

      {showAddRecord && (
        <View className={styles.modalMask} onClick={() => { setShowAddRecord(false); setEditingRecord(null); }}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>{editingRecord ? '编辑领取批次' : '诊所新增领取批次'}</Text>
            <Text className={styles.modalSubtitle}>
              {editingRecord ? '修改后患者端会同步更新首页和领取记录' : '患者将在领取记录和首页看到新的领取信息'}
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
              <Button className={styles.cancelBtn} onClick={() => { setShowAddRecord(false); setEditingRecord(null); }}>取消</Button>
              <Button className={styles.confirmBtn} onClick={handleAddRecord}>
                {editingRecord ? '保存修改' : '确认新增'}
              </Button>
            </View>
          </View>
        </View>
      )}

      {showRecordsPanel && (
        <View className={styles.modalMask} onClick={() => setShowRecordsPanel(false)}>
          <View className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>📋 领取批次管理</Text>
            <Text className={styles.modalSubtitle}>点击批次可编辑，未确认批次可撤回删除</Text>

            <ScrollView scrollY style={{ maxHeight: '500rpx', marginVertical: '24rpx' }}>
              {records.length === 0 ? (
                <View style={{ textAlign: 'center', padding: '48rpx 0', color: '#A0A0A0' }}>暂无批次</View>
              ) : (
                records.slice().sort((a, b) => a.startAligner - b.startAligner).map((r) => {
                  const daysLeft = getDaysUntil(r.receiveDate);
                  return (
                    <View key={r.id} className={styles.recordRow}>
                      <View className={styles.recordRowMain}>
                        <Text className={styles.recordRowTitle}>
                          第{r.startAligner}-{r.endAligner}副
                          {r.confirmed
                            ? <Text style={{ color: '#00B894', marginLeft: '12rpx', fontSize: '22rpx' }}>（已确认）</Text>
                            : <Text style={{ color: '#FF9F43', marginLeft: '12rpx', fontSize: '22rpx' }}>（待领取）</Text>
                          }
                        </Text>
                        <Text className={styles.recordRowMeta}>
                          📅 {formatDate(r.receiveDate)}
                          {daysLeft >= 0 && ` · ${daysLeft}天后`}
                          {daysLeft < 0 && ` · 已逾期${Math.abs(daysLeft)}天`}
                          {r.nurseName && ` · ${r.nurseName}`}
                        </Text>
                      </View>
                      <View className={styles.recordRowActions}>
                        <Button
                          className={styles.rowEditBtn}
                          onClick={() => { setShowRecordsPanel(false); handleEditRecord(r); }}
                        >编辑</Button>
                        {!r.confirmed && (
                          <Button
                            className={styles.rowDeleteBtn}
                            onClick={() => handleDeleteRecord(r)}
                          >撤回</Button>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View className={styles.modalActions}>
              <Button className={styles.confirmBtn} onClick={() => setShowRecordsPanel(false)}>我知道了</Button>
            </View>
          </View>
        </View>
      )}

      {showPatientProfile && (
        <View className={styles.modalMask} onClick={() => { setShowPatientProfile(false); setSelectedReport(null); }}>
          <View className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <View className={styles.profileHeader}>
              <Text className={styles.modalTitle}>👤 患者小档案</Text>
              {selectedReport && (
                <Text className={styles.profileSubtitle}>关联异常：{getAbnormalLabel(selectedReport.type)}</Text>
              )}
            </View>

            <ScrollView scrollY style={{ maxHeight: '680rpx' }}>
              <View className={styles.profileSection}>
                <Text className={styles.profileSectionTitle}>📄 基本信息</Text>
                <View className={styles.profileInfoGrid}>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>患者姓名</Text>
                    <Text className={styles.profileInfoValue}>{patientCase?.patientName || '-'}</Text>
                  </View>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>就诊诊所</Text>
                    <Text className={styles.profileInfoValue}>{patientCase?.clinicName || '-'}</Text>
                  </View>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>家长联系方式</Text>
                    <Text className={styles.profileInfoValue}>{patientCase?.familyContact || '-'}</Text>
                  </View>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>绑定日期</Text>
                    <Text className={styles.profileInfoValue}>{patientCase?.bindingDate ? formatDate(patientCase.bindingDate) : '-'}</Text>
                  </View>
                </View>
              </View>

              <View className={styles.profileSection}>
                <Text className={styles.profileSectionTitle}>🦷 当前矫治</Text>
                <View className={styles.profileInfoGrid}>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>当前牙套</Text>
                    <Text className={styles.profileInfoValue} style={{ color: '#4CAF90', fontWeight: 600 }}>
                      第{currentStatus?.currentAligner || '-'}副 / 共{currentStatus?.totalAligners || patientCase?.totalAligners || '-'}副
                    </Text>
                  </View>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>每日佩戴</Text>
                    <Text className={styles.profileInfoValue}>{currentStatus?.dailyWearHours || 22}小时</Text>
                  </View>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>下次换副</Text>
                    <Text className={styles.profileInfoValue}>
                      {currentStatus?.changeDate ? formatDate(currentStatus.changeDate) : '-'}
                    </Text>
                  </View>
                  <View className={styles.profileInfoItem}>
                    <Text className={styles.profileInfoLabel}>下次领取</Text>
                    <Text className={styles.profileInfoValue}>
                      {currentStatus?.nextPickupDate
                        ? `${currentStatus.nextPickupAligners} · ${formatDate(currentStatus.nextPickupDate)}`
                        : '等待诊所安排'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              <View className={styles.profileSection}>
                <Text className={styles.profileSectionTitle}>📊 近7天打卡（{checkedInDays}/7天）</Text>
                <View className={styles.weekStatsRow}>
                  {weekCheckIns.length === 0 ? (
                    <Text style={{ color: '#A0A0A0', fontSize: '24rpx' }}>暂无打卡记录</Text>
                  ) : (
                    weekCheckIns.map((c) => {
                      const dayLabel = ['日', '一', '二', '三', '四', '五', '六'][new Date(c.date).getDay()];
                      return (
                        <View key={c.id} className={styles.weekDayItem}>
                          <Text className={styles.weekDayLabel}>周{dayLabel}</Text>
                          <View className={`${styles.weekDayDot} ${
                            c.isChecked
                              ? c.hasIssue ? styles.dotIssue : styles.dotOk
                              : styles.dotMiss
                          }`}></View>
                          <Text className={styles.weekDayAligner}>#{c.alignerNumber}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
                <View className={styles.weekStatsLabels}>
                  <Text style={{ fontSize: '22rpx', color: '#A0A0A0' }}>
                    ✅ 正常{checkedInDays - issueDays}天 &nbsp; ⚠️ 异常{issueDays}天 &nbsp; ⭕ 缺失{7 - checkedInDays}天
                  </Text>
                </View>
              </View>

              <View className={styles.profileSection}>
                <Text className={styles.profileSectionTitle}>🎁 待领取批次（{pendingRecords.length}批）</Text>
                {pendingRecords.length === 0 ? (
                  <Text style={{ color: '#A0A0A0', fontSize: '24rpx' }}>暂无待领取批次</Text>
                ) : (
                  pendingRecords.slice(0, 3).map((r) => (
                    <View key={r.id} className={styles.pendingRow}>
                      <Text className={styles.pendingTitle}>第{r.startAligner}-{r.endAligner}副</Text>
                      <Text className={styles.pendingDate}>📅 {formatDate(r.receiveDate)}</Text>
                    </View>
                  ))
                )}
              </View>

              {selectedReport && (
                <View className={styles.profileSection}>
                  <Text className={styles.profileSectionTitle}>
                    🎯 本次异常 - {getAbnormalLabel(selectedReport.type)}
                  </Text>
                  <View className={styles.linkedIssueBox}>
                    <Text style={{ fontSize: '26rpx', color: '#333', lineHeight: 1.6 }}>
                      {selectedReport.description}
                    </Text>
                    <View style={{ marginTop: '16rpx', display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: '22rpx', color: '#86909C' }}>
                        📅 {formatDate(selectedReport.reportDate)}
                      </Text>
                      <Text
                        style={{
                          fontSize: '22rpx',
                          color: getStatusColor(selectedReport.status),
                          fontWeight: 500
                        }}
                      >
                        {getStatusLabel(selectedReport.status)}
                      </Text>
                    </View>
                    {(selectedReport.contactName || selectedReport.contactPhone) && (
                      <Text style={{ marginTop: '8rpx', fontSize: '22rpx', color: '#86909C' }}>
                        📞 {selectedReport.contactName || ''} {selectedReport.contactPhone || ''}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            <View className={styles.modalActions}>
              <Button
                className={styles.cancelBtn}
                onClick={() => { setShowPatientProfile(false); setSelectedReport(null); }}
              >关闭</Button>
              {selectedReport && (
                <Button
                  className={styles.confirmBtn}
                  onClick={() => {
                    setShowPatientProfile(false);
                    handleUpdateStatus(selectedReport);
                  }}
                >去处理此异常</Button>
              )}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ServicePage;
