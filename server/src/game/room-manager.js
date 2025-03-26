import { GAME_CONFIG } from "../game-data/game-config.js";
import { generateRoomId } from "../uitls.js";
import { observe, generate, unobserve, compare } from 'fast-json-patch/index.mjs';

export class Room {
    constructor(roomId, options) {
        this.gameConfig = options.gameConfig
        console.log("初始化房间：",this.gameConfig)
        this.options = options
        this.roomId = roomId
        this.clientList = []
        this.clients = {}
        this.isLock = false
        this.state = {}
        this.initState({})
        this.pendingPatchs = []
        this.oldState = {}
        this.public = options.public

        setInterval(() => {
            this.emitStateChange()
        }, 10);

    }

    canJoin(user) {
        if (this.clientList.length == 0) {
            return true
        }
        if (this.isLock) {
            return false
        }
        if (!this.public) {
            return false
        }
        for (let client of this.clientList) {
            if (client.user.id == user.id) {
                return false
            }
        }
        return !this.isLock
    }
    broadcast(io) {
        return io.to(this.getRoomId())
    }
    async init(createrId) { }

    emitStateChange() {

        const patches = compare(this.oldState, this.state);

        this.clientList.forEach(client => {
            if (!client.ready) {
                return
            }
            const allowedPatches = patches.filter(op =>
                this.canReadState(client, op.path.slice(1).split('/'), op)
            );
            if (allowedPatches.length > 0) {
                client.sequenceNumber += 1

                client.emit('change_state', {
                    patch: allowedPatches,
                    sequenceNumber: client.sequenceNumber
                });
            }
        });
        this.pendingPatchs = []
        this.oldState = structuredClone(this.state)

    }
    getClientUserId(client) {
        return client.user.id.toString()
    }
    canReadState(client, path, op) {
        return true
    }
    initState(state) {
        this.state = state
        this.state.players = {}
    }
    getFullData() {
        return this.state
    }

    getRoomId() {
        return this.roomId
    }
    getUserPrivateInitState(user, client) {
        return {}
    }
    getUserPublicInitState(user, client) {
        return {}
    }
    async initPlayer(client) {
        const user = client.user
        this.state.players[user.id] = {
            private: this.getUserPrivateInitState(user, client),
            public: this.getUserPublicInitState(user, client)
        }
    }
    async addClient(client) {
        await this.initPlayer(client)
        client.join(this.roomId);
        this.clientList.push(client)
        this.clients[client.user.id] = client

        //await this.changeRoomState((newState) => {
        // this.state.players[this.getClientUserId(client)] = {
        //     private: this.getUserPrivateInitState(client.user),
        //     public: this.getUserPublicInitState(client.user)
        // }
        //})

    }

    async removeClient(client) {
        delete this.clients[client.user._id]
        client.leave(this.roomId);
        this.clientList.splice(this.clientList.indexOf(client), 1)
        //await this.changeRoomState((newState) => {
        delete this.state.players[this.getClientUserId(client)]
        //})
    }

    isEmpty() {
        return this.clientList.length == 0
    }

    getInfo() {
        return {
            roomId: this.roomId,
            state: this.state
        }
    }

    getPlayerlist() {
        return this.clientList.map(client => {
            return {
                ...client.user.serialize(),
                team: client.team,
            }
        })
    }

    ready(userId) {
        this.clients[userId].ready = true
    }
}

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    async createRoom(RoomClass, options = {}, roomId) {
        if (!roomId) roomId = generateRoomId(6)
        const newRoom = new RoomClass(roomId, options)
        this.rooms.set(roomId, newRoom)
        await newRoom.init(options.createrId)
        return newRoom
    }

    getRoom(roomId) {
        return this.rooms.get(roomId)
    }

    async joinRoom(client, roomId, options) {
        roomId = typeof roomId == "string" ? roomId : roomId.id
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId)
            if (!room.canJoin(client.user)) {
                return null
            }
            client.team = options.team
            await room.addClient(client)
            return room
        }
        return null;
    }

    async leaveRoom(client, roomId) {
        roomId = typeof roomId == "string" ? roomId : roomId.id
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            await room.removeClient(client)

            if (room.isEmpty()) {
                this.closeRoom(room.roomId)
                return null
            }

            return this.rooms.get(room)
        }
        return null;
    }

    closeRoom(roomId) {
        roomId = typeof roomId == "string" ? roomId : roomId.id
        this.rooms.delete(roomId)
    }
    getRoomList(user) {
        return Array.from(this.rooms.values())
            .filter(room => room.canJoin(user))
            .map(room => {
                return {
                    roomId: room.roomId,
                    playerName: room.getPlayerlist()[0].name,
                    playerCount: room.getPlayerlist().length
                }
            })
    }
}

export default new RoomManager()