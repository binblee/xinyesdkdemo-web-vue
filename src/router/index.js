import { createRouter, createWebHistory } from 'vue-router'
import AppNavigator from '../components/AppNavigator.vue'
import VrmViewer from '../components/VrmViewer.vue'
import PrintView from '../components/PrintView.vue'
import XunfeiTtsDemo from '../components/XunfeiTtsDemo.vue'
import CameraTestDemo from '../components/CameraTestDemo.vue'
import MicrophoneTestDemo from '../components/MicrophoneTestDemo.vue'
import BarcodeReaderDemo from '../components/BarcodeReaderDemo.vue'
import VideoPlayerDemo from '../components/VideoPlayerDemo.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AppNavigator,
    meta: {
      title: '应用导航'
    }
  },
  {
    path: '/vrm',
    name: 'VrmViewer',
    component: VrmViewer,
    meta: {
      title: 'VRM 3D模型查看器'
    }
  },
  {
    path: '/print',
    name: 'PrintView',
    component: PrintView,
    meta: {
      title: '打印功能演示'
    }
  },
  {
    path: '/tts',
    name: 'XunfeiTts',
    component: XunfeiTtsDemo,
    meta: {
      title: '讯飞语音合成'
    }
  },
  {
    path: '/camera',
    name: 'CameraTest',
    component: CameraTestDemo,
    meta: {
      title: '摄像头测试'
    }
  },
  {
    path: '/microphone',
    name: 'MicrophoneTest',
    component: MicrophoneTestDemo,
    meta: {
      title: '麦克风测试'
    }
  },
  {
    path: '/barcode',
    name: 'BarcodeReader',
    component: BarcodeReaderDemo,
    meta: {
      title: '条码扫描器'
    }
  },
  {
    path: '/video',
    name: 'VideoPlayer',
    component: VideoPlayerDemo,
    meta: {
      title: '视频播放器'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Update document title based on route meta
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
