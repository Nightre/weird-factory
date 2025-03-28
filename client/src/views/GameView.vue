<template>
    <div>
        <template v-for="(config, key) in stateConfigs" :key="key">
            <div v-if="state == key" class="abs-center" style="text-align: center;">
                <h3>{{ config.title }}</h3>
                <p>{{ config.desc }}</p>
                <va-progress-circle v-if="config.loading" indeterminate />
                <button v-if="config.showBack" class="vuestic-button" @click="backToHome">返回主页</button>
            </div>
        </template>
        <div v-if="state == STATE.GAME">
            <main-game></main-game>
        </div>
    </div>
</template>

<style scoped>
.abs-center {
    position: absolute;
    left: 50vw;
    top: 50vh;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.vuestic-button {
    margin-top: 20px;
    padding: 8px 16px;
    background: #2c82e0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.vuestic-button:hover {
    background: #1e6abc;
}
</style>

<script setup lang="ts">
import { addRemoteMid, STATE, useGameStore } from '@/stores/game';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vuestic-ui';
import mainGame from '@/components/mainGame.vue';
import { storeToRefs } from 'pinia';
import { create, reset } from '@/game/game';
import { onMounted, watch, reactive } from 'vue';
import { useJoinRoom } from '@/utils/join-room';

const store = useGameStore()
const router = useRouter()
const { state } = storeToRefs(store)

const stateConfigs = reactive({
    [STATE.ERROR]: {
        title: '加入失败',
        desc: '请登录后重试',
        showBack: true,
        loading: false
    },
    [STATE.LOCAKED]: {
        title: '加入失败',
        desc: '房间不存在或隐藏',
        showBack: true,
        loading: false
    },
    [STATE.LOADING_ROOM]: {
        title: '载入中...',
        desc: '正在加载房间信息',
        loading: true,
        showBack: false
    },
    [STATE.LOADING]: {
        title: '载入中...',
        desc: '正在连接服务器',
        loading: true,
        showBack: false
    },
    [STATE.DISCONNECT]: {
        title: '断开连接',
        desc: '与服务器断开连接',
        showBack: true,
        loading: false
    }
})

const backToHome = () => {
    reset()
    router.push('/home')
}

onMounted(() => {
    useJoinRoom().loadFromQuery()
    addRemoteMid()
    create(store.gameCreateData)
})
</script>