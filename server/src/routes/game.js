import { Router } from 'express';
import jwt from 'jsonwebtoken';
import roomManager, { Room } from '../game/room-manager.js';
import { Server, Socket } from 'socket.io';
import config from '../config.js';
import { ATTRIBUTES, ITEM_TYPE, Level, LOCK_TYPE, MARKET_TYPE, TEAM, User } from '../model.js';
import { GameLogic, InventoryItem } from '../game/game-logic.js';
import { getRandomItem, getUserById, randomItem, returnSuccess, toDict, toInputs } from '../uitls.js';
import { GAME_CONFIG } from '../game-data/game-config.js';
import { INPUT_TYPE } from '../model.js'
const router = Router();

router.get("/room_list", (req, res) => {
    return returnSuccess(res, "获取房间列表成功", roomManager.getRoomList(res.locals.user))
})

class GameRoom extends Room {

    static RECEIVING_TIME = 1000 * 60 * 5
    static ONE_SECOND_TIME = 1000
    static APPLY_TIME = 1000 * 6
    static APPLY_TRANS_TIME = 1000 * 1

    constructor(roomId, options) {
        //if (!options.config) options.config = GAME_CONFIG
        super(roomId, options)
        this.public = options.public || false
        this.game = new GameLogic([], undefined, {
            updateItemsState: this.updateItemsState.bind(this),
            getMainUser: this.getMainUser.bind(this),
        })

        this.initState(this.game.toJson())

        this.price = new Map
        this.maxHighestPrise = 0

        this.dragging = {}
        this.setIntervals()
        this.setEvents()
    }

    setEvents() {
        this.game.on("applyChange", (itemID, applyItemId, emoji) => {
            if (itemID != applyItemId) {
                this.options.onScriptApplyItem(itemID, applyItemId, emoji)
            }
        })
        this.game.on("moneyChange", (player, money) => {
            this.setPlayerMoney(player, money)
        })
    }

    setIntervals() {
        this.state.timerStartTime = Date.now()
        setInterval(() => {
            this.receiving()
        }, GameRoom.RECEIVING_TIME)

        // setInterval(() => {
        //     this.suprise()
        // }, GameRoom.SUPRISE_TIME);

        // setInterval(() => {
        //     const change = Number(this.game.moneyChangeEmit()) || 0
        //     this.clientList.forEach(client => {
        //         this.addPlayerMoney(client.user._id, change)
        //     })
        // }, GameRoom.ONE_SECOND_TIME)

        setInterval(() => {
            this.game.applyScript()
            this.updateItemsState()
        }, GameRoom.APPLY_TIME)
    }

