import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Olaf tourism planner',
    short_name: 'Olaf planner',
    description: '結合 AI 智能排程、地圖整合與記帳管理的旅遊規劃工具',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5dc',
    theme_color: '#f5f5dc',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}

