import { InventoryItem } from "./game/game-logic.js";
import { User } from "./model.js";

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

export const returnError = (res, errors) => {
    return res.status(400).json({
        success: false,
        errors: typeof errors === 'string' ? errors : errors.array()
    });
}

export const returnSuccess = (res, message, data) => {
    return res.json({
        success: true,
        message: message,
        data: data
    });
}

export const difference = (arr1, arr2) => {
    return arr1.filter(item => !arr2.includes(item));
}

export const generateRoomId = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomId = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        roomId += characters[randomIndex];
    }
    return roomId;
}

export const getUserById = async (id) => {
    return await User.findById(id).exec()
}

export const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

export const toDict = (keys, data = null) => {
    if (!keys) {
        return {}
    }
    return keys.reduce((obj, key) => {
        obj[key] = data;
        return obj;
    }, {});
}
export function mapObject(obj, callback) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = callback(value, key);
    }
    return result;
}
export function getRandomItem(list) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

export const toInputs = (input) => {
    return input ? input.reduce((data, obj) => {
        data[obj] = InventoryItem.createInitInputsData();
        return data;
    }, {}) : {}
}

export function inSameTeam(arr1, arr2) {
    if (arr1.length == 0 || arr2.length == 0) {
        return true
    }
    const set = new Set(arr1);
    return arr2.some(item => set.has(item));
}