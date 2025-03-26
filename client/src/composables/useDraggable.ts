import { endDragEmit, moveItemEmit, startDragEmit } from '@/game/game';
import { useGameStore, type IItem } from '@/stores/game';
import { useUserStore, type UserInfo } from '@/stores/user';
import { compareStrings } from '@/utils/str';
import { storeToRefs } from 'pinia';
import { ref, onUnmounted, type Ref, type Reactive, onMounted, computed, watch } from 'vue';

export interface Position {
    x: number;
    y: number;
}

export let draggingItemId: string | null = null
export let draggingBackground = false

export const getOffset = (el1: HTMLElement, el2: HTMLElement) => {
    const rect1 = el1.getBoundingClientRect()
    const rect2 = el2.getBoundingClientRect()
    return {
        x: rect1.left - rect2.left,
        y: rect1.top - rect2.top
    }
}

export const abs2gamePos = (pos: Position) => {
    const store = useGameStore()
    const { backgroundPosition, scale } = storeToRefs(store)
    return {
        x: (pos.x - backgroundPosition.value.x) / scale.value,
        y: (pos.y - backgroundPosition.value.y) / scale.value
    }
}

export const updateItemPos = (item: IItem) => {
    const store = useGameStore()
    const globalPos = store.getGlobalPos(item)
    item.x = globalPos.x
    item.y = globalPos.y
}

export const snapSize = 16
export function useDraggable(cb: (item: IItem, x: number, y: number) => void, onItemStopMoved: (id: string) => unknown) {
    let isDragging = false;
    let currentItem: Reactive<IItem> | null = null;
    let initialX = 0;
    let initialY = 0;
    let isBackgroundDragging = false;
    const store = useGameStore();
    const { scale, isPinching } = storeToRefs(store)
    const containerRef = ref<HTMLElement | null>(null);

    watch(isPinching, (newIsPinching) => {
        if (newIsPinching) stopDrag()
    })

    const startDrag = (event: PointerEvent, item: Reactive<IItem>) => {
        if (isPinching.value) {
            return;
        }
        startDragEmit(item.id);
        store.orderTop(item.id);
        const gameDom = store.gameDom;
        draggingItemId = item.id;
        let gameReact: Position = gameDom!.getBoundingClientRect();
        let itemReact: Position = item.el!.getBoundingClientRect();

        const ix = (itemReact.x - gameReact.x) - store.backgroundPosition.x;
        const iy = (itemReact.y - gameReact.y) - store.backgroundPosition.y;

        isDragging = true;

        currentItem = item;

        initialX = (event.clientX - ix) / scale.value;
        initialY = (event.clientY - iy) / scale.value;
    };

    const startBackgroundDrag = (event: PointerEvent) => {
        if (isPinching.value) {
            return;
        }

        if (event.target === containerRef.value) {

            store.setCurrentItem(null)
            isBackgroundDragging = true;

            initialX = event.clientX - store.backgroundPosition.x;
            initialY = event.clientY - store.backgroundPosition.y;

            draggingBackground = true;
        }
    };

    const onDrag = (event: PointerEvent) => {
        if (!isDragging && !isBackgroundDragging) return;
        if (isPinching.value) {
            return;
        }
        let newX = 0;
        let newY = 0;

        if (isDragging && currentItem) {
            currentItem.isDragging = true;
            newX = event.clientX / scale.value - initialX;
            newY = event.clientY / scale.value - initialY;

            currentItem.x = Math.round(newX);
            currentItem.y = Math.round(newY);

            cb(currentItem, currentItem.x, currentItem.y);
        } else if (isBackgroundDragging) {
            newX = event.clientX - initialX;
            newY = event.clientY - initialY;

            store.backgroundPosition.x = newX;
            store.backgroundPosition.y = newY;
        }
    };

    const stopDrag = () => {
        if (!isDragging && !isBackgroundDragging) return;

        if (draggingItemId && currentItem) {
            if (store.snap) {
                currentItem.x = Math.round(currentItem.x / snapSize) * snapSize;
                currentItem.y = Math.round(currentItem.y / snapSize) * snapSize;
            }
            currentItem!.isDragging = false;
            onItemStopMoved(draggingItemId);
            endDragEmit(draggingItemId);
        }
        draggingItemId = null;
        draggingBackground = false;
        isDragging = false;
        isBackgroundDragging = false;
        currentItem = null;
    };

    // 在组件创建时就绑定事件监听器
    onMounted(() => {
        document.addEventListener('pointermove', onDrag, { passive: false });
        document.addEventListener('pointerup', stopDrag);
    });

    onUnmounted(() => {
        document.removeEventListener('pointermove', onDrag);
        document.removeEventListener('pointerup', stopDrag);
    });

    return {
        isDragging: isDragging,
        currentItem: currentItem,
        startDrag,
        containerRef,
        startBackgroundDrag
    };
}