<template>
    <div v-if="!item.output || child" class="game-item" :style="itemStyle" :class="itemClasses" :ref="onDomChange"
        @pointerenter="onMouseEnter" @pointerleave="onMouseLeave" @pointerdown.stop="onMouseDown($event)"
        @click.stop="onClick">
        <p class="game-item__tooltip" v-if="item.reason">
            {{ item.reason }}
        </p>
        <VaInnerLoading :loading="item.isLoading" style="z-index: 1000;">
            <div class="game-item__header">
                <span class="game-item__title">{{ item.showText }} {{ item.emoji }}</span>
                <div style="margin-left: 1.5rem;"></div>
                <VaButton preset="secondary" size="small" :icon="item.fold ? 'expand_more' : 'expand_less'"
                    v-if="showFoldBtn && !props.shadow" @click.stop="onFoldClick" textColor="#000000"
                    style="right:0;position: absolute;" @pointerdown.stop="onFoldClick">
                </VaButton>
            </div>
            <div v-show="!item.fold && !props.shadow">
                <div>
                    <div v-for="attribute, name in item.attributes" :key="name" class="game-item__attribute">
                        <p class="game-item__attribute-name">{{ name }}:</p>
                        <p class="game-item__attribute-value">{{ attribute }}</p>
                    </div>
                </div>
                <div v-if="Object.keys(item.inputs).length > 0" class="game-item__slots">
                    <div v-for="(value, slotName) in item.inputs" :key="'c_' + slotName" class="game-item__slot">
                        <game-slot :slotName="slotName" :setRef="setRef" :active="isSlotActive(slotName)" :item="item"
                            :input="value" :onClearShadow="() => clearShadow(slotName)">
                            <game-item :disable="disable || item.isLoading" v-if="value?.item" :itemId="value.item"
                                :startDrag="startDrag" :child="true" :root="root" :layer="(layer || 0) + 1"
                                :shadow="props.shadow || value.isShadow" :input="value" :key="slotName" />
                        </game-slot>
                    </div>
                </div>
            </div>
            <div class="game-item__action-container" v-show="!item.fold && !props.shadow">
                <div class="game-item__action-wrapper action-select">
                    <VaSelect v-model="item.currentAction" :options="actions" allow-create @pointerdown.stop
                        noOptionsText="按下Enter创建该动作" @create-new="addNewAction" size="small"
                        searchPlaceholderText="创建新动作（回车确认）">

                        <template #option="{ option, selectOption }">
                            <button class="select-btn"
                                :disabled="item.privateActions.includes(option as string) && item.others"
                                @click="selectOption(option)">
                                {{ option }}
                            </button>
                        </template>
                    </VaSelect>

                    <VaButton @click.stop="onActionClick" @pointerdown.stop icon-right="arrow_forward"
                        icon-color="#ffffff" :disabled="item.privateActions.includes(item.currentAction)"></VaButton>
                </div>
            </div>
        </VaInnerLoading>
    </div>
</template>
<script setup lang="ts">
import { computed, watch } from 'vue';
import { actionMachine, setAction, createNewActionsByAI, setFold, setInputAndEmit, setOutputAndEmit, setLock } from '@/game/game';
import { useGameStore, type IInput, type IItem } from '@/stores/game';
import { INPUT_TYPE, ITEM_TYPE } from '@/utils/server-enum';
import { useUserStore, type UserInfo } from '@/stores/user';
import { storeToRefs } from 'pinia';
import GameSlot from './gameSlot.vue';
import { getOffset } from '@/composables/useDraggable';
import { hasIntersection } from '@/utils/list';

const props = defineProps<{
    itemId: string,
    child: boolean,
    startDrag: (event: PointerEvent, item: IItem) => void,
    disable?: boolean,
    root: string,
    layer?: number,
    shadow?: boolean,
    input?: IInput,
}>();

