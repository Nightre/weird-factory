import { ref } from 'vue';
import { draggingItemId, type Position } from './useDraggable';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';

const minScale = 0.1
const maxScale = 2

export function useZoomable() {
    const store = useGameStore()
    const { scale } = storeToRefs(store)

    const setScaleOrigin = (newScale: number, x: number, y: number) => {
        const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
        if (clampedScale === scale.value) return clampedScale;
        
        const gameDom = store.gameDom;
        if (!gameDom) return clampedScale;

        const rect = gameDom.getBoundingClientRect();
        const mouseX = x - rect.left;
        const mouseY = y - rect.top;

        const contentX = (mouseX - store.backgroundPosition.x) / scale.value;
        const contentY = (mouseY - store.backgroundPosition.y) / scale.value;

        scale.value = clampedScale;

        const newX = mouseX - contentX * clampedScale;
        const newY = mouseY - contentY * clampedScale;

        store.backgroundPosition.x = newX;
        store.backgroundPosition.y = newY;

        return clampedScale
    }

    const setScale = (newScale: number) => {
        const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
        if (clampedScale === scale.value) return;

        const gameDom = store.gameDom;
        if (!gameDom) return;

        // Get viewport dimensions
        const rect = gameDom.getBoundingClientRect();
        const viewportCenterX = rect.width / 2;
        const viewportCenterY = rect.height / 2;

        // Calculate content coordinates at viewport center with current scale
        const contentX = (viewportCenterX - store.backgroundPosition.x) / scale.value;
        const contentY = (viewportCenterY - store.backgroundPosition.y) / scale.value;

        // Update scale first
        scale.value = clampedScale;

        // Calculate new position to keep content centered at viewport middle
        const newX = viewportCenterX - contentX * clampedScale;
        const newY = viewportCenterY - contentY * clampedScale;

        // Update background position
        store.backgroundPosition.x = newX;
        store.backgroundPosition.y = newY;
    }
    
    const handleWheel = (event: WheelEvent) => {
        const gameDom = store.gameDom;
        if (!gameDom) return;
        if (draggingItemId) return

        const rect = gameDom.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const contentX = (mouseX - store.backgroundPosition.x) / scale.value;
        const contentY = (mouseY - store.backgroundPosition.y) / scale.value;

        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(scale.value + delta, minScale), maxScale);

        if (newScale !== scale.value) {
            const newX = mouseX - contentX * newScale;
            const newY = mouseY - contentY * newScale;

            store.backgroundPosition.x = newX;
            store.backgroundPosition.y = newY;
            scale.value = newScale;
        }
    };

    return {
        scale,
        handleWheel,
        setScale,
        setScaleOrigin
    };
}