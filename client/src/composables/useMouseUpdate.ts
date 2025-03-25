import { updateMouseEmit } from "@/game/game"
import { useGameStore } from "@/stores/game"
import { draggingBackground } from "./useDraggable"
import { storeToRefs } from "pinia";

export const useMouseUpdate = () => {
    const store = useGameStore()
    const { scale } = storeToRefs(store)

    document.addEventListener("mousemove", (event) => {
        const rldom = store.gameDom?.getBoundingClientRect()

        if (rldom && !draggingBackground) {
            updateMouseEmit({
                x: (event.clientX - rldom.x) / scale.value - store.backgroundPosition.x / scale.value,
                y: (event.clientY - rldom.y) / scale.value - store.backgroundPosition.y / scale.value
            })
        }
    })
}