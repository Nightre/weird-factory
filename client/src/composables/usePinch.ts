import { useGameStore } from "@/stores/game";
import { ref } from "vue";
import type { Position } from "./useDraggable";
import { storeToRefs } from "pinia";
export const usePinch = (setScaleOrigin: (newScale: number, x: number, y: number) => number) => {
    let initialDistance = 0;
    let initialScale = 1;
    let lastCenter: Position = { x: 0, y: 0 }
    const store = useGameStore()
    let { isPinching } = storeToRefs(store)
    const touchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
            // 获取两个触摸点
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // 计算初始距离
            initialDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // 记录初始缩放值
            initialScale = store.scale;
            isPinching.value = true

            lastCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };
        }
    }

    const touchMove = (event: TouchEvent) => {
        if (event.touches.length === 2) {
            // 获取两个触摸点
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // 计算当前距离
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // 计算新的缩放比例
            const newScale = initialScale * (currentDistance / initialDistance);

            const currentCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };
            const centerOffset = {
                x: lastCenter.x - currentCenter.x,
                y: lastCenter.y - currentCenter.y,
            }
            lastCenter = { ...currentCenter }

            initialDistance = currentDistance

            // 调用缩放函数，传入新的缩放值和触摸中心点坐标
            initialScale = setScaleOrigin(newScale, currentCenter.x, currentCenter.y);

            store.backgroundPosition.x -= centerOffset.x
            store.backgroundPosition.y -= centerOffset.y
        }
    }

    const touchEnd = (event: TouchEvent) => {
        // 重置状态
        initialDistance = 0;
        initialScale = 1;
        isPinching.value = false
    }

    return {
        touchStart,
        touchMove,
        touchEnd,
    }
}