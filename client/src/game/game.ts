import { STATE, useGameStore, type IClassInfo, type IInputOption, type IItem, type IPlayerData, type IRoomCreateOptions, type IRoomState } from "@/stores/game";
import type { PlayerList } from "@/utils/type";
import { storeToRefs } from "pinia";
import { io, Socket } from "socket.io-client";
import { useToast } from "vuestic-ui";
export let socket: Socket
// @ts-ignore
import { compare } from 'fast-json-patch/index.mjs';
//@ts-ignore
import { applyPatch } from 'fast-json-patch/index.mjs';
import { ATTRIBUTES, INPUT_TYPE, ITEM_TYPE, LOCK_TYPE } from "@/utils/server-enum";
import { abs2gamePos, type Position } from "@/composables/useDraggable";
import { getToken, useUserStore } from "@/stores/user";

export enum OP {
    ADD = "add",
    REPLACE = 'replace',
    REMOVE = 'remove'
}

export interface IRemotePatch {
    op: OP
    value: any
    path: string
}

const isPrimitive = (value: any): boolean => {
    return value === null ||
        ['string', 'number', 'boolean', 'undefined'].includes(typeof value);
}

//type PatchMiddleware = (patch: string, path: string[]) => boolean;
type ModMiddleware = (patch: IRemotePatch, path: string[]) => any;


//const patchMiddlewares: PatchMiddleware[] = [];
const modMiddlewares: ModMiddleware[] = [];

const expandPatchArray = (patchs: IRemotePatch[]) => {
    return patchs.reduce((a, b) => {
        a.push(...expandPatch(b));
        return a;
    }, [] as IRemotePatch[]);
}

const expandPatch = (patch: IRemotePatch): IRemotePatch[] => {
    if (isPrimitive(patch.value)) {
        return [patch];
    }

    const patches: IRemotePatch[] = [];

    if (typeof patch.value === 'object' || Array.isArray(patch.value)) {
        patches.push(patch);

        for (const [key, value] of Object.entries(patch.value)) {
            const newPath = `${patch.path}/${key}`;
            patches.push(...expandPatch({
                op: patch.op,
                path: newPath,
                value: value
            }));
        }
    }

    return patches.length > 0 ? patches : [patch];
}


export const useModMiddleware = (middleware: ModMiddleware) => {
    modMiddlewares.push(middleware);
}

// export const usePatchMiddleware = (middleware: PatchMiddleware) => {
//     patchMiddlewares.push(middleware);
// }

const runModMiddlewares = (patches: IRemotePatch[]) => {
    patches.forEach(patch => {
        modMiddlewares.forEach(middleware => {
            middleware(patch, patch.path.split("/").slice(1))
        })
    })
}

// const runPatchMiddlewares = (patchs: IRemotePatch[]): IRemotePatch[] => {

//     return patchs.filter(patch => {
//         return patchMiddlewares.every(middleware => middleware(patch.path, patch.path.split("/").slice(1)));
//     });
// }


