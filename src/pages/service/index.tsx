import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate, getAbnormalLabel, getIssueIcon, getStatusLabel, getStatusColor } from '@/utils';
import type { AbnormalReport } from '@/types';

type FilterType = 'all' | 'pending' | 'reviewed' | 'resolved';

const ServicePage: React.FC = () => {
  const { reports, updateReportStatus, patientCase } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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
      itemList: statusList.map(s => s.label),
      success: (res) => {
        const newStatus = statusList[res.tapIndex].value;
        updateReportStatus(report.id, newStatus);
        Taro.showToast({
          title: `已更新为${statusList[res.tapIndex].label}`,
          icon: 'success'
        });
      }
    });
  }, [updateReportStatus]);

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
          {patientCase?.clinicName || '微笑口腔诊所'} · 患者异常上报管理
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

              <View className={styles.reportActions}>
                <Button
                  className={styles.actionBtn}
                  onClick={() => handleUpdateStatus(report)}
                >
                  更新处理状态
                </Button>
                {report.status === 'pending' && (
                  <Button
                    className={styles.quickBtn}
                    onClick={() => {
                      updateReportStatus(report.id, 'reviewed');
                      Taro.showToast({ title: '已标记为已查看', icon: 'success' });
                    }}
                  >
                    快速查看
                  </Button>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default ServicePage;
