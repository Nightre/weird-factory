<template>
    <div class="game-info" :style="{ width: isCollapsed ? '0px' : '250px', overflowY: isCollapsed ? 'unset' : 'auto' }">
        <VaButton @click="toggleCollapse" :class="{ 'collapse': isCollapsed }" class="collapse-btn" icon="menu">
        </VaButton>

        <div v-show="!isCollapsed" style="padding:1rem;touch-action: pan-y;">
            <p class="ti">
                <VaButton @click="goHome" icon="home" size="small" style="margin-right: 0.5rem;" :color="isEdit ? 'success' : 'danger'">
                    {{ isEdit ? '返回编辑' : '离开' }}
                </VaButton>奇想工厂
            </p>
            <VaDivider style="margin: 1rem 0;" />
            <div style="display: flex;justify-content: space-between;">
                <p>金钱：</p>
                <span style="font-weight: 800;color: #8a8a8a;">{{ selfMoeny }}￥</span>
            </div>
            <div v-if="(store.roomState as IRoomState).public">
                <p class="room-id" v-if="(store.roomState as IRoomState).public">房间号：<copy-text :textToCopy="roomId" />
                </p>
                <p class="player-list-title">玩家列表</p>
                <p v-for="player in playerList" class="player">
                    {{ player.name }} -
                    <span style="font-weight: 800;color: #8a8a8a;">{{ (roomState as
                        IRoomState).players[player.id].public.money }}￥</span>
                </p>
            </div>


            <div v-if="store.isRoomReady()" style="margin-top: 0.5rem;">
                <VaTabs v-model="tabValue">
                    <template #tabs>
                        <VaTab v-for="tab, index in market.map(item => item.category)" :key="index">{{ tab }}</VaTab>
                    </template>
                </VaTabs>

                <div class="market-grid">
                    <template v-for="marketItem, index in marketItems">
                        <div v-if="marketItem.divide" class="market-title">
                            {{ marketItem.text }}
                        </div>
                        <VaButton v-else class="market-item" @click="onBuyClick(index)"
                            :disabled="disableMarketItem(marketItem)" preset="primary" size="small">
                            <div class="market-content">
                                <p>{{ marketItem.name }} {{ marketItem.emoji }}</p>
                                <p>
                                    {{ marketItem.price }} ￥
                                    <span class="stock">剩余：{{ marketItem.num != null ? marketItem.num : "∞" }}</span>
                                </p>
                            </div>
                        </VaButton>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGameStore, type IMarketItem, type IRoomState } from '@/stores/game';
import { storeToRefs } from 'pinia';
import copyText from '@/components/copyText.vue';
import { computed, ref } from 'vue';
import { buyItemEmit, reset } from '@/game/game';
import { useRouter } from 'vue-router';

const router = useRouter()
const tabValue = ref(0)
const store = useGameStore()
const data = computed(() => store.getSelfData())
const { playerList, roomId, roomState } = storeToRefs(store)
const market = (store.roomState as IRoomState).market
const marketItems = computed(() => market[tabValue.value].items)
const onBuyClick = (index: number) => buyItemEmit(tabValue.value, index)

const disableMarketItem = (market: IMarketItem) => {
    return market.price > data.value!.public.money || market.num === 0
}
const isEdit = computed(() => typeof store.gameCreateData.editLevel === 'string')
const isCollapsed = ref(false)
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}

const goHome = () => {
    if (isEdit.value) {
        router.push('/editLevel/' + store.gameCreateData.editLevel)
    } else {
        router.push('/home')
    }
    reset()
}
const selfMoeny = computed(() => data.value!.public.money)
</script>

<style scoped>
.player-list-title {
    font-size: 1rem;
    font-weight: 800;
    margin: 0.5rem 0;
}

.collapse-btn {
    position: absolute;
    right: 0.6rem;
    top: 0.6rem;
    width: 2rem;
    height: 2rem;
}

.collapse-btn.collapse {
    position: absolute;
    left: 0.5rem;
    z-index: 9;
    top: 0.5rem;
}

.game-info {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: white;
    border-right: 0.15rem solid #e0e0e0;
    flex-shrink: 0;
    flex-grow: 0;
    overflow-y: auto;
    touch-action: pan-y;
}

.title {
    font-size: 1.8rem;
}

.market-item {
    color: #000 !important;
}

.ti {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.8rem;
}

.room-id {
    margin: 0.5rem 0;
}

.money {
    margin-top: 0.5rem;
}

.player {
    font-size: 1rem;
    margin: 0.5rem 0;
}

.market-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.market-title {
    font-size: 1.2rem;
    grid-column: 1 / -1;
}

.market-content {
    padding: 0.5rem;
    position: relative;
}

.stock {
    color: #8a8a8a;
}

.buy-btn {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
}

.home-btn {
    margin-bottom: 0.5rem;
}
</style>