export const create = async (options: IRoomCreateOptions) => {
    const store = useGameStore()
    const userStore = useUserStore()
    const { setPlayerList, setRoom } = store
    const { state } = storeToRefs(store)
    const { roomState } = store
    const { notify } = useToast()

    let sequenceNumber = 0;
    console.log("创建SocketIO实例，连接到：", import.meta.env.VITE_SOCKET_SERVER_URL, options)
    socket = io(import.meta.env.VITE_SOCKET_SERVER_URL, {
        query: options,
        auth: {
            token: await getToken()
        },
        path: "/ws/",
        reconnection: false,
    });

    socket.on("player_list", (player_list: PlayerList) => {
        setPlayerList(player_list)
    })
    socket.on('connect', () => {
        console.log('Connected to server');
        state.value = STATE.LOADING_ROOM
        sequenceNumber = 0
    })

    socket.on('disconnect', () => {
        state.value = STATE.DISCONNECT
    })

    socket.on('error', (err) => {
        notify({ message: err, color: 'danger' })
        state.value = STATE.ERROR
    })

    socket.on('joined_room', async (gameInfo) => {

        const response = await socket.emitWithAck("get_full_game_data")

        const patch = compare(roomState, response)
        applyPatchState({ patch })
        state.value = STATE.GAME
        setRoom(gameInfo)


        socket.emit("ready")
    })
    socket.on('room_locked', () => {
        state.value = STATE.LOCAKED
    })
    socket.on('new_item_discoverd', (className: string, userName: string) => {
        notify({ message: `${userName} 发现了新物品 < ${className} >`, position: "top-center" })
    })
    //new_max_prise
    socket.on('new_max_prise', (userName: string, price: number, className: string) => {
        notify({ message: `🏆 ${userName} 的 < ${className} > 以 ${price} 钱币突破最高🏆`, color: "#5d0cf8", position: "top-center" })
    })
    //Object.assign(roomState, response)
    socket.on('script_apply_item', (itemID: string, applyItemId: string, emoji: string) => {
        store.addActionLine(itemID, applyItemId, emoji)
    })
    socket.on('change_state', async (data) => {
        sequenceNumber = await applyPatchState(data, sequenceNumber) as number;
    })
    socket.on('receiving', () => {
        notify({ message: `进货了！`, position: "top-center" })
    })
    socket.on('suprise', () => {
        notify({ message: `🎁有惊喜！！快去查看送货点！🎁`, position: "top-center" })
    })
    socket.on('player_death', (clientId) => {
        if (userStore.getSelfId() == clientId) {
            store.gameOver()
        }
        notify({ message: `玩家 ${(store.roomState as IRoomState).players[clientId].public.name} 死了`, position: "top-center", color: "danger" })
    })
    return socket
}

export const applyPatchState = async (data: any, sequenceNumber?: number, exc = true) => {
    const store = useGameStore()
    if (typeof sequenceNumber == "number") {
        sequenceNumber += 1
    }

    if (typeof sequenceNumber == "number" && sequenceNumber != data.sequenceNumber) {
        const response = await socket.emitWithAck("get_full_game_data")
        const patch = compare(store.roomState, response)
        applyPatchState({ patch })
        console.log("❓ 数据不同步，全量更新")
        sequenceNumber = data.sequenceNumber + 1
    }

    //let filteredPatch = runPatchMiddlewares(data.patch)
    runModMiddlewares(expandPatchArray(data.patch))

    if (exc) {
        applyPatch(store.roomState, data.patch);
    }

    return sequenceNumber
}

export const moveItemEmit = (id: string, position_x: number, position_y: number) => {
    socket.emit("move_item", { id, position_x, position_y })
}

export const moveItem = (item: IItem, position_x: number, position_y: number) => {
    detectingConnections(item)
    moveItemEmit(item.id, position_x, position_y)
}

const getDistanceElem = (a: HTMLElement, b: HTMLElement): number => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();

    const dxTopLeft = rectA.left - rectB.left;
    const dyTopLeft = rectA.top - rectB.top;
    const distanceTopLeft = Math.sqrt(
        dxTopLeft * dxTopLeft + dyTopLeft * dyTopLeft
    );

    return distanceTopLeft;
};

export const detectingConnections = (targetItems: IItem) => {
    const store = useGameStore()
    const roomState = store.roomState as IRoomState
    const { setCanConnect, clearCanConnect } = store
    clearCanConnect()

    let minDistance = Infinity
    let minDistanceItem: IItem | null = null
    let minSlot: string | null = null

    if (targetItems.isLocked && targetItems.others) {
        return
    }

    Object.values(roomState.items).forEach(item => {
        if (item.isLoading || (item.root == targetItems.root)) {
            return
        }

        const distance = getDistanceElem(item.el!, targetItems.el!)
        if (targetItems.el) {
            for (const key in item.inputEl) {
                const distance = getDistanceElem(item.inputEl[key], targetItems.el!)
                if (item.inputs[key] && item.inputs[key].type == INPUT_TYPE.PRIVATE && item.others) {
                    continue
                }

                if (distance < minDistance) {
                    minDistance = distance
                    minDistanceItem = item
                    minSlot = key
                }
            }
        }

        if (distance < minDistance && !item.output && !(item.isLocked && item.others)) {
            minDistance = distance
            minDistanceItem = item
            minSlot = null
        }
    })

    if (minDistanceItem && minDistance < 20) {
        setCanConnect(minDistanceItem as IItem, targetItems, minSlot)
    }
}

