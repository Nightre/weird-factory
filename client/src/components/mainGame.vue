<template>
    <div>
        <div class="game-container">
            <GameContent />
        </div>
        <div class="grid">
            <!-- <div class="info" :class="{ 'hidden': isCollapsed }"> -->
            <GameInfo />
            <!-- </div> -->
            <!-- <VaButton class="fold" @click="toggleCollapse" :style="{ left: isCollapsed ? '0px' : '300px' }">
                {{ isCollapsed ? '>' : '<' }} </VaButton>
                    <GameContent /> -->

        </div>

        <VaModal v-model="store.isGameOver" ok-text="好的" cancel-text="关闭" size="small">
            <h3>
                你死了
            </h3>
            <p>
                你死的真突然，去看看你的遗书吧，不过你重新复活了。
                但是你的钱和物品全部丢失。
            </p>
        </VaModal>
    </div>
    <ZoomButton />
</template>

<style scoped>
.fold {
    position: absolute;
    top: 50vh;
    transform: translateY(-50%);
    z-index: 1;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.grid {
    display: flex;
    height: calc(100vh);
}

.grid.collapsed {
    grid-template-columns: 0px auto;
}

.tool-tips {
    position: fixed;
    z-index: 1;
    top: 0px;
    font-size: 1rem;
    font-weight: 600;
    padding: 1rem;
    white-space: pre-wrap;
}

.game-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;
    flex-grow: 1;
}
</style>

<script setup lang="ts">
import GameInfo from './game/gameInfo.vue';
import GameContent from './game/gameContent.vue'
import { useGameStore } from '@/stores/game';
import GameRightInfo from './game/gameSideInfo.vue';
import { useJoinRoom } from '@/utils/join-room';
import GameProgress from './game/gameProgress.vue';
import ZoomButton from './game/zoomButton.vue';
const store = useGameStore()
</script>