    receiving() {
        this.options.onReceiving()

        this.state.market = this.gameConfig.market_data
    }
    // async suprise() {
    //     for (let index = 0; index < 5; index++) {
    //         await this.game.addItemFromJson(randomItem(GAME_CONFIG.SUPRISE))
    //     }
    //     await this.updateItemsState()
    //     this.options.onSuprise()
    // }
    initState(state) {
        super.initState(state)
        this.state.market = this.gameConfig.market_data
        this.state.saled = {}
        this.state.msg = []
        this.state.public = this.public
    }
    async init(createrId) {

        if (this.gameConfig.init_items) {
            for (const item of this.gameConfig.init_items) {
                await this.game.createFromJSON(item, createrId)
            }
        }

        // const pos = (i, y = 0) => { return { position_x: i * 110, position_y: y * 150 } }
        // //await this.game.addItem("冲锋枪", "🔫")

        // await this.game.addItemFromJson({
        //     ...pos(0, 1),
        //     className: "手枪",
        //     emoji: "🔫",
        //     actions: {
        //         "攻击": {
        //             "攻击目标": { type: INPUT_TYPE.ALLOW_REFERENCE }
        //         }
        //     },
        //     inputs: { "攻击目标": InventoryItem.createInputData({ type: INPUT_TYPE.ALLOW_REFERENCE }) },
        // }, createrId)
        // await this.game.addItemFromJson({
        //     ...pos(0, 0),
        //     className: "坏蛋",
        //     emoji: "😈",
        //     actions: { "求饶": { "求饶金": INPUT_TYPE.NORMAL } },
        //     script: `current.mainTick = (data)=>{
        //     }`
        // }, createrId)
        // await this.game.addItemFromJson({
        //     ...pos(0, 0),
        //     className: "植物",
        //     emoji: "🌿",
        //     attributes: { "水分": 0 },
        // }, createrId)
        // await this.game.addItemFromJson({
        //     ...pos(0, 0),
        //     className: "植物",
        //     emoji: "🌿",
        //     attributes: { "水分": 0 },
        // }, createrId)
        // await this.game.addItemFromJson({
        //     ...pos(0, 0),
        //     className: "植物",
        //     emoji: "🌿",
        //     attributes: { "水分": 0 },
        // }, createrId)
        // await this.game.addItemFromJson({
        //     ...pos(0, 0),
        //     className: "洒水器",
        //     emoji: "💦",
        //     script: `current.mainTick = (data)=>{
        //         current.findItems().forEach(item=>{
        //             if (item.name.includes("植物")) {
        //                 current.applyChange({
        //                     change: {
        //                         [item.id]: {
        //                             attributes: {
        //                                 "水分": item.attributes["水分"] + 1
        //                             },
        //                             actionEmoji: "💦"
        //                         }
        //                     }
        //                 })
        //             }
        //         })
        //     }`
        // }, createrId)

        // await this.game.addItemFromJson({
        //     ...pos(-1),
        //     className: "美食家",
        //     fold: false,
        //     emoji: "👨‍🍳", // 美食家用厨师表情
        //     type: ITEM_TYPE.SUBMIT,
        //     inputs: toDict(["卖物"]),
        //     actions: { "卖掉": 0 }
        // })

        // await this.game.addItemFromJson({
        //     ...pos(1),
        //     className: "低价收购",
        //     fold: false,
        //     emoji: "💰", // 低价收购用钱袋
        //     type: ITEM_TYPE.SUBMIT,
        //     info: "买东西",
        //     actions: { "卖掉": { "卖物": INPUT_TYPE.NORMAL }, "申请破除": { "卖物": INPUT_TYPE.NORMAL } },
        //     privateActions: ["申请破除"],
        // }, createrId)

        // await this.game.addItemFromJson({
        //     ...pos(3),
        //     className: "抢劫商店",
        //     fold: false,
        //     emoji: "🔫", // 抢劫用手枪
        //     type: ITEM_TYPE.MACHINE,
        //     inputs: toInputs(["抢劫武器"]),
        //     actions: { "抢劫超市": {}, "抢劫菜市场": {}, "抢劫政府金库": {}, "抢劫银行": {} }
        // })

        // await this.game.addItemFromJson({
        //     ...pos(5),
        //     className: `森林[地区]`,
        //     fold: false,
        //     emoji: "🌳", // 森林用树
        //     inputs: toDict(["坐骑"]),
        //     actions: { "继续探索": 0, "探索脚下": 0, "吹口哨": 0 },
        //     attributes: {
        //         "当前环境": "潮湿昏暗",
        //         "植物数量": "多",
        //         "周围动物": "隐隐约约有",
        //         "周围水量": "干燥",
        //     }
        // })

        // await this.game.addItemFromJson({
        //     ...pos(7),
        //     className: `小池塘[地区]`,
        //     fold: false,
        //     emoji: "💧", // 池塘用水滴
        //     actions: { "随便翻翻": 0 },
        //     attributes: {
        //         "水质": "藻类居多",
        //         "鱼量": "未知",
        //     }
        // })

        // await this.game.addItemFromJson({
        //     ...pos(9),
        //     className: `大矿山[地区]`,
        //     fold: false,
        //     emoji: "⛏️", // 矿山用矿镐
        //     actions: { "观察一下": 0 },
        //     attributes: {
        //         "矿类": "铁，煤，铜，金",
        //     },
        //     info: "可以探索出一些矿洞，然后放到inputs里面"
        // })

        // await this.game.addItemFromJson({
        //     ...pos(11),
        //     className: `探索新区域[地区]`,
        //     fold: false,
        //     emoji: "🗺️", // 探索用地图
        //     actions: { "观察一下": 0 },
        //     attributes: {},
        //     info: "探索的话就创建一个新的 地区，可以是 xx城市，比如生成一个深圳市，或者一个奇怪的地方，比如 卢本伟广场"
        // })
        // await this.game.addItemFromJson({
        //     ...pos(3),
        //     className: `增加湿机`,
        //     fold: false,
        //     emoji: "🏙️", // 大都市用城市天际线
        //     actions: { "增湿": { "物品": INPUT_TYPE.NORMAL } },
        //     attributes: {},
        // }, createrId)

        // await this.game.addItemFromJson({
        //     ...pos(13),
        //     className: `丁真大都市[地区]`,
        //     fold: false,
        //     emoji: "🏙️", // 大都市用城市天际线
        //     actions: { "观察一下": {} },
        //     attributes: {
        //         "繁荣程度": "顶级城市",
        //         "求职难度": "极高",
        //         "市长": "丁真",
        //     },
        //     owner: [TEAM.AI],
        // }, createrId)
        this.state.items = this.game.toJson().items
    }
    async updateItemsState() {
        this.state.items = this.game.toJson().items
    }
    getMainUser() {
        return this.clientList[0]?.user
    }
    getUserPrivateInitState(user, client) {
        return {
        }
    }
    getUserPublicInitState(user, client) {
        return {
            x: 0, y: 0, money: this.gameConfig.init_money, name: user.name, playerItem: null, team: client.team
        }
    }
    async mouseMove(data, userId) {
        const playerPublic = this.state.players[userId].public
        playerPublic.x = data.x
        playerPublic.y = data.y
    }
    async moveItem(data) {
        this.game.getItemById(data.id)?.moveTo(data.position_x, data.position_y)
        await this.updateItemsState()
    }
    async setOutput(data) {
        const item = typeof data.output_id == "string" ? this.game.getItemById(data.output_id) : null
        this.game.getItemById(data.id)?.setOutput(item, data.outputSlotName, data.options)
        await this.updateItemsState()
    }
    async setInput(data) {
        const item = typeof data.input_id == "string" ? this.game.getItemById(data.input_id) : null
        this.game.getItemById(data.id)?.setInput(item, data.inputSlotName, data.options)
        await this.updateItemsState()
    }
    async removeItem(data) {
        this.game.removeItemById(data.id)
        await this.updateItemsState()
    }
    async actionMachine(data, userId) {
        this.game.startLoading(data.id)
        await this.updateItemsState()
        const client = this.clients[userId]
        const result = await this.game.actionMachine(
            data.id,
            data.action,
            client.wareroom,
            Object.keys(this.state.saled),
            userId
        )

        this.game.endLoading(data.id)

        // if (result.error) {
        //     await this.updateItemsState()
        //     return result
        // }

        // if (result && result.price) {
        //     this.addPlayerMoney(userId, result.price)
        //     if (result.price > this.maxHighestPrise) {
        //         this.maxHighestPrise = result.price
        //         this.options.newHighestPrise(userId, result.price, result.name)
        //     }
        //     this.state.saled[result.name] = {
        //         prise: result.price,
        //         name: client.user.name
        //     }
        // }

        await this.updateItemsState()
        return result
    }
    async addMessage(data) {
        this.state.msg.push(data)
    }