export const moveItemStop = (id: string) => {
    const store = useGameStore()
    const { clearCanConnect, setItemLoading } = store
    const { targetConnectItem, canConnectItem, canConnectItemSlot } = store // 直接结构不需要响应式
    const { notify } = useToast()

    if (canConnectItem && targetConnectItem) {
        if (canConnectItemSlot !== null) {
            setOutputAndEmit(targetConnectItem, canConnectItem, canConnectItemSlot)
        } else {
            setItemLoading(targetConnectItem, true)
            setItemLoading(canConnectItem, true)
            socket.emit("synthesis_item", { id1: targetConnectItem, id2: canConnectItem }, (result: any) => {
                if (result.error) {
                    // 因为是自己开启的loading，所以自己结束loading，其他人是服务器开启loading，服务器没有开启
                    setItemLoading(targetConnectItem, false)
                    setItemLoading(canConnectItem, false)
                    notify({ message: result.error, color: "warning", position: "top-center" })
                }
            })
        }
    }

    clearCanConnect()
}

export const setOutputAndEmit = (id: string, output_id: string | null, outputSlotName: string | null, options: IInputOption = {}) => {
    const { setOutput } = useGameStore()
    setOutput(id, output_id, outputSlotName, options)

    socket.emit("set_output", { id, output_id, outputSlotName, options })
}
export const setInputAndEmit = (id: string, input_id: string | null, inputSlotName: string, options: IInputOption = {}) => {
    const { setInput } = useGameStore()
    setInput(id, input_id, inputSlotName, options)

    socket.emit("set_input", { id, input_id, inputSlotName, options })
}

interface IActionResult { isSubmit: boolean, price: number, error: string, name: string, reason: string }

export const regenItem = (id: string) => {

}

export const actionMachine = (id: string, action: string) => {
    const { notify } = useToast()
    const store = useGameStore()
    store.setItemLoading(id, true)
    socket.emit("action_machine", { id, action }, (result: IActionResult) => {
        store.setItemLoading(id, false)
        if (result && result.error) {
            notify({ message: result.error, color: "warning", position: "top-center" })
        }
    })
}

export const buyItemEmit = (category: number, index: number) => {
    const store = useGameStore()
    const dom = store.gameDom?.getBoundingClientRect()
    if (dom) {
        // 获取GameDom 中心点
        const position = abs2gamePos({ x: dom.width * 0.7, y: dom.height * 0.5 })
        socket.emit("buy_item", { category, index, position })
    }
}

export const updateMouseEmit = (data: Position) => {
    socket.emit('mouse_move', data)
}

export const startDragEmit = (id: string) => {
    socket.emit('start_drag', { id })
}

export const endDragEmit = (id: string) => {
    socket.emit('end_drag', { id })
}

export const setFold = (id: string, fold: boolean) => {
    socket.emit('set_fold', { id, fold })
}

export const createNewActionsByAI = (id: string, actions: Record<string, unknown>) => {
    const store = useGameStore()
    store.setItemLoading(id, true)
    const { notify } = useToast()
    return new Promise<void>((reslove) => socket.emit('set_action_list', { id, actions }, (data: { error?: string }) => {
        if (data?.error) {
            notify({ message: data.error, color: "warning", position: "top-center" })
        }
        store.setItemLoading(id, false)
        reslove()
    }))
}

export const setAction = (id: string, action: string) => {
    const store = useGameStore()
    store.setAction(id, action)
    socket.emit('set_action', { id, action })
}

export const setLock = (id: string, lock: boolean) => {
    socket.emit('set_lock', { id, lock })
}

export const getClassInfo = (classId: string) => {
    return new Promise((resolve) => {
        socket.emit('get_class_info', { classId }, (data: IClassInfo) => {
            resolve(data)
        })
    })

}

export const reset = () => {
    modMiddlewares.length = 0
    useGameStore().reset()
    socket.disconnect()
    //sequenceNumber = 0
}

export const sendMessageEmit = async (message: string) => {
    socket.emit('send_message', { message })
}