const addNewAction = async (newAction: string) => {
    await createNewActionsByAI(props.itemId, { ...item.value.actions, [newAction]: {} });
    setAction(props.itemId, newAction);
};

const store = useGameStore();
const item = computed(() => store.getItem(props.itemId));
const { userInfo } = storeToRefs(useUserStore());
const userId = (userInfo.value as UserInfo).id;

const onFoldClick = () => {
    if (store.isPinching) return;
    item.value.fold = !item.value.fold
    setFold(props.itemId, item.value.fold)
}

const actions = computed(() => {
    return Object.keys(item.value.actions)
})

const isOwner = computed(() => {
    const team = store.getSelfData()?.public.team
    if (item.value.owner.includes(userId) || (team && hasIntersection(team, item.value.owner))) {
        item.value.others = false;
        return true;
    } else {
        item.value.others = true;
        return false;
    }
});

const showFoldBtn = computed(() =>
    Object.keys(item.value.attributes).length > 0 ||
    Object.keys(item.value.inputs).length > 0 ||
    Object.keys(item.value.actions).length > 0
);

if (!props.shadow) {
    watch(() => props.root, () => {
        item.value.root = props.root;
        if (props.child) {
            setTimeout(() => {
                item.value.offset = getOffset(item.value.el!, store.getItem(props.root).el!);
            }, 0);
        } else {
            item.value.offset = { x: 0, y: 0 };
        }
    }, { immediate: true });

    watch(() => item.value.currentAction, (newValue) => {
        setAction(props.itemId, newValue);
    });
}

const itemStyle = computed(() => {
    if (props.child) {
        return { left: '0px', top: '0px' };
    }
    return { left: `${item.value.x}px`, top: `${item.value.y}px`, zIndex: store.getOrder(item.value.id) };
});

const itemClasses = computed(() => ({
    'active': item.value.id === store.canConnectItem && store.canConnectItemSlot === null && !store.isPinching,
    'machine': Object.values(item.value.actions).length > 0,
    'submit': item.value.type === ITEM_TYPE.SUBMIT,
    'tool': item.value.type === ITEM_TYPE.TOOL,
    'child': props.child,
    'loading': item.value.isLoading,
    'dragging': item.value.isDragging && !props.shadow && !store.isPinching,
    'others-locked': item.value.isLocked && !isOwner.value,
    'dark': (props.layer || 0) % 2 != 0,
    'has-target-slot': store.hasTargetSlot,
    'shadow': props.shadow,
    'has-script': item.value.hasScript,
    'current': store.currentItem?.id === item.value.id && !props.shadow && !store.isPinching
}));

const onMouseEnter = () => {
    store.setHoverItem(item.value.id);
    store.toolTips = item.value.reason;
};

const onMouseLeave = () => {
    store.clearHoverItem();
    store.toolTips = null;
};

const onMouseDown = (event: PointerEvent): void => {
    store.setCurrentItem(props.itemId);

    if (store.isPinching) {
        return;
    }

    if (item.value.isLoading || item.value.isDragging || props.disable || store.hasTargetSlot || props.shadow) {
        return;
    }

    if (props.input && props.input.type == INPUT_TYPE.PRIVATE && item.value.others) {
        return;
    }
    if (!item.value.isLocked || isOwner.value) {
        setOutputAndEmit(item.value.id, null, null);
    }
    props.startDrag(event, item.value);
};

const setRef = (el: unknown, id: string): void => {
    if (el && !props.shadow) {
        store.setItemHTMLElement(el as HTMLElement, item.value.id, id);
    }
};

const onDomChange = (el: unknown): void => {
    if (el && !props.shadow) {
        item.value.el = el as HTMLElement;
    }
};

const isSlotActive = (slotName: string): boolean => {
    return item.value.id === store.canConnectItem && slotName === store.canConnectItemSlot;
};

const onActionClick = (): void => {
    if (item.value.isLoading) return;
    actionMachine(item.value.id, item.value.currentAction);
};

