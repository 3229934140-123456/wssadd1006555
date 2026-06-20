import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow, useDidHide, getCurrentPages, switchTab, redirectTo } from '@tarojs/taro';
import './app.scss';
import { useAppStore } from './store';

function App(props) {
  const isBound = useAppStore(state => state.isBound);
  const refreshCurrentStatus = useAppStore(state => state.refreshCurrentStatus);
  const isRedirecting = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const checkAndRedirect = useCallback(() => {
    if (isRedirecting.current) return;
    if (!hydrated) return;

    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = (currentPage?.route || '').toLowerCase();

    console.log('[App] 路由检查:', { route: currentRoute, isBound, pagesLen: pages.length });

    if (!isBound) {
      if (!currentRoute.includes('pages/bind')) {
        console.log('[App] → 跳转绑定页');
        isRedirecting.current = true;
        redirectTo({
          url: '/pages/bind/index',
          complete: () => setTimeout(() => { isRedirecting.current = false; }, 400),
          fail: () => setTimeout(() => { isRedirecting.current = false; }, 400)
        });
      }
      return;
    }

    if (currentRoute.includes('pages/bind') || currentRoute === '' || pages.length === 0) {
      console.log('[App] → 跳转首页日程');
      isRedirecting.current = true;
      switchTab({
        url: '/pages/home/index',
        complete: () => setTimeout(() => { isRedirecting.current = false; }, 400),
        fail: () => {
          redirectTo({
            url: '/pages/home/index',
            complete: () => setTimeout(() => { isRedirecting.current = false; }, 400),
            fail: () => setTimeout(() => { isRedirecting.current = false; }, 400)
          });
        }
      });
    }
  }, [isBound, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(checkAndRedirect, 60);
    return () => clearTimeout(timer);
  }, [checkAndRedirect, hydrated]);

  useDidShow(() => {
    isRedirecting.current = false;
    try { refreshCurrentStatus(); } catch (e) { /* ignore */ }
    setTimeout(() => { if (hydrated) checkAndRedirect(); }, 80);
  });

  useDidHide(() => {});

  if (!hydrated) {
    return (
      <View style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F7FA', zIndex: 9999
      }}>
        <View style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '56rpx' }}>🦷</Text>
          <Text style={{ fontSize: '28rpx', color: '#A0A0A0', marginTop: '16rpx', display: 'block' }}>正在加载...</Text>
        </View>
      </View>
    );
  }

  return props.children;
}

export default App;
