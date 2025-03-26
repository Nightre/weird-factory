<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { ref, onMounted } from 'vue';
import loagoImage from '@/assets/favicon2.svg'
import loagoImage2 from '@/assets/favicon.svg'
import { useJoinRoom } from '@/utils/join-room';
import JoinRoom from '@/components/joinRoom.vue';
import { axios } from '@/utils/axios';
import { useModal } from 'vuestic-ui';
const router = useRouter()

const store = useUserStore()
const { isLogin } = storeToRefs(store)
const { logout } = store

const onloginClick = () => {
  router.push('/login')
}

const checkVersion = () => {
  //if (true) { //JSON.parse(import.meta.env.VITE_CHECK_VERSION)
  isCheckingVersion.value = true
  axios.get('/version').then(res => {
    if (res.data.data !== import.meta.env.VITE_GAME_VERSION) {
      confirm({
        message: `检测到最新版本, 最新版本:${res.data.data}`,
        title: '更新提示',
        okText: "更新",
        cancelText: "取消",
        onOk: () => {
          window.open(import.meta.env.VITE_DOWNLOAD_URL, '_blank')
        }
      })
      error.value = `请更新新版本后开始, 最新版本:${res.data.data}`
    } else {
      isCheckingVersion.value = false
      isLogin.value && router.push('/home')
    }
  }).catch(() => {
    error.value = `无网络，无法开始游戏。`
  })
  //}
}
const { confirm } = useModal()
const isCheckingVersion = ref(true)
const error = ref<null | string>(null)
checkVersion()

</script>

<template>
  <div class="game-container">
    <div class="content">
      <div class="game-header">
        <div class="game-title-box">
          <img :src="loagoImage" alt="logo" width="100" height="100">
          <h1 class="game-title">奇想工厂</h1>
          <img :src="loagoImage2" alt="logo" width="100" height="100">

        </div>
        <p class="game-subtitle">Wonder Factory <span class="game-subtitle-badge">Alpha测试版</span></p>
      </div>
      <div v-if="error" class="error-box">
        <p>{{ error }}</p>
      </div>
      <div v-else-if="isCheckingVersion">
        <p>检查版本中...</p>
      </div>
      <div v-else-if="!isLogin" class="menu-box">
        <VaButton @click="onloginClick" class="menu-btn"> 登录 / 注册 </VaButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础布局 */
.game-container {
  width: 80%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  position: relative;
}

.game-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.4;
  z-index: 0;
}

.content {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: center
}

/* 页面标题部分 */
.game-header {
  text-align: center;
  margin-bottom: 2rem;
}

.game-title-box {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-title {
  font-size: clamp(3rem, 8vw, 5rem);
  background: linear-gradient(135deg, #a0a0a0, #7baffe);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
  font-weight: 800;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
  text-wrap: nowrap;
}

.game-subtitle {
  color: #333;
  font-size: clamp(1rem, 3vw, 1.5rem);
  margin-top: 0.5rem;
  opacity: 0.8;
  font-weight: 500;
}

.game-subtitle-badge {
  background-color: #0a0a0a17;
  color: #000;
  padding: 0.2rem 0.5rem;
  border-radius: 0.2rem;
  margin-left: 0.5rem;
}

/* 菜单按钮部分 */
.menu-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 280px;
  margin-top: 1.5rem;
}

.menu-btn {
  height: auto;
  padding: 0.8rem 0;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.menu-btn--private {
  background: linear-gradient(45deg, #ffd166, #ffb347);
}

.menu-btn--tutorial {
  background: linear-gradient(45deg, #06d6a0, #1b9aaa);
}

.menu-btn--logout {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
  box-shadow: none;
}

.btn-text {
  display: inline-block;
  padding: 0 0.5rem;
  font-size: 1.2rem;
}

/* 页脚 */
.game-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 1rem;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);
  z-index: 2;
}

/* 响应式设计 */
@media (max-height: 600px) {
  .content {
    margin: 1rem;
    padding: 1.5rem;
  }

  .game-title {
    font-size: 2.5rem;
  }

  .game-subtitle {
    font-size: 0.9rem;
  }

  .game-title-box {
    gap: 0.5rem;
  }

  .game-title-box img {
    width: 60px;
    height: 60px;
  }

  .menu-box {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 320px;
    justify-content: center;
  }

  .menu-btn {
    width: calc(50% - 0.5rem);
    min-width: 120px;
    padding: 0.7rem 0;
  }

  .btn-text {
    font-size: 1rem;
  }
}
</style>