const onClick = () => {
    if (store.isPinching) {
        return;
    }
    if (store.hasTargetSlot && !props.shadow) {
        store.setTargetSlotValue(item.value.id);
        store.setTargetSlot(null, null);
    }
};

const clearShadow = (inputSlotName: string) => {
    setInputAndEmit(props.itemId, null, inputSlotName);
};
</script>
<style scoped>
.game-item {
    position: absolute;
    cursor: default;
    user-select: none;
    background-color: #f8fff8;
    padding: 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid #e0e0e0;
    pointer-events: all;
    touch-action: none;
}

/* 创建和删除动画 */
.game-item-transition-enter-active {
    animation: game-item-in 0.1s ease-out;
}

.game-item-transition-leave-active {
    animation: game-item-out 0.1s ease-in;
}

.current {
    outline: 2px solid #000000;
}

@keyframes game-item-in {
    0% {
        transform: scale(0.9);
        opacity: 0.3;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes game-item-out {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    100% {
        transform: scale(0.9);
        opacity: 0.3;
    }
}

.shadow {
    background-color: hsl(67, 100%, 92%) !important;
}

.dark {
    background-color: #f3f3f3;
}

.cant-drag {
    border-bottom: 3px solid #bb4848;
    background-color: #fcdfdf;
}

.game-item__tooltip {
    display: none;
    position: absolute;
    top: -25px;
    left: 0;
    background: #ffffff;
    padding: 0.2rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 800px;
    overflow: hidden;
}

.game-item:hover>.game-item__tooltip {
    display: block;
}

.dragging .game-item__tooltip {
    display: none;
}

.game-item__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.game-item__title {
    font-weight: 600;
    color: #2d3748;
    white-space: nowrap;
}

.game-item__attribute {
    display: flex;
    margin-top: 0.3rem;
}

.game-item__attribute-name {
    flex: 1;
    color: #575e6b;
    white-space: nowrap;
}

.game-item__attribute-value {
    white-space: nowrap;
}

.tool {
    background-color: #ffffff;
}

.machine {
    background-color: #f8fff8;
}

.submit {
    background-color: #bee3f8;
}

.child {
    position: relative;
    width: 100%;
    padding: 0.5rem;
    margin: 0;
    border: none;
}

.active {
    box-shadow: 0 0 2px 8px rgba(251, 255, 0, 0.479);
}

.game-item__slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.game-item__slot {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    position: relative;
}

.game-item__action-container {
    margin-top: 0.5rem;
}

.game-item__action-wrapper {
    display: flex;
    gap: 0.3rem;
}

.action-select {
    background-color: white;
}

.game-item__action {
    width: 100%;
    background-color: #4a5568;
    color: #ffffff;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    height: 2rem;
    border-radius: 0;
}

.game-item__action:first-child {
    border-top-left-radius: 0.4rem;
    border-top-right-radius: 0.4rem;
}

.game-item__action:last-child {
    border-bottom-left-radius: 0.4rem;
    border-bottom-right-radius: 0.4rem;
}

.game-item__action:hover:not(:disabled) {
    background-color: #2d3748;
}

.game-item__action:disabled {
    background-color: #e2e8f0;
    cursor: not-allowed;
    color: #a0aec0;
}

.loading {
    opacity: 0.5;
}

.others-locked {
    border-left: 3px solid #bb4848;
}

.dragging {
    box-shadow: 0 10px 10px 1px rgba(154, 154, 154, 0.5);
}

.can-sale {
    border-bottom: 3px solid #48bb78;
}

.game-item__fold-btn {
    width: 1.3rem;
    height: 1.3rem;
}

.has-target-slot:hover {
    cursor: pointer;
}

.has-script {
    background-color: #ffffff;
}

.select-btn {
    background-color: #ffffff;
    padding: 0.3rem;
    border: none;
}

.select-btn:hover {
    background-color: #f4f4f4;
}

.select-btn:disabled {
    background-color: #e6e6e6;
}

</style>