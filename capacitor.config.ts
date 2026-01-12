import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dengyi.olafplanner',
  appName: 'Olaf tourism planner',
  webDir: 'out', // Next.js 輸出目錄（如果使用靜態輸出）
  server: {
    url: 'https://www.ihaveatree.shop', // 直接使用線上網站
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f5f5dc',
    },
  },
};

export default config;