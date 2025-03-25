<template>
    <div class="game-side-info"
        :style="{ width: isCollapsed ? '0px' : '200px', overflowY: isCollapsed ? 'unset' : 'auto' }">
        <VaButton @click="toggleCollapse" :class="{ 'collapse': isCollapsed }" class="collapse-btn" icon="menu">
        </VaButton>
        <div class="game-side-info__header" v-show="!isCollapsed" style="padding:1rem;margin-top: 2.5rem;">
            <template v-if="playerItem">
                <h4>🧑{{ playerItem.showText }}</h4>
                <div v-for="key, item in playerItem.attributes" :key="key" class="attribute">
                    <span style="color: #8a8a8a;">{{ item }}</span>
                    <span>{{ key }}</span>
                </div>
                <p style="margin-top: 0.5rem;">{{ playerItem.reason }}</p>
            </template>
            <template v-if="store.currentItem">
                <h3 style="margin: 0.5rem 0;">当前物品</h3>
                {{ store.currentItem.info }}
                <div class="count" :style="{ backgroundColor: isFirst ? '#82e0aa' : '#f1948a' }">
                    <span v-if="isFirst">🏆只有你发现该物品</span>
                    <span v-else>已有 {{ store.currentItemInfo.discovedNum }} 人发现</span>
                </div>
                <p class="second-info">
                    <span class="second-info-item"> {{ store.currentItemInfo.firstCreater?.name }}</span>第一次在
                    <span class="second-info-item"> {{ store.currentItemInfo.createdAt }}</span>发现
                    <span class="second-info-item"> {{ store.currentItem.showText + store.currentItem.emoji }}</span>
                </p>
            </template>
            <h3 style="margin-bottom: 0.5rem;margin-top: 0.5rem;">行为执行</h3>
            <GameProgress />
            <h3 style="margin-bottom: 0.5rem;margin-top: 0.5rem;">游戏设置</h3>
            <VaSwitch v-model="store.snap" label="吸附" size="small" />
            <!-- <h3 style="margin: 0.5rem 0;">售价排行榜</h3>
            <p v-if="leaderboard.length === 0" style="color: #8a8a8a;">空空如也</p>
            <div v-else>
                <div v-for="(item, index) in leaderboard" :key="item[0]" style="margin-top: 0.1rem;">
                    <span>{{ indexToRank(index) }}</span>
                    <span>{{ item[0] }}</span>
                    <span style="color:#8a8a8a;margin-left: 0.5rem;">{{ item[1].prise + '￥ [' + item[1].name + ']'}}</span>
                </div>
            </div> -->
        </div>
    </div>
</template>
<script setup lang="ts">
import { useGameStore, type IRoomState } from '@/stores/game';
import { computed, ref } from 'vue';
import { indexToRank } from '@/utils/str'
import GameProgress from '@/components/game/gameProgress.vue'
import { useUserStore } from '@/stores/user';
const store = useGameStore()
const userStore = useUserStore()
const userId = userStore.getSelfId()
const isFirst = computed(() => store.currentItemInfo.discovedNum == 1 && store.currentItemInfo.firstCreater.id == userId)
const leaderboard = computed(() => {
    return Object.entries((store.roomState as IRoomState).saled).sort((a, b) => b[1].prise - a[1].prise).slice(0, 10)
})
const playerItem = computed(() => {
    return store.getItem(store.getSelfData()?.public.playerItem!)
})
const isCollapsed = ref(false)
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}
</script>
<style scoped>
.count {
    padding: 0.31rem;
    border-radius: 0.2rem;
    color: #000000;
    margin: 0.5rem 0;
}

.second-info {
    color: #8a8a8a;
    line-height: 1.2rem;
}

.second-info-item {
    color: #000000;
    font-weight: 600;
}

.cinfo {
    margin: 0.3rem 0rem;
}

.game-side-info {
    display: flex;
    flex-direction: column;
    background-color: white;
    border-left: 0.15rem solid #e0e0e0;
    position: relative;
    flex-shrink: 0;
    flex-grow: 0;
    overflow-y: auto;
}

.collapse-btn {
    position: absolute;
    left: 0.6rem;
    top: 0.6rem;
    width: 2rem;
    height: 2rem;
}

.collapse-btn.collapse {
    position: absolute;
    left: unset;
    right: 0.6rem;
    top: 0.6rem;
    z-index: 100;
}

.attribute {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
}
</style>