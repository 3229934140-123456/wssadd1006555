import React, { useEffect, useRef } from 'react';
import { useDidShow, useDidHide, getCurrentPages, switchTab, redirectTo } from '@tarojs/taro';
import './app.scss';
import { useAppStore } from './store';

function App(props) {
  const isBound = useAppStore(state => state.isBound);
  const refreshCurrentStatus = useAppStore(state => state.refreshCurrentStatus);
  const isRedirecting = useRef(false);

  const checkAndRedirect = useCallback(() => {
    if (isRedirecting.current) return;

    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage?.route || '';

    console.log('[App] 路由检查 - 当前路由:', currentRoute, '已绑定:', isBound, '页面栈长度:', pages.length);

    if (!isBound) {
      if (!currentRoute.includes('pages/bind')) {
        console.log('[App] 未绑定，重定向到绑定页');
        isRedirecting.current = true;
        redirectTo({
          url: '/pages/bind/index',
          complete: () => {
            setTimeout(() => { isRedirecting.current = false; }, 300);
          }
        });
      }
      return;
    }

    if (isBound && (currentRoute.includes('pages/bind') || currentRoute === '' || pages.length === 0)) {
      console.log('[App] 已绑定，跳转到首页日程');
      isRedirecting.current = true;
      switchTab({
        url: '/pages/home/index',
        complete: () => {
          setTimeout(() => { isRedirecting.current = false; }, 300);
        },
        fail: (err) => {
          console.log('[App] switchTab失败，改用redirectTo:', err);
          redirectTo({
            url: '/pages/home/index',
            complete: () => {
              setTimeout(() => { isRedirecting.current = false; }, 300);
            }
          });
        }
      });
    }
  }, [isBound]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndRedirect();
    }, 50);
    return () => clearTimeout(timer);
  }, [checkAndRedirect]);

  useDidShow(() => {
    isRedirecting.current = false;
    refreshCurrentStatus();
    setTimeout(() => {
      checkAndRedirect();
    }, 50);
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