    async synthesisItem(data, userId) {
        await this.updateItemsState()
        this.game.startLoading(data.id1)
        this.game.startLoading(data.id2)
        const result = await this.game.synthesis(data.id1, data.id2, userId)

        if (result.error) {
            this.game.endLoading(data.id1)
            this.game.endLoading(data.id2)
            return result
        }

        await this.updateItemsState()
        return {}
    }
    async buyItem(data, userId) {
        const index = data.index
        const category = data.category
        const state = this.state

        const item = state.market[category].items[index]
        const player = state.players[userId]

        if (item.divide) {
            return
        }

        if (item) {
            if (item.num > 0 && player.public.money >= item.price) {
                item.num -= 1
                await this.addBuyItem(item, data.position, userId)
            }
        }

        state.items = this.game.toJson().items
        this.addPlayerMoney(userId, -item.price)
    }
    async addBuyItem(marketItem, position, userId) {
        if (marketItem.divide) {
            return
        }
        const pos = { position_x: position.x - 200, position_y: position.y - 50 }

        //this.game.create(marketItem.item, marketItem.actions)
        await this.game.createFromJSON(marketItem, {
            ...pos,
            owner: [TEAM.PLAYER]
        }, userId)
    }
    async startDragging(id, userId) {
        this.game.startDrag(id, userId)
        await this.updateItemsState()
    }
    async endDragging(id, userId) {
        this.game.endDrag(id, userId)
        await this.updateItemsState()
    }
    async initPlayer(client) {
        super.initPlayer(client)
        client.wareroom = await this.game.addItemFromJson({
            className: `玩家 ${client.user.name}`,
            emoji: "📦",
            type: ITEM_TYPE.WAREROOM,
            actions: { "吃物品": {}, "食用物品": {} },
            attributes: {
                [ATTRIBUTES.MONEY]: this.gameConfig.init_money,
                "饱食度": "饱腹",
                "心情": "平静",
                "血量": "满血",
                "体力": "充足"
            },
            owner: [client.user.id],
            reason: "我是一个玩家",
            player: client.user.id,
        }, client.user.id)
        this.setPlayerMoney(client.user.id, this.gameConfig.init_money)
        // const playerId = client.wareroom.id
        // await this.game.addItemFromJson({
        //     className: `狗`,
        //     emoji: "🐕",
        //     inputs: {},
        //     actions: { "喂食": { "物品": INPUT_TYPE.NORMAL }, "玩耍": { "物品": INPUT_TYPE.NORMAL } },
        //     attributes: {
        //         "饱食度": 500,
        //     },
        //     fold: false,
        //     script: `
        //     current.init = ()=>{current.time=3}
        //     current.mainTick = (data)=>{
        //         const playerAttributes = current.getItemById("${playerId}").attributes

        //         current.applyChange({
        //             create: current.time <= 0 ? [
        //                 {
        //                     "name": "狗蛋的狗屎", 
        //                     "id": 4,
        //                     "emoji": "💩",
        //                     "reason": "臭臭的。。。",
        //                 }
        //             ]:[],
        //             changeSelf:{
        //                 attributes:{
        //                     "饱食度": data.attributes["饱食度"] - 1,
        //                     "名字": "狗蛋",
        //                 }
        //             },
        //             change:{
        //                 "${playerId}":{
        //                     attributes:{
        //                         ...playerAttributes,
        //                         "金钱": playerAttributes["金钱"] - 1,
        //                     },
        //                     actionEmoji:"💰"
        //                 }
        //             }
        //         })
        //         if(data.attributes["饱食度"] <= 0) {
        //             current.applyByGPT("杀死这只狗，然后留下遗书。并且删除这条狗")
        //             data.attributes["饱食度"] = 0
        //         }
        //         if(current.time <= 0) current.time = 3;
        //         current.time -= 1;
        //     }`

        // })
        client.wareroom.on("remove", () => {
            this.options.onPlayerDeath(client)
            this.initPlayer(client)
        })
        this.state.players[client.user.id].public.playerItem = client.wareroom.id

        await this.updateItemsState()
    }
    async addClient(client, options) {
        //await this.initPlayer(client)
        await super.addClient(client, options)
        await this.addMessage(`<${client.user.name}> 加入了游戏`, [client])
    }
    async removeClient(client) {
        await this.addMessage(`<${client.user.name}> 退出了游戏`)
        await super.removeClient(client)
        await this.game.removeItemById(client.wareroom)
    }
    canReadState(client, path, op) {
        if (path[0] == "items" && ["x", "y"].includes(path[2])) {
            if (this.game.getItemById(path[1]).draggingUser == this.getClientUserId(client)) {
                return false
            }
        }

        return super.canReadState(client, path, op)

    }
    ready(userId) {
        super.ready(userId)
    }
    setPlayerMoney(userId, money) {
        if (this.state.players[userId] && this.clients[userId] && typeof money == "number") {
            this.state.players[userId].public.money = Math.max(0, money)
            this.clients[userId].wareroom.attributes[ATTRIBUTES.MONEY] = money
        }
    }
    addPlayerMoney(userId, money) {
        this.setPlayerMoney(userId, this.state.players[userId].public.money + money)
    }
    async setFold(data) {
        this.game.getItemById(data.id).setFold(data.fold)
        await this.updateItemsState()
    }

