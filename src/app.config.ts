export default defineAppConfig({
  pages: [
    'pages/bind/index',
    'pages/home/index',
    'pages/report/index',
    'pages/records/index',
    'pages/checkin-detail/index',
    'pages/service/index',
    'pages/family-reminders/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4CAF90',
    navigationBarTitleText: '矫治小助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7F6'
  },
  tabBar: {
    color: '#7F8C8D',
    selectedColor: '#4CAF90',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页日程'
      },
      {
        pagePath: 'pages/report/index',
        text: '异常上报'
      },
      {
        pagePath: 'pages/records/index',
        text: '领取记录'
      }
    ]
  }
})
