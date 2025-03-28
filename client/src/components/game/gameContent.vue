<template>
    <div class="game-content" ref="containerRef" @wheel.prevent="handleWheel"
        @pointerdown.prevent.stop="startBackgroundDrag" @touchstart.prevent.stop="touchStart"
        @touchmove.prevent.stop="touchMove" @touchend.prevent.stop="touchEnd">
        <div class="grid-overlay" :style="gridStyle"></div>
        <div class="content-container" :style="{
            transform: `translate(${store.backgroundPosition.x}px, ${store.backgroundPosition.y}px) scale(${scale})`,
            transformOrigin: '0 0'
        }">

            <TransitionGroup name="game-item-transition">
                <template v-for="item in (store.roomState as IRoomState).items" :key="item.id">
                    <game-item :root="item.id" :disable="false" :child="false" v-if="!item.output" :itemId="item.id"
                        :startDrag="startDrag" />
                </template>
            </TransitionGroup>

            <div v-for="actionLine in store.actionLines" :key="actionLine.id" :class="{ 'action-line': true }"
                :style="getLineStyle(actionLine)">
                <p class="action-line-text">{{ actionLine.action }}</p>
            </div>
            <span class="material-icons">home</span>
            <div class="mouse-container" v-for="player, id in (store.roomState as IRoomState).players" :key="id">
                <div v-if="id != userId" class="mouse" :style="getMouseStyle(id)">
                    <span class="material-icons">mouse</span>
                    {{ player.public.name }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGameStore, type IActionLine, type IItem, type IRoomState } from '@/stores/game';
import { useDraggable, snapSize } from '@/composables/useDraggable';
import { useZoomable } from '@/composables/useZoomable';
import { moveItemStop, moveItem } from '@/game/game';
import GameItem from './gameItem.vue';
import { watch, ref, nextTick } from 'vue';
import { useUserStore, type UserInfo } from '@/stores/user';
import { useMouseUpdate } from '@/composables/useMouseUpdate';
import { computed } from 'vue';
import { usePinch } from '@/composables/usePinch';
import { onMounted } from 'vue';

const store = useGameStore();
const userStore = useUserStore()

const userId = (userStore.userInfo as UserInfo).id


const getMouseStyle = computed(() => (playerId: string) => {
    const pos = store.getPlayerData(playerId)
    if (!pos) return {}

    return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
    }
})

const gridStyle = computed(() => {
    const backgroundPosition = store.backgroundPosition
    const girdSize = snapSize * store.scale
    return {
        "background-position": `${backgroundPosition.x}px ${backgroundPosition.y}px`,
        "background-size": `${girdSize}px ${girdSize}px`
    }
})

const onItemMoved = (item: IItem, x: number, y: number) => {
    moveItem(item, x, y)
}

const onItemStopMoved = (id: string) => {
    moveItemStop(id)
}

const { scale, handleWheel, setScaleOrigin } = useZoomable();
const { touchStart, touchMove, touchEnd } = usePinch(setScaleOrigin)

const { startDrag, containerRef, startBackgroundDrag } = useDraggable(onItemMoved, onItemStopMoved);
useMouseUpdate()

watch(containerRef, (v) => {
    store.gameDom = v
})

const getLineStyle = computed(() => (actionLine: IActionLine) => {

    if (!store.isAlive(actionLine.target1) || !store.isAlive(actionLine.target2)) {
        return {
            display: 'none'
        }
    }

    const p1 = store.getGlobalPos(actionLine.target1);
    const p2 = store.getGlobalPos(actionLine.target2);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    return {
        width: `${length}px`,
        left: `${p1.x + 10}px`,
        top: `${p1.y + 10}px`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 50%'
    }
})

nextTick(() => {
    store.resetBackgroundPos()
})
</script>
<style scoped>
.game-content {
    position: relative;
    width: 100%;
    overflow: hidden;
    cursor: grab;
    background-color: rgb(255, 255, 255);
    flex-grow: 1;
    touch-action: none;
}

.game-content * {
    user-select: none;
}

.game-content:active {
    cursor: grabbing;
}

.content-container {
    position: absolute;
    touch-action: none;
}

.mouse {
    position: absolute;
    display: flex;
    text-wrap-mode: nowrap;
    align-items: flex-end;
    z-index: 9999;
}

.grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: linear-gradient(to right, #80808055 2px, transparent 2px),
        linear-gradient(to bottom, #80808055 2px, transparent 2px);
    background-size: 32px 32px;
    pointer-events: none;
    transform-origin: 50% 50%;
}

.action-line {
    position: absolute;
    height: 2px;
    background-color: rgba(0, 0, 0, 0.166);
    z-index: 999;
}

.action-line::after {
    content: '';
    position: absolute;
    right: -6px;
    top: -4px;
    width: 0;
    height: 0;
    border-left: 8px solid rgba(0, 0, 0, 0.166);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
}

@keyframes progressAnimation {
    0% {
        margin-left: 0%;
        transform: translateY(-50%);
    }

    90% {
        margin-left: 100%;
        transform: translateY(-50%) scale(1);
        opacity: 1;
    }

    100% {
        margin-left: 100%;
        transform: translateY(-50%) scale(0);
        opacity: 0;
    }
}

.action-line-text {
    width: 1.2rem;
    transform: translateY(-50%);
    position: relative;
    left: -1.2rem;
    animation: progressAnimation 5000ms linear forwards;
}
</style>