    async setActionList(data) {
        const item = this.game.getItemById(data.id)
        const result = await this.game.createActionByAI(item, data.actions)
        await this.updateItemsState()
        return result
    }
    async setAction(data) {
        const item = this.game.getItemById(data.id)
        item.setAction(data.action)
        await this.updateItemsState()
    }
    async setLock(data) {
        const item = this.game.getItemById(data.id)
        item.setLock(data.lock)
        await this.updateItemsState()
    }
    async getClassInfo(data) {
        return await this.game.getClassInfo(data.classId)
    }
}

/**
 * @type {Server}
 */
let io;

export const startSocketServer = (server) => {
    io = new Server(server, {
        cors: {
            origin: true,
            methods: ["GET", "POST"],
        },
        path: "/ws/",
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('认证失败'));

        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            const user = await User.findById(decoded.id).exec();
            if (!user) return next(new Error('用户不存在'));

            socket.user = user;
            next();
        } catch {
            next(new Error('认证失败'));
        }
    });

    io.on('connection', gameLogic);
};

const emitPlayerList = (room) => {
    io.to(room.roomId).emit("player_list", room.getPlayerlist());
};

const join = async (socket, roomId, options = {}) => {
    const newMainRoom = await roomManager.joinRoom(socket, roomId, options);

    if (newMainRoom instanceof Room) {
        socket.mainRoom = newMainRoom;
        socket.emit("joined_room", newMainRoom.getInfo());
        socket.join(newMainRoom.roomId);

        io.to(newMainRoom.roomId).emit("player_join", socket.user.serialize());
        emitPlayerList(newMainRoom);
    } else {
        socket.emit("room_locked");
    }
};

