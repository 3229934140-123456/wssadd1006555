import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate, getAbnormalLabel, getIssueIcon } from '@/utils';
import type { AbnormalType } from '@/types';

const CheckInDetailPage: React.FC = () => {
  const router = useRouter();
  const checkInId = router.params?.id || '';

  const { getCheckInById, updateCheckInNote, addReport, currentStatus, patientCase } = useAppStore();
  const checkIn = getCheckInById(checkInId);

  const [note, setNote] = useState(checkIn?.note || '');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AbnormalType | null>(null);
  const [reportDesc, setReportDesc] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const handleSaveNote = useCallback(() => {
    if (!checkIn) return;
    updateCheckInNote(checkIn.id, note);
    Taro.showToast({
      title: '备注已保存',
      icon: 'success'
    });
  }, [checkIn, note, updateCheckInNote]);

  const handleOpenReport = useCallback((issue: AbnormalType) => {
    setSelectedIssue(issue);
    setReportDesc(checkIn?.note || '');
    setContactName(patientCase?.familyContact?.split(' ')[0] || '');
    setContactPhone('');
    setShowReportModal(true);
  }, [checkIn, patientCase]);

  const handleSubmitReport = useCallback(() => {
    if (!selectedIssue || !reportDesc.trim()) {
      Taro.showToast({
        title: '请填写问题描述',
        icon: 'none'
      });
      return;
    }

    addReport({
      type: selectedIssue,
      description: reportDesc,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined
    });

    setShowReportModal(false);
    setSelectedIssue(null);
    setReportDesc('');

    Taro.showToast({
      title: '已提交异常上报',
      icon: 'success'
    });

    setTimeout(() => {
      Taro.switchTab({
        url: '/pages/report/index'
      });
    }, 1500);
  }, [selectedIssue, reportDesc, contactName, contactPhone, addReport]);

  const issueList = useMemo(() => {
    if (!checkIn?.issues) return [];
    return checkIn.issues.map(type => ({
      type,
      label: getAbnormalLabel(type),
      icon: getIssueIcon(type)
    }));
  }, [checkIn]);

  if (!checkIn) {
    return (
      <View className={styles.container}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ fontSize: '32rpx', color: '#A0A0A0' }}>未找到打卡记录</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>打卡详情</Text>
        <Text className={styles.date}>{formatDate(checkIn.date)}</Text>
      </View>

      <View className={styles.card}>
        <View className={styles.cardHeader}>
          <Text className={styles.cardTitle}>基本信息</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>佩戴牙套</Text>
          <Text className={styles.infoValue}>第 {checkIn.alignerNumber} 副</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>佩戴时长</Text>
          <Text className={styles.infoValue}>约 {checkIn.wornHours} 小时</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>打卡状态</Text>
          <View>
            {checkIn.hasIssue ? (
              <Text className={styles.statusWarn}>已打卡 · 有异常记录</Text>
            ) : (
              <Text className={styles.statusOk}>已打卡 · 一切正常</Text>
            )}
          </View>
        </View>
      </View>

      {checkIn.hasIssue && issueList.length > 0 && (
        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>记录的异常情况</Text>
          </View>
          <View className={styles.issueList}>
            {issueList.map((item) => (
              <View key={item.type} className={styles.issueItem}>
                <View className={styles.issueIcon}>{item.icon}</View>
                <View className={styles.issueContent}>
                  <Text className={styles.issueLabel}>{item.label}</Text>
                </View>
                <Button
                  className={styles.issueAction}
                  onClick={() => handleOpenReport(item.type)}
                >
                  转异常上报
                </Button>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.card}>
        <View className={styles.cardHeader}>
          <Text className={styles.cardTitle}>补充说明</Text>
        </View>
        <Textarea
          className={styles.textarea}
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          placeholder="可以在这里补充描述当天的佩戴情况，比如哪里不舒服、戴了多久等等~"
          maxlength={500}
          autoHeight
        />
        <Button className={styles.saveBtn} onClick={handleSaveNote}>
          保存备注
        </Button>
      </View>

      {!checkIn.hasIssue && (
        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>需要补充上报问题？</Text>
          </View>
          <Text className={styles.tipText}>
            如果当天佩戴后发现有异常情况，可以在这里提交给诊所客服处理~
          </Text>
          <View className={styles.reportBtnGroup}>
            <Button className={styles.reportBtn} onClick={() => handleOpenReport('pain')}>
              😣 压痛明显
            </Button>
            <Button className={styles.reportBtn} onClick={() => handleOpenReport('lost')}>
              🎒 牙套丢失
            </Button>
            <Button className={styles.reportBtn} onClick={() => handleOpenReport('bracket')}>
              🔩 附件脱落
            </Button>
            <Button className={styles.reportBtn} onClick={() => handleOpenReport('broken')}>
              💔 牙套破损
            </Button>
          </View>
        </View>
      )}

      {showReportModal && (
        <View className={styles.modalMask}>
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>提交异常上报</Text>
            <Text className={styles.modalSubtitle}>
              问题类型：{selectedIssue && getAbnormalLabel(selectedIssue)}
            </Text>

            <Text className={styles.inputLabel}>详细描述</Text>
            <Textarea
              className={styles.modalTextarea}
              value={reportDesc}
              onInput={(e) => setReportDesc(e.detail.value)}
              placeholder="请详细描述一下您遇到的问题，方便诊所客服了解情况"
              maxlength={500}
              autoHeight
            />

            <Text className={styles.inputLabel}>联系人（可选）</Text>
            <View className={styles.inputRow}>
              <Text className={styles.inputIcon}>👤</Text>
              <input
                className={styles.textInput}
                value={contactName}
                onInput={(e) => setContactName(e.detail.value)}
                placeholder="请输入联系人姓名"
              />
            </View>

            <Text className={styles.inputLabel}>联系电话（可选）</Text>
            <View className={styles.inputRow}>
              <Text className={styles.inputIcon}>📞</Text>
              <input
                className={styles.textInput}
                type="number"
                value={contactPhone}
                onInput={(e) => setContactPhone(e.detail.value)}
                placeholder="请输入联系电话"
              />
            </View>

            <View className={styles.modalActions}>
              <Button
                className={styles.cancelBtn}
                onClick={() => setShowReportModal(false)}
              >
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleSubmitReport}>
                提交上报
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CheckInDetailPage;
