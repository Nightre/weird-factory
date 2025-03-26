
const itemSchema = {
    type: "object", 
    properties: {
        name: { type: "string" },
        price: { type: "number", minimum: 0 },
        num: { type: "number", minimum: 0 },
        emoji: { type: "string" },
        actions: {
            type: "object",
            additionalProperties: true
        },
        attributes: {
            type: "object",
            additionalProperties: true
        },
        reason: {
            type: "string",
        },
        info: {
            type: "string",
        },
    },
    required: ["name", "emoji"]
}

export const gameConfigSchema = {
    type: "object",
    properties: {
        init_money: { type: "number" },
        init_items: {
            type: "array",
            items: itemSchema
        },
        market_data: {
            type: "array", 
            items: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    items: {
                        type: "array",
                        items: itemSchema
                    }
                },
                required: ["category", "items"]
            }
        }
    },
    required: ["init_money", "market_data"],
    additionalProperties: false
};

export const GAME_CONFIG = {
    "init_money": 100,
    "init_items": [
        {
            "name": "水",
            "emoji": "💧",
            "reason":"非常棒的水",
            "info": "告诉AI这个物品有无其他特殊的规则，无法从名字得出的规则"
        }
    ],
    "market_data": [
        {
            "category": "基础资源",
            "items": [
                { "name": "水", "price": 10, "num": 12, "emoji": "💧" },
                { "name": "木头", "price": 15, "num": 12, "emoji": "🪵" },
                { "name": "石头", "price": 8, "num": 12, "emoji": "🪨" },
                { "name": "鸡蛋", "price": 3, "num": 12, "emoji": "🥚" },
                { "name": "牛奶", "price": 8, "num": 12, "emoji": "🥛" },
                { "name": "面粉", "price": 6, "num": 12, "emoji": "🌾" },
                { "name": "糖", "price": 7, "num": 12, "emoji": "🍬" },
                { "name": "盐", "price": 4, "num": 12, "emoji": "🧂" },
                { "name": "食用油", "price": 9, "num": 12, "emoji": "�️" },
                { "name": "蜂蜜", "price": 15, "num": 12, "emoji": "🍯" }
            ]
        },
        {
            "category": "生物",
            "items": [
                { "name": "鸡", "price": 10, "num": 12, "emoji": "🐓", "actions": { "激活": {} }, "attributes": { "状态": "睡眠中" } }
            ]
        }
    ]
}