const leave = async (socket) => {
    if (socket.mainRoom) {
        const roomId = socket.mainRoom.roomId;
        await roomManager.leaveRoom(socket, roomId);
        emitPlayerList(socket.mainRoom);
    }
};

const getConfig = async (levelId) => {
    if (!levelId) {
        return GAME_CONFIG
    }
    try {
        const level = await Level.findById(levelId).exec()
        if (!level) return GAME_CONFIG
        const content = level.content
        if (!content) return GAME_CONFIG
        return typeof content == "string" ? JSON.parse(content) : content
    } catch (error) {
        return GAME_CONFIG
    }
}

const gameLogic = async (socket) => {
    const { user, handshake: { query } } = socket;
    const roomId = query.roomId;
    const create = query.create == "true";
    const isPublic = query.public == "true";
    const team = query.team ?? [TEAM.PLAYER]
    const gameConfig = await getConfig(query.levelId)

    socket.sequenceNumber = 0;

    if (!user) {
        socket.emit('error', '你尚未登录，请登录后开始游戏');
        return socket.disconnect();
    }

    const newHighestPrise = async (userId, price, name) => {
        socket.mainRoom.broadcast(io).emit("new_max_prise", (await getUserById(userId)).name, price, name);
    };

    const onReceiving = () => socket.mainRoom?.broadcast(io).emit("receiving");
    //const onSuprise = () => socket.mainRoom?.broadcast(io).emit("suprise");
    const onPlayerDeath = (client) => socket.mainRoom?.broadcast(io).emit("player_death", client.user.id)
    const onScriptApplyItem = (itemID, applyItemId, emoji) => socket.mainRoom?.broadcast(io).emit("script_apply_item", itemID, applyItemId, emoji)

    const roomOptions = { newHighestPrise, onReceiving, onPlayerDeath, onScriptApplyItem, public: isPublic, createrId: user.id, gameConfig };
    const newMainRoom = create ? await roomManager.createRoom(GameRoom, roomOptions) : await join(socket, roomId);
    if (create) await join(socket, newMainRoom.roomId, { team });

    socket.on('disconnect', () => leave(socket));
    socket.on('move_item', (data) => socket.mainRoom?.moveItem(data));
    socket.on('set_output', (data) => socket.mainRoom?.setOutput(data));
    socket.on('set_input', (data) => socket.mainRoom?.setInput(data));

    socket.on('remove_item', (data) => socket.mainRoom?.removeItem(data));
    socket.on('synthesis_item', async (data, cb) => cb && cb(await socket.mainRoom?.synthesisItem(data, user._id)));
    socket.on('get_full_game_data', (callback) => callback(socket.mainRoom?.getFullData()));
    socket.on('action_machine', async (data, cb) => {
        const result = await socket.mainRoom?.actionMachine(data, user._id);
        cb && cb(result);
    });
    socket.on('buy_item', (data) => socket.mainRoom?.buyItem(data, user._id));
    socket.on('mouse_move', async (data) => await socket.mainRoom?.mouseMove(data, user._id));
    socket.on('start_drag', async (data) => socket.mainRoom?.startDragging(data.id, user._id));
    socket.on('end_drag', async (data) => socket.mainRoom?.endDragging(data.id, user._id));
    socket.on('ready', () => socket.mainRoom?.ready(user._id));
    socket.on('set_fold', (data) => socket.mainRoom?.setFold(data));

    socket.on('set_action_list', async (data, callback) => {
        callback(await socket.mainRoom?.setActionList(data))
    });
    socket.on('set_action', (data) => socket.mainRoom?.setAction(data));
    socket.on('set_lock', (data) => socket.mainRoom?.setLock(data));
    socket.on('get_class_info', async (data, cb) => cb(await socket.mainRoom?.getClassInfo(data)));
};

export default router;
