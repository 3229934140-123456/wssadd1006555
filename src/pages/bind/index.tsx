import React, { useState, useCallback } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils';

const BindPage: React.FC = () => {
  const [bindCode, setBindCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { isBound, patientCase, bindCase, unbind } = useAppStore();

  const handleInputChange = useCallback((e: any) => {
    const value = e.detail.value?.toUpperCase() || '';
    setBindCode(value.replace(/\s/g, ''));
  }, []);

  const handleScan = useCallback(() => {
    Taro.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const result = res.result || '';
        setBindCode(result.toUpperCase().slice(0, 12));
        console.log('[BindPage] 扫码结果:', result);
      },
      fail: (err) => {
        console.error('[BindPage] 扫码失败:', err);
        Taro.showToast({
          title: '扫码失败，请手动输入',
          icon: 'none'
        });
      }
    });
  }, []);

  const handleBind = useCallback(async () => {
    if (!bindCode || bindCode.length < 6) {
      Taro.showToast({
        title: '请输入有效的绑定码',
        icon: 'none'
      });
      return;
    }

    setLoading(true);
    try {
      const success = await bindCase(bindCode);
      if (success) {
        Taro.showToast({
          title: '绑定成功！',
          icon: 'success',
          duration: 1200
        });
        setTimeout(() => {
          Taro.switchTab({
            url: '/pages/home/index',
            fail: () => {
              Taro.redirectTo({ url: '/pages/home/index' });
            }
          });
        }, 1200);
      } else {
        Taro.showToast({
          title: '绑定码无效，请检查后重试',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('[BindPage] 绑定失败:', err);
      Taro.showToast({
        title: '绑定失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  }, [bindCode, bindCase]);

  const handleUnbind = useCallback(() => {
    Taro.showModal({
      title: '确认解绑',
      content: '解绑后所有数据将被清除，确定要解绑吗？',
      confirmText: '确认解绑',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          unbind();
          Taro.showToast({
            title: '已解绑',
            icon: 'success'
          });
        }
      }
    });
  }, [unbind]);

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <View className={styles.logoArea}>🦷</View>
        <Text className={styles.title}>矫治小助手</Text>
        <Text className={styles.subtitle}>隐形矫治·贴心陪伴</Text>
      </View>

      <View className={styles.main}>
        <View className={styles.card}>
          {isBound && patientCase ? (
            <>
              <View className={styles.boundCard}>
                <Text className={styles.boundInfo}>
                  ✅ 已绑定病例，信息如下：{'\n\n'}
                  患者姓名：<strong>{patientCase.patientName}</strong>{'\n'}
                  就诊诊所：<strong>{patientCase.clinicName}</strong>{'\n'}
                  绑定日期：<strong>{formatDate(patientCase.bindingDate)}</strong>{'\n'}
                  牙套总数：<strong>{patientCase.totalAligners}副</strong>
                </Text>
              </View>
              <Button
                className={styles.submitBtn}
                onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
              >
                进入首页
              </Button>
              <Button className={styles.unbindBtn} onClick={handleUnbind}>
                解绑病例
              </Button>
            </>
          ) : (
            <>
              <View className={styles.tips}>
                <View className={styles.tipsIcon}>🏥</View>
                <Text className={styles.tipsText}>
                  请扫描诊所提供的{'\n'}
                  <span>病例二维码</span>{'\n'}
                  或手动输入绑定码
                </Text>
              </View>

              <View className={styles.divider}>
                <Text className={styles.dividerText}>扫码或输入</Text>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>绑定码</Text>
                <View className={styles.inputWrapper}>
                  <Input
                    className={styles.input}
                    placeholder="请输入绑定码"
                    maxlength={12}
                    value={bindCode}
                    onInput={handleInputChange}
                  />
                  <Button className={styles.scanBtn} onClick={handleScan}>
                    扫码
                  </Button>
                </View>
              </View>

              <Button
                className={`${styles.submitBtn} ${!bindCode ? styles.disabled : ''}`}
                onClick={handleBind}
                disabled={loading || !bindCode}
              >
                {loading ? '绑定中...' : '绑定病例'}
              </Button>

              <View className={styles.demoTip}>
                <Text className={styles.demoText}>
                  💡 演示提示：任意输入6位以上字符即可完成绑定
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {loading && (
        <View className={styles.loadingMask}>
          <View className={styles.loadingContent}>
            <Text style={{ fontSize: '48rpx' }}>⏳</Text>
            <Text className={styles.loadingText}>正在绑定...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BindPage;
