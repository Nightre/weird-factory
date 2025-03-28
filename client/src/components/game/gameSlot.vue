<template>
    <span class="slot-name">{{ slotName }}</span>
    <span class="slot-container" :ref="el => setRef(el as Element, slotName)" :class="{
        'slot-container--active': active,
        'target-slot': isTargetSlot,
        'private': input.type == INPUT_TYPE.PRIVATE,
        'ref-slot': input.type == INPUT_TYPE.ALLOW_REFERENCE && !isTargetSlot && !input.item
    }" @click.stop="onSlotClick" @touchstart.stop="onSlotClick">

        <slot></slot>
        <VaIcon v-if="input.type == INPUT_TYPE.ALLOW_REFERENCE && !isTargetSlot && !input.item" name="flag">
            flag
        </VaIcon>
        <button class="clear-shadow-btn" v-show="input.item && input.isShadow" @click.stop="props.onClearShadow" @touchstart.stop="props.onClearShadow">
            <VaIcon name="cancel" />
        </button>
        <p v-show="isTargetSlot" class="tips">请点击一个物品引用</p>
    </span>
</template>
<script setup lang="ts">
import { useGameStore, type IInput, type IItem } from '@/stores/game';
import { INPUT_TYPE } from '@/utils/server-enum';
import { computed } from 'vue';

const props = defineProps<{
    slotName: string,
    active: boolean,
    setRef: (el: Element, slotName: string) => unknown,
    item: IItem,
    input: IInput,
    onClearShadow: () => unknown
}>();
const store = useGameStore()
const onSlotClick = () => {
    if (props.input.item || props.input.type !== INPUT_TYPE.ALLOW_REFERENCE) {
        return
    }
    store.setTargetSlot(props.item, props.slotName)
}
const isTargetSlot = computed(() => store.targetSlot == props.slotName && store.targetSlotItem == props.item)
</script>
<style scoped>
.slot-name {
    color: #718096;
    font-size: 0.9rem;
    text-wrap-mode: nowrap;
}

.slot-container {
    min-height: 36px;
    flex: 1;
    background-color: #edf2f7;
    border: 2px dashed #a0aec0;
    border-radius: 0.5rem;
    min-width: 10rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.slot-container:hover {
    cursor: default;
}

.ref-slot:hover {
    background-color: #e3e3e3;
}

.slot-container--active {
    outline: 3px solid rgba(102, 102, 102, 0.8);
}

.target-slot {
    background-color: rgb(255, 255, 255);
}

.tips {
    color: #718096;
    margin: 0.5rem;
    text-wrap: nowrap;
}

.private {
    border: 5px solid #a0aec0;
}

.clear-shadow-btn {
    width: 2rem;
    background-color: rgb(255, 255, 255);
    border-radius: 0.1rem;
    border: 1px solid #a0aec0;
    margin: 0.2rem;
}
.clear-shadow-btn:hover {
    background-color: #e3e3e3;
}
</style>