import { ref, reactive, type Reactive, nextTick } from 'vue';
import { defineStore } from 'pinia';
import type { PlayerList } from '@/utils/type';
import { createInitInputsData, INPUT_TYPE, LOCK_TYPE, MARKET_TYPE, type ITEM_TYPE } from '@/utils/server-enum';
import { getClassInfo, OP, setOutputAndEmit, useModMiddleware, type IRemotePatch } from '@/game/game';
import { updateItemPos, type Position } from '@/composables/useDraggable';
import { useUserStore, type UserInfo } from './user';
import router from '@/router';
export enum STATE {
    LOADING,
    ERROR,
    GAME,
    LOADING_ROOM,
    LOCAKED,
    DISCONNECT
}
export interface IRoomCreateOptions {
    public?: boolean,
    create?: boolean,
    roomId: string,
    levelId?: string
}
export interface IInput extends IInputOption {
    item: string | null
}
export interface IInputOption {
    isShadow?: boolean,
    type?: keyof typeof INPUT_TYPE
}
export interface IItem {
    class_id: string,
    x: number,
    y: number,
    output: string | null,
    outputSlotName: string | null,
    showText: string,
    id: string,
    type: string,
    emoji: string,
    inputs: Record<string, IInput>
    inputEl?: Record<string, HTMLElement>
    el?: HTMLElement
    isLoading: boolean
    isDragging: boolean
    reason: string,
    dragging_user: string,
    owner: string[],
    root: string,
    others: boolean,
    fold: boolean,
    actions: Record<string, Record<string, IInput>>,
    currentAction: string,
    isLocked: boolean,
    privateActions: string[],
    attributes: Record<string, string | number>,
    baseInputs: Record<string, IInput>,
    offset: Position,
    isAction?: boolean,
    hasScript?: boolean,
    classId: string,
    info: string,
}
export interface IRoomList {
    roomId: string,
    playerName: string,
    playerCount: number
}
export interface IClassInfo {
    createdAt: string,
    firstCreater: UserInfo,
    description: string,
    discovedNum: number
}
export interface IActionLine {
    target1: IItem,
    target2: IItem,
    action?: string,
    id: string
}

export interface ILocalItemData {
    inputEl?: HTMLElement[]
    el?: HTMLElement
    root?: string
}

export interface IRoomState {
    roomId: string,
    items: Record<string, IItem>,
    players: Record<string, IPlayerData>,
    market: IMarket[],
    saled: Record<string, {
        name: string,
        prise: number
    }>,
    msg: string[],
    config: {},
    timerStartTime: number,
    public: boolean,
}

export interface IPlayerData {
    private: {
        money: number
    },
    public: {
        x: number,
        y: number,
        money: number,
        name: string,
        playerItem: string,
        team: string[],
    }
}

export interface IMarketItem {
    item: string,
    price: number,
    num: number,
    type: keyof typeof MARKET_TYPE,
    emoji: string,
    divide: boolean,
    text: string
}
export interface ILevelData {
    title: string;
    content: string;
    author: UserInfo;
    likes: number;
    createdAt: string;
    id: string;
    isLiked: boolean;
}

export interface IMarket {
    category: string,
    items: IMarketItem[]
}

export interface IPaggin<T> {
    page: number,
    limit: number,
    total: number,
    data: T[]
}

