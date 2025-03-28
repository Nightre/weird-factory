<template>

    <VaModal v-model="showSettingModal" hide-default-actions close-button>
        <h3>
            设置
        </h3>
        <div style="margin-top: 0.5rem;">
            <setting />
        </div>
    </VaModal>
    <VaButton @click="toggleCollapse" v-show="isCollapsed"
        style="height: 2rem;width: 2rem;position: fixed;left: 0.5rem;top: 0.5rem;" size="small" icon="menu">
    </VaButton>

    <VaButton @click="showSettingModal = true" size="small"
        style="height: 2rem;width: 2rem;position: fixed;right: 0.5rem;top: 0.5rem;">
        <VaIcon name="settings" />
    </VaButton>

    <div class="game-info" v-show="!isCollapsed">
        <div class="flex-row">
            <VaButton @click="goHome" icon="home" size="small" :color="isEdit ? 'success' : 'danger'"
                style="height: 2rem;padding: 0 0.3rem;">
                {{ isEdit ? '返回编辑' : '离开' }}
            </VaButton>
            <h1 style="flex: 1;text-align: center;font-size: 1.4rem;">奇想工厂</h1>
            <VaButton @click="toggleCollapse" size="small" icon="menu" style="height: 2rem;width: 2rem;">
            </VaButton>
        </div>

        <VaDivider />

        <VaTabs v-model="mainTabValue" grow>
            <template #tabs>
                <VaTab v-for="tab in mainTabs" :key="tab.title">
                    <VaIcon :name="tab.icon" />
                    {{ tab.title }}
                </VaTab>
            </template>
        </VaTabs>
        <div style="margin-top: 0.5rem;"></div>
        <template v-if="mainTabValue == 0">
            <game-side-info />
        </template>
        <template v-else-if="mainTabValue == 1">
            <div class="flex-row">
                <p>金钱:</p>
                <span style="font-weight: 800;color: #8a8a8a;">{{ selfMoeny }}￥</span>
            </div>
            <div v-if="store.isRoomReady()">
                <VaTabs v-model="marketTabValue">
                    <template #tabs>
                        <VaTab v-for="tab, index in market.map(item => item.category)" :key="index">{{ tab }}
                        </VaTab>
                    </template>
                </VaTabs>

                <div class="market-grid">
                    <template v-for="marketItem, index in marketItems">
                        <VaButton class="market-item" @click="onBuyClick(index)" preset="secondary"
                            border-color="primary" :disabled="disableMarketItem(marketItem)" size="small">
                            <div class="market-content">
                                <p>{{ marketItem.name }} {{ marketItem.emoji }}</p>
                                <p>
                                    {{ marketItem.price }} ￥
                                    <span class="stock">剩余：{{ marketItem.num != null ? marketItem.num : "∞"
                                    }}</span>
                                </p>
                            </div>
                        </VaButton>
                    </template>
                </div>
            </div>
        </template>
        <template v-else-if="mainTabValue == 2" class="flex-col">
            <h3>玩家列表</h3>
            <div>
                <p v-for="player in playerList">
                    {{ player.name }} -
                    <span style="font-weight: 800;color: #8a8a8a;">{{ (roomState as
                        IRoomState).players[player.id].public.money }}￥</span>
                </p>
            </div>
            <chat :sendMessageEmit="sendMessageEmit" :messages="(roomState as IRoomState).msg" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { useGameStore, type IMarketItem, type IRoomState } from '@/stores/game';
import { storeToRefs } from 'pinia';
import copyText from '@/components/copyText.vue';
import { computed, ref } from 'vue';
import { buyItemEmit, reset, sendMessageEmit } from '@/game/game';
import { useRouter } from 'vue-router';
import setting from '@/components/setting.vue';
import chat from '@/components/game/chat.vue';
import gameSideInfo from '@/components/game/gameSideInfo.vue';

const router = useRouter()
const mainTabValue = ref(0)
const marketTabValue = ref(0)

const showSettingModal = ref(false)
const store = useGameStore()
const data = computed(() => store.getSelfData())
const { playerList, roomState } = storeToRefs(store)
const market = (store.roomState as IRoomState).market
const marketItems = computed(() => market[marketTabValue.value].items)
const onBuyClick = (index: number) => buyItemEmit(marketTabValue.value, index)

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
const mainTabs = computed(() => store.gameCreateData.public ? [
    { title: '信息', icon: 'info' },
    { title: '商店', icon: 'store' },
    { title: '聊天', icon: 'chat' },
] : [
    { title: '信息', icon: 'info' },
    { title: '商店', icon: 'store' },
]
)
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
    background-color: rgb(255, 255, 255);
    border-right: 0.15rem solid #e0e0e0;
    flex-shrink: 0;
    flex-grow: 0;
    overflow-y: auto;
    touch-action: pan-y;
    width: 270px;
    padding: 1rem;
    gap: 0.5rem;
}

.title {
    font-size: 1.8rem;
}

.market-item {
    color: #000000 !important;
    background-color: #fcfcfc !important;
}

.ti {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
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