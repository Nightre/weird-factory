<script setup lang="ts">
import { useUserStore, type UserInfo } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { ref, onMounted, reactive } from 'vue';
import loagoImage from '@/assets/favicon2.svg'
import loagoImage2 from '@/assets/favicon.svg'
import { useJoinRoom } from '@/utils/join-room';
import JoinRoomModel from '@/components/joinRoom.vue';
import { axios } from '@/utils/axios';
import { useModal } from 'vuestic-ui';
import type { IPaggin, IRoomList } from '@/stores/game';
import type { ILevelData } from '@/stores/game';
import ListShow from '@/components/listShwo.vue';
import LevelCard from '@/components/levelCard.vue';

const router = useRouter()

const store = useUserStore()
const { isLogin } = storeToRefs(store)
const { logout } = store

const onLogoutClick = () => {
  router.push('/')
  logout()
}
const { joinRoom } = useJoinRoom()
const isShowRoomModel = ref(false)
const showRoomModel = () => {
  isShowRoomModel.value = true
}
const singleGame = () => {
  joinRoom({
    public: false,
    create: true,
    roomId: ''
  })
}
const discoverNum = ref(0)
const selfDiscoverNum = ref(0)
const isLoading = ref(false)
const roomList = ref<IRoomList[]>([])
const levelList = ref<IPaggin<ILevelData>>({
  page: 0,
  limit: 10,
  total: 0,
  data: []
})
const refreshRoomList = () => {
  isLoading.value = true
  axios.get('/game/room_list').then((res) => {
    roomList.value = res.data.data
    isLoading.value = false
  })
}
onMounted(() => {
  axios.get('/discover_num').then((res) => {
    discoverNum.value = res.data.data.num
    selfDiscoverNum.value = res.data.data.self_num
  })
  axios.get('/levels/search', {
    params: {
      limit: 4
    }
  }).then((res) => {
    levelList.value = res.data.data
  })
  refreshRoomList()
})
</script>

<template>
  <joinRoomModel v-model:show="isShowRoomModel" />
  <div class="content">
    <div class="card" style="grid-row: span 2;">
      <div class="card-header game-header">
        <VaButton style="grid-row: span 2;" @click="singleGame()">
          开始游戏
        </VaButton>
        <VaButton color="#ffd166" textColor="#000" @click="showRoomModel()">
          多人联机
        </VaButton>
        <VaButton color="success" to="help">
          教程 / 关于
        </VaButton>
      </div>
      <!-- <div style="height: 1px; background-color: #ccc;"></div> -->
      <div class="card-body">
        <div style="justify-content: space-between;align-items: center;display: flex;margin-bottom: 0.5rem;">
          <h1>
            <VaIcon name="public" /> 在线房间
            <span style="color: #888;font-size: 1rem;">({{ roomList.length }})</span>
          </h1>
          <VaButton :loading="isLoading" color="secondary" size="small" @click="refreshRoomList()">
            刷新
          </VaButton>
        </div>
        <div class="room-list">
          <ListShow :data="roomList">
            <div class="room-card" v-for="room in roomList" :key="room.roomId">
              <div>
                <p style="font-size: 1.4rem;">{{ room.playerName }}</p>
                <p style="color: #888;">房间人数：{{ room.playerCount }} 人</p>
              </div>
              <VaButton color="#888" style="width: 2.4rem;" @click="joinRoom({ roomId: room.roomId, create: false })">
                <VaIcon name="play_arrow" />
              </VaButton>
            </div>
          </ListShow>
        </div>

      </div>
      <div class="card-footer">
        <p>温馨提示：友好相处，文明联机，请勿作弊。</p>
      </div>
    </div>
    <div class="card">
      <div class="card-header flex-between">
        <h1>
          <VaIcon name="person" /> 用户
        </h1>
        <VaButton color="secondary" size="small" @click="onLogoutClick" preset="secondary">
          登出
        </VaButton>
      </div>
      <div class="card-body">
        <p style="font-size: 1.8rem;">
          {{ (store.userInfo as UserInfo).name }}
          <span style="color: #888;font-size: 1rem;">共发现了 {{ selfDiscoverNum }} 个物品</span>
        </p>
      </div>
    </div>
    <div class="card">
      <div class="card-header flex-between">
        <h1>
          <VaIcon name="extension" /> 关卡公园
        </h1>
        <VaButton color="secondary" size="small" to="/searchLevels" preset="secondary">
          更多
        </VaButton>
      </div>
      <div class="card-body">
        <div class="level-list">
          <ListShow :data="levelList.data">
            <div v-for="item in levelList.data" :key="item.id" class="flex-col" style="gap: 0.5rem;">
              <LevelCard :data="item" />
            </div>
          </ListShow>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 0.5rem;
  position: fixed;

  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  width: calc(100vw - 6rem);
  height: calc(100vh - 3rem);
}

@media (min-height: 500px) {
  .content {
    width: 90vw;
    height: 90vh;
  }
}

@media (min-width: 1300px) {
  .content {
    width: 60vw;
    height: 60vh;
  }
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-button {
  background-color: #ccc;
  border: none;
  padding: 0.3rem;
  border-radius: 0.3rem;
}

.room-card {
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 0.3rem;
  border: 1px solid #ccc;
  display: flex;
  justify-content: space-between;
}

.game-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.room-list {
  overflow-y: auto;

  gap: 0.5rem;
  border: 1px solid #ccc;
  padding: 0.5rem;
  border-radius: 0.3rem;
  background-color: #fefefe;
  flex: 1;
}

.level-list {
  overflow-y: auto;

  gap: 0.5rem;
  border: 1px solid #ccc;
  padding: 0.5rem;
  border-radius: 0.3rem;
  background-color: #fefefe;
  flex: 1;
}

.card-footer {
  padding: 0.5rem;
  background-color: #f5f5f5;
  color: #888;
}
</style>