export const addRemoteMid = () => {
    const store = useGameStore()

    useModMiddleware((patch, patchList) => {

        if (patchList[0] == "items" && patchList.length == 2) {
            const key = patchList[1]
            switch (patch.op) {
                case OP.ADD:
                    console.log("【form server】add item", key)
                    store.itemOreder.push(key)
                    store.ItemLocalData[key] = {}
                    break;
                case OP.REMOVE:
                    console.log("【form server】remove item", key)
                    if (key == store.currentItem?.id) {
                        store.setCurrentItem(null)
                    }
                    store.itemOreder.splice(store.itemOreder.indexOf(key), 1)
                    delete store.ItemLocalData[key]
                    break;
            }
        }

        return patch
    })
}
export const APPLY_TRANS_TIME = 1000 * 5
export const APPLY_TIME = 1000 * 6
export const useGameStore = defineStore('game', () => {
    const roomId = ref('');
    const state = ref(STATE.LOADING);
    const playerList = reactive<PlayerList>([]);

    const isRoomInited = ref(false)
    const roomState = reactive<IRoomState | {}>({});

    const targetConnectItem = ref<string | null>(null);
    const canConnectItem = ref<string | null>(null);
    const canConnectItemSlot = ref<string | null>(null);

    const itemOreder = reactive<string[]>([]);

    const gameDom = ref<HTMLElement | null>(null);

    const backgroundPosition = reactive<Position>({ x: 0, y: 0 })

    const ItemLocalData = reactive<Record<string, ILocalItemData>>({})

    const toolTips = ref<string | null>(null)

    const setRoom = (roomData: any) => {
        isRoomInited.value = true
        roomId.value = roomData.roomId;
        router.replace({ query: { roomId: roomData.roomId } })
    };

    const setPlayerList = (newPlayerList: PlayerList) => {
        playerList.length = 0;
        playerList.push(...newPlayerList);
    };

    const setCanConnect = (minDistanceItem: IItem, targetItems: IItem, minSlot: string | null) => {
        targetConnectItem.value = targetItems.id
        canConnectItem.value = minDistanceItem.id
        canConnectItemSlot.value = minSlot
    }
    const getItem = (id: string) => {
        return (roomState as IRoomState).items[id]
    }

    const clearCanConnect = () => {
        targetConnectItem.value = null
        canConnectItem.value = null
        canConnectItemSlot.value = null
    }

    const setItemHTMLElement = (el: HTMLElement, itemId: string, id: string) => {
        const item = getItem(itemId)

        if (item) {
            if (!item.inputEl) item.inputEl = {}
            item.inputEl[id] = el as HTMLElement
        }

    }

    const getItemHTMLInput = (itemId: string, id: number) => {
        const item = getItem(itemId)
        if (item.inputEl) {
            return item.inputEl[id]
        }
        return null
    }

    const setOutput = (itemId: string, outputId: string | null = null, outputSlot: string | null = null, options: IInputOption = {}) => {
        const item = getItem(itemId)
        const influence = !options.isShadow // 是否影响 item

        if (influence) {
            if (outputId == null) {
                orderTop(item.id)
                updateItemPos(item)
            }

            if (item.output) {
                const oldOutput = getItem(item.output)
                oldOutput.inputs[item.outputSlotName!].item = null
            }
            item.output = outputId
            item.outputSlotName = outputSlot
        }

        if (outputId) {
            const newOutput = getItem(outputId)
            const oldInputId = newOutput.inputs[outputSlot!]?.item
            if (oldInputId && outputSlot) {
                setInput(outputId, null, outputSlot)
            }
            //console.log(newOutput,"的", outputIndex, "设为", itemId)

            const newInput = newOutput.inputs[outputSlot!]
            newInput.item = itemId
            newInput.isShadow = options.isShadow ?? false
        }
    }
    const setInput = (itemId: string, outputId: string | null = null, inputSlot: string, options: IInputOption = {}) => {
        const item = getItem(itemId)
        if (item.inputs[inputSlot] && item.inputs[inputSlot].item && !item.inputs[inputSlot].isShadow) {
            setOutput(item.inputs[inputSlot].item, null, null)
        }

        if (outputId) {
            setOutput(outputId, itemId, inputSlot, options)
        } else {
            item.inputs[inputSlot].item = null
        }

        return true
    }
    const getAllChildren = (itemId: string, includeSelf = false) => {
        const item = getItem(itemId)
        const children: IItem[] = includeSelf ? [item] : []

        Object.values(item.inputs).forEach(childId => {
            if (childId.item) children.push(...getAllChildren(childId.item, true))
        })

        return children
    }

    const getOrder = (id: string) => {
        return itemOreder.indexOf(id)
    }

    const orderTop = (id: string) => {
        itemOreder.splice(itemOreder.indexOf(id), 1)
        itemOreder.push(id)
    }

    const getSelfData = () => {
        const store = useUserStore()
        if (store.isLogin) {
            const useId = (store.userInfo as UserInfo).id
            if (isRoomReady()) {
                return (roomState as IRoomState).players[useId]
            }
        }
    }
    const getPlayerData = (playerId: string) => {
        if (isRoomReady()) {
            const user = (roomState as IRoomState).players[playerId]
            return user?.public
        }
    }
    const isRoomReady = () => {
        return 'players' in roomState && 'market' in roomState && 'items' in roomState
    }

    const setItemLoading = (itemId: string, isLoading: boolean) => {
        getItem(itemId).isLoading = isLoading
    }

    const snap = ref(false)
    const targetSlot = ref<string | null>(null)
    const targetSlotItem = ref<IItem | null>(null)
    const hasTargetSlot = ref(false)
    const isGameOver = ref(false)

    const setTargetSlot = (item: IItem | null, newTargetSlot: string | null) => {
        targetSlot.value = newTargetSlot
        targetSlotItem.value = item
        hasTargetSlot.value = Boolean(item && newTargetSlot)
    }
    const setTargetSlotValue = (id: string) => {
        if (targetSlotItem.value && targetSlot.value) {
            setOutputAndEmit(id, targetSlotItem.value.id, targetSlot.value, { isShadow: true })
        }
    }
    const gameOver = () => {
        isGameOver.value = true
    }

    const setInputName = (itemId: string, newInputNames: Record<string, IInput>, changeItem: boolean = true) => {
        const item = getItem(itemId)
        newInputNames = { ...item.baseInputs, ...newInputNames }
        for (const inputName in item.inputs) {
            if (!(inputName in newInputNames)) {
                changeItem && setInput(item.id, null, inputName, item.inputs[inputName])// && item.inputs[inputName].item.setOutput(null, null)
                delete item.inputs[inputName]
            }
        }

        for (const inputName in newInputNames) {
            const newItem = newInputNames[inputName]?.item
            const oldItem = item.inputs[inputName]?.item

            const oldInput = item.inputs[inputName]
            const newInput = newInputNames[inputName]

            item.inputs[inputName] = createInitInputsData(Object.assign({}, item.inputs[inputName], newInput) as IInput) // 设为新的Inputs但是保持item不变

            if (changeItem && (oldItem !== newItem || oldInput?.isShadow !== newInput?.isShadow)) {
                if (oldItem) {
                    // 如果新的 inputs 是 null，那么需要先把旧的output设为null，但是 inputs 不是 null 的话会自动挤出
                    setInput(oldItem, null, inputName, oldInput)
                }
                if (newItem) { // 需要改变 
                    setInput(newItem, item.id, inputName, newInput)
                }
            }
        }
    }

    const setAction = (itemId: string, action: string) => {
        const item = getItem(itemId)
        item.actions[action] && setInputName(itemId, item.actions[action], false)
    }
    const actionLines = reactive<IActionLine[]>([])
    const addActionLine = (target1: string, target2: string, action?: string) => {
        const targetActionLines = { target1: getItem(target1), target2: getItem(target2), action, id: Date.now().toString() }
        actionLines.push(targetActionLines)

        // 10秒后删除该线条
        setTimeout(() => {
            const lineIndex = actionLines.indexOf(targetActionLines)
            if (lineIndex !== -1) {
                actionLines.splice(lineIndex, 1)
            }
        }, APPLY_TRANS_TIME)
    }

    const scale = ref(1)
    const getGlobalPos = (item: IItem) => {
        const root = getItem(item.root)
        return {
            x: (root?.x ?? 0) + (item.offset?.x ?? 0),
            y: (root?.y ?? 0) + (item.offset?.y ?? 0)
        }
    }
    const isAlive = (item: IItem) => {
        if (!item) {
            return false
        }
        return item.id in (roomState as IRoomState).items
    }
    const hoverItem = ref<IItem>();
    const setHoverItem = (id: string) => {
        hoverItem.value = getItem(id)
    }
    const clearHoverItem = () => {
        hoverItem.value = undefined
    }

    const gameCreateData = reactive<IRoomCreateOptions>({
        public: false,
        create: false,
        roomId: ''
    })

    const reset = () => {
        // 重置房间相关状态
        roomId.value = '';
        state.value = STATE.LOADING;
        isRoomInited.value = false;
        Object.assign(roomState, {});

        // 清空玩家列表
        playerList.length = 0;

        // 重置连接和物品状态
        targetConnectItem.value = null;
        canConnectItem.value = null;
        canConnectItemSlot.value = null;
        itemOreder.length = 0;
        Object.assign(ItemLocalData, {});

        // 重置UI相关状态
        toolTips.value = null;
        snap.value = false;
        targetSlot.value = null;
        targetSlotItem.value = null;
        hasTargetSlot.value = false;
        isGameOver.value = false;
        scale.value = 1;
        hoverItem.value = undefined;

        // 重置背景位置
        backgroundPosition.x = 0;
        backgroundPosition.y = 0;

        // 清空动作线条
        actionLines.length = 0;

        // 重置游戏创建数据
        Object.assign(gameCreateData, {
            public: false,
            create: false,
            roomId: ''
        });

        // 重置DOM引用
        gameDom.value = null;
    }
    const currentItem = ref<IItem | null>();
    const currentItemInfo = reactive<IClassInfo>({} as IClassInfo)

    const setCurrentItem = async (id: string | null) => {
        currentItem.value = id ? getItem(id) : null
        if (currentItem.value) {
            Object.assign(currentItemInfo, await getClassInfo(currentItem.value.classId))
        }
    }
    const isPinching = ref(false)
    const resetBackgroundPos = () => {
        const reat = gameDom.value!.getBoundingClientRect()
        backgroundPosition.x = reat.width / 2
        backgroundPosition.y = reat.height / 2
        scale.value = 1
    }

    return {
        roomId,
        state,
        playerList,
        roomState,
        targetConnectItem,
        canConnectItem,
        canConnectItemSlot,
        itemOreder,
        gameDom,
        backgroundPosition,
        isRoomInited,
        ItemLocalData,
        toolTips,
        targetSlot,
        snap,
        targetSlotItem,
        hasTargetSlot,
        isGameOver,
        actionLines,
        scale,
        hoverItem,
        gameCreateData,
        currentItem,
        currentItemInfo,
        isPinching,

        //////////
        resetBackgroundPos,
        setCurrentItem,
        getGlobalPos,
        addActionLine,
        gameOver,
        setTargetSlotValue,
        setTargetSlot,
        getPlayerData,
        isRoomReady,
        setItemLoading,
        getSelfData,
        orderTop,
        getOrder,
        getAllChildren,
        setOutput,
        setInput,
        getItemHTMLInput,
        setItemHTMLElement,
        clearCanConnect,
        setRoom,
        setPlayerList,
        setCanConnect,
        getItem,
        setInputName,
        setAction,
        isAlive,
        setHoverItem,
        clearHoverItem,
        reset
    };
});
