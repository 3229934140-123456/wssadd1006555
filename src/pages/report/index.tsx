import React, { useState, useCallback } from 'react';
import { View, Text, Button, Textarea, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { abnormalTypeList } from '@/data/mock';
import { formatDate, getAbnormalLabel, getStatusLabel, getStatusColor } from '@/utils';
import type { AbnormalType, AbnormalReport } from '@/types';

const ReportPage: React.FC = () => {
  const {
    patientCase,
    reports,
    addReport,
    updateReportStatus
  } = useAppStore();

  const [selectedType, setSelectedType] = useState<AbnormalType | null>(null);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState(patientCase?.isTeenager ? '妈妈' : '');
  const [contactPhone, setContactPhone] = useState('');

  const handleSelectType = useCallback((type: AbnormalType) => {
    setSelectedType(type);
  }, []);

  const handleDescriptionChange = useCallback((e: any) => {
    setDescription(e.detail.value);
  }, []);

  const handleContactNameChange = useCallback((e: any) => {
    setContactName(e.detail.value);
  }, []);

  const handleContactPhoneChange = useCallback((e: any) => {
    setContactPhone(e.detail.value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedType) {
      Taro.showToast({
        title: '请选择问题类型',
        icon: 'none'
      });
      return;
    }
    if (!description.trim()) {
      Taro.showToast({
        title: '请简单描述一下情况',
        icon: 'none'
      });
      return;
    }

    Taro.showModal({
      title: '确认提交',
      content: '提交后诊所客服会尽快与您联系，请保持电话畅通~',
      confirmText: '确认提交',
      confirmColor: '#4CAF90',
      success: (res) => {
        if (res.confirm) {
          addReport({
            type: selectedType,
            description: description.trim(),
            contactName: contactName || undefined,
            contactPhone: contactPhone || undefined
          });
          setSelectedType(null);
          setDescription('');
          setContactPhone('');
          Taro.showToast({
            title: '提交成功！我们会尽快处理',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  }, [selectedType, description, contactName, contactPhone, addReport]);

  const handleUpdateStatus = useCallback((report: AbnormalReport) => {
    const statusList = [
      { value: 'pending', label: '待处理' },
      { value: 'reviewed', label: '已查看' },
      { value: 'resolved', label: '已解决' }
    ];

    Taro.showActionSheet({
      itemList: statusList.map(s => `${s.label}${report.status === s.value ? '（当前）' : ''}`),
      success: (res) => {
        const newStatus = statusList[res.tapIndex].value as 'pending' | 'reviewed' | 'resolved';
        updateReportStatus(report.id, newStatus);
        Taro.showToast({
          title: `状态已更新为：${statusList[res.tapIndex].label}`,
          icon: 'success'
        });
      }
    });
  }, [updateReportStatus]);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (!patientCase) {
    return null;
  }

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.tipsCard}>
        <Text className={styles.tipsTitle}>💡 有问题？别担心</Text>
        <Text className={styles.tipsContent}>
          {'\n'}遇到任何情况都可以告诉我们，诊所客服看到后会第一时间联系您。如果情况紧急，也可以直接拨打诊所电话哦~
        </Text>
      </View>

      {pendingCount > 0 && (
        <View className={styles.pendingNotice} onClick={() => {
          Taro.navigateTo({ url: '/pages/service/index' });
        }}>
          <Text style={{ fontSize: '28rpx', color: '#fff' }}>
            🔔 有 {pendingCount} 条待客服处理
          </Text>
          <Text style={{ fontSize: '24rpx', color: 'rgba(255,255,255,0.8)' }}>
            （点击进入客服视图）
          </Text>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>遇到了什么问题？</Text>
        <View className={styles.typeList}>
          {abnormalTypeList.map((item) => (
            <View
              key={item.type}
              className={`${styles.typeItem} ${selectedType === item.type ? styles.selected : ''}`}
              onClick={() => handleSelectType(item.type)}
            >
              <View className={styles.typeCheck}>
                {selectedType === item.type && <Text className={styles.checkIcon}>✓</Text>}
              </View>
              <View className={styles.typeContent}>
                <Text className={styles.typeLabel}>{item.label}</Text>
                <Text className={styles.typeDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.formCard}>
          <Text className={styles.formLabel}>简单描述一下情况（有助于我们更快了解）</Text>
          <Textarea
            className={styles.textarea}
            placeholder="比如：吃饭时左下后牙有点痛，已经持续2天了..."
            maxlength={500}
            value={description}
            onInput={handleDescriptionChange}
          />
          <Text className={styles.charCount}>{description.length}/500</Text>

          <View className={styles.contactRow}>
            <View className={styles.contactItem}>
              <Text className={styles.formLabel}>联系人</Text>
              <Input
                className={styles.contactInput}
                placeholder="您的称呼"
                value={contactName}
                onInput={handleContactNameChange}
              />
            </View>
            <View className={styles.contactItem}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Input
                className={styles.contactInput}
                type="number"
                placeholder="方便联系的号码"
                value={contactPhone}
                onInput={handleContactPhoneChange}
              />
            </View>
          </View>

          <Button
            className={`${styles.submitBtn} ${!selectedType ? styles.disabled : ''}`}
            onClick={handleSubmit}
          >
            提交给诊所客服
          </Button>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.historyTitle}>
          <Text className={styles.sectionTitle}>历史上报记录</Text>
          <Text style={{ fontSize: '24rpx', color: '#86909C' }}>共{reports.length}条</Text>
        </View>
        {reports.length === 0 ? (
          <View style={{ textAlign: 'center', padding: '64rpx 0', color: '#A0A0A0', fontSize: '28rpx' }}>
            暂无上报记录
          </View>
        ) : (
          <View className={styles.historyList}>
            {reports.map((report) => (
              <View
                key={report.id}
                className={styles.historyItem}
              >
                <View className={styles.historyHeader}>
                  <Text className={styles.historyType}>{getAbnormalLabel(report.type)}</Text>
                  <Text
                    className={styles.statusBadge}
                    style={{
                      background: getStatusColor(report.status) + '20',
                      color: getStatusColor(report.status)
                    }}
                  >
                    {getStatusLabel(report.status)}
                  </Text>
                </View>
                <Text className={styles.historyDesc}>{report.description}</Text>
                {(report.contactName || report.contactPhone) && (
                  <Text className={styles.historyDate}>
                    {formatDate(report.reportDate)}
                    {report.contactName ? ` · ${report.contactName}` : ''}
                    {report.contactPhone ? ` · ${report.contactPhone}` : ''}
                  </Text>
                )}
                {!report.contactName && !report.contactPhone && (
                  <Text className={styles.historyDate}>
                    {formatDate(report.reportDate)}
                  </Text>
                )}
                {report.handlerNote && (
                  <View className={styles.handlerNote}>
                    <Text className={styles.handlerLabel}>
                      💬 {report.handlerName || '诊所客服'} · {report.handledDate ? formatDate(report.handledDate) : ''}
                    </Text>
                    <Text className={styles.handlerContent}>{report.handlerNote}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        {reports.length > 0 && (
          <Button
            className={styles.staffViewBtn}
            onClick={() => {
              Taro.navigateTo({ url: '/pages/service/index' });
            }}
          >
            🏥 进入诊所客服视图
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default ReportPage;
