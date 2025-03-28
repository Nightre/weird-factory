<template>
    <div class="flex-row" v-if="(store.roomState as IRoomState).public">
        <p>房间号:</p>
        <copy-text :textToCopy="store.roomId" />
    </div>

    <template v-if="store.currentItem && store.currentItemInfo">
        <VaDivider v-if="(store.roomState as IRoomState).public" />
        <h3>{{ store.currentItem.showText }} {{ store.currentItem.emoji }}</h3>
        <div class="count" :style="{ backgroundColor: isFirst ? '#82e0aa' : '#f1948a' }">
            <span v-if="isFirst">🏆只有你发现该物品</span>
            <span v-else>已有 {{ store.currentItemInfo.discovedNum }} 人发现</span>
        </div>

        <p class="second-info">
            <span class="second-info-item"> {{ store.currentItemInfo.firstCreater?.name }} </span> 在
            <span class="second-info-item"> {{ store.currentItemInfo.createdAt }}</span> 最先发现
        </p>

        <p style="color: #8a8a8a;" v-if="store.currentItem.info">{{ store.currentItem.info }}</p>
        <VaDivider v-if="playerItem" />
    </template>
    
    <div v-if="playerItem" class="player-item">
        <h3>🧑{{ playerItem.showText }}</h3>
        <div v-for="key, item in playerItem.attributes" :key="key" class="attribute">
            <span style="color: #8a8a8a;">{{ item }}</span>
            <span>{{ key }}</span>
        </div>
        <p>{{ playerItem.reason }}</p>
    </div>

    <!-- <h3 style="margin-top: 0.5rem;">行为执行</h3>
    <GameProgress /> -->
</template>

<script setup lang="ts">
import { useGameStore, type IRoomState } from '@/stores/game';
import { computed, ref } from 'vue';
import GameProgress from '@/components/game/gameProgress.vue'
import { useUserStore } from '@/stores/user';
import CopyText from '@/components/copyText.vue';

const store = useGameStore()
const userStore = useUserStore()
const userId = userStore.getSelfId()
const isFirst = computed(() => store.currentItemInfo.discovedNum == 1 && store.currentItemInfo.firstCreater.id == userId)

const playerItem = computed(() => {
    return store.getItem(store.getSelfData()?.public.playerItem!)
})
</script>
<style scoped>
.count {
    padding: 0.31rem;
    border-radius: 0.2rem;
    color: #000000;
}

.second-info {
    color: #8a8a8a;
    line-height: 1.2rem;
}

.second-info-item {
    color: #000000;
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
}

.player-item {
    background-color: rgb(220, 220, 220);
    ;
    padding: 0.5rem;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
</style>