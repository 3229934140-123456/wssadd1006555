import React, { useEffect, useRef } from 'react';
import { useDidShow, useDidHide, getCurrentPages, redirectTo } from '@tarojs/taro';
import './app.scss';
import { useAppStore } from './store';

function App(props) {
  const isBound = useAppStore(state => state.isBound);
  const refreshCurrentStatus = useAppStore(state => state.refreshCurrentStatus);
  const hasCheckedRoute = useRef(false);

  useEffect(() => {
    checkRoute();
  }, [isBound]);

  useDidShow(() => {
    hasCheckedRoute.current = false;
    refreshCurrentStatus();
    checkRoute();
  });

  useDidHide(() => {});

  const checkRoute = () => {
    if (hasCheckedRoute.current) return;
    hasCheckedRoute.current = true;

    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage?.route || '';

    console.log('[App] 当前路由:', currentRoute, '已绑定:', isBound);

    if (!isBound && !currentRoute.includes('pages/bind')) {
      redirectTo({
        url: '/pages/bind/index'
      });
    } else if (isBound && currentRoute.includes('pages/bind')) {
      const timer = setTimeout(() => {
        redirectTo({
          url: '/pages/home/index'
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  return props.children;
}

export default App;
