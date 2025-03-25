import { MARKET_TYPE } from "../model.js";

export class GAME_CONFIG {
    static INIT_MONEY = 100
    static MARKET_DATA = [
        {
            category: "基础资源",
            items: [
                { item: "水", price: 10, num: 12, emoji: "💧" },
                { item: "木头", price: 15, num: 12, emoji: "🪵"},
                { item: "石头", price: 8, num: 12, emoji: "🪨" },
                { item: "鸡蛋", price: 3, num: 12, emoji: "🥚" },
                { item: "牛奶", price: 8, num: 12, emoji: "🥛"},
                { item: "面粉", price: 6, num: 12, emoji: "🌾" },
                { item: "糖", price: 7, num: 12, emoji: "🍬" },
                { item: "盐", price: 4, num: 12, emoji: "🧂" },
                { item: "食用油", price: 9, num: 12, emoji: "�️"},
                { item: "蜂蜜", price: 15, num: 12, emoji: "🍯"},
            ]
        },
        {
            category: "生物",
            items: [
                { item: "鸡", price: 10, num: 12, emoji: "🐓", actions: { "激活": { } }, attributes:{"状态":"睡眠中"}},
            ]
        }
    ]
    static SUBMIT_DATA = {
        "美食家": {
            prompt: "你是美食家，如果不能吃的东西你可以生气如果给你垃圾你可以生气，生气的话就输出负的钱。但是不要太苛刻，毕竟这是游戏，如果比较豪华的料理，或者比较复杂制作流程的料理给高价，如果是存心戏弄你或者不给你食物才给负价格。输出价格在 -100 ~ 10000 之间。说话风格搞笑一点，你是一个刻薄的美食家，说很很自大骄傲。",
            min: -100,
            max: 10000,
        },
        "低价收购": {
            prompt: "你是低价收购物品王，你收购所有物品。从破烂手表之类的垃圾到高档西装，你不会扣卖家钱（不输出负的钱）。而且你输出的原因是一个可爱的少女的风格讲话。但是价格不要太高，所有物品不要高于600.",
            min: 0,
            max: 600,
        },
        "愤怒老头": {
            prompt: "你是一个愤怒老头，你悲欢无常，卖东西给你堪称赌博。你有时候会很高的加个买一个垃圾，有时候却是负很多钱，你的输出范围是 -1000-5000",
            min: -1000,
            max: 5000,
        }
    }
    static SUPRISE = [
        { className: "手枪", emoji: "🔫" },
        { className: "卢本伟广场", emoji: "🎤" },
        { className: "滑稽", emoji: "🤣" },
        { className: "哲学", emoji: "🕶️" },
        { className: "苹果", emoji: "🍎" },
        { className: "安卓", emoji: "🤖" },
        { className: "Windows蓝屏", emoji: "💀" },
        { className: "丁真", emoji: "🐴" },
        { className: "炸弹", emoji: "💣" },
        { className: "黄金右手", emoji: "✋" },
        { className: "假赛", emoji: "🤡" },
        { className: "程序员的头发", emoji: "🧑‍🦲" },
        { className: "鸽子", emoji: "🕊️" },
        { className: "福报", emoji: "🤑" },
        { className: "锦鲤", emoji: "🐟" },
        { className: "贝极星", emoji: "🌟" },
        { className: "硬币", emoji: "🪙" },
        { className: "学习", emoji: "📚" },
        { className: "摸鱼", emoji: "🎣" },
        { className: "高达", emoji: "🤖" },
        { className: "量子力学", emoji: "⚛️" },
        { className: "GTA五年", emoji: "🚗" },
        { className: "显卡起飞", emoji: "🛫" },
        { className: "打工人", emoji: "💼" },
        { className: "社恐", emoji: "😨" },
        { className: "内鬼", emoji: "🔪" },
        { className: "寄", emoji: "💀" },
        { className: "失业", emoji: "📉" },
        { className: "假肢摇", emoji: "🎸" },
        { className: "波奇酱", emoji: "🥲" },
        { className: "前辈，喜欢你！", emoji: "💕" },
        { className: "咕噜灵波", emoji: "🌀" },
        { className: "桐人", emoji: "⚔️" },
        { className: "DIO！", emoji: "☀️" },
        { className: "JOJO立", emoji: "🕺" },
        { className: "欧拉欧拉", emoji: "👊" },
        { className: "木大木大", emoji: "🔥" },
        { className: "One Punch!", emoji: "💥" },
        { className: "龙卷风摧毁停车场", emoji: "🌪️" },
        { className: "你就是个战犯", emoji: "⚠️" },
        { className: "比利比利", emoji: "🎶" },
        { className: "天命大队", emoji: "🏰" },
        { className: "爱莉希雅", emoji: "🌸" },
        { className: "星穹铁道", emoji: "🚆" },
        { className: "雷电将军", emoji: "⚡" },
        { className: "胡桃", emoji: "👻" },
        { className: "进击的巨人", emoji: "🔪" },
        { className: "你已经死了", emoji: "🔥" },
        { className: "战术后仰", emoji: "🦵" },
        { className: "Hacker!", emoji: "💻" },
        { className: "买根葱", emoji: "🧅" },
        { className: "光遇", emoji: "💫" },
        { className: "UFO?", emoji: "🛸" },
        { className: "假面骑士", emoji: "🦗" },
        { className: "战术核弹准备就绪", emoji: "💥" },
        { className: "黑洞吞噬", emoji: "🕳️" },
        { className: "宇宙真理", emoji: "🌠" },
        { className: "键盘侠", emoji: "⌨️" },
        { className: "电棍", emoji: "⚡" },
        { className: "塔防", emoji: "🏰" },
        { className: "蘑菇", emoji: "🍄" },
        { className: "老八", emoji: "🍔" },
        { className: "泡泡玛特", emoji: "🎈" },
        { className: "洛天依", emoji: "🎤" },
        { className: "地铁跑酷", emoji: "🚄" },
        { className: "赛博朋克", emoji: "🌃" },
        { className: "东京卍会", emoji: "⛩️" },
        { className: "孤独", emoji: "🌑" },
        { className: "打麻将", emoji: "🀄" },
        { className: "宫崎骏", emoji: "🎥" },
        { className: "原批", emoji: "🌿" },
        { className: "社牛", emoji: "😎" },
        { className: "天选之子", emoji: "✨" },
        { className: "抽卡", emoji: "🎴" },
        { className: "高端玩家", emoji: "🕹️" },
        { className: "BOSS战", emoji: "⚔️" },
        { className: "像素风", emoji: "🎮" },
        { className: "复读机", emoji: "🔁" },
        { className: "网抑云", emoji: "☁️" },
        { className: "充电宝", emoji: "🔋" },
        { className: "超能力", emoji: "🧠" },
        { className: "海绵宝宝", emoji: "🍍" },
        { className: "新海诚", emoji: "🌧️" },
        { className: "火影忍者", emoji: "🍥" },
        { className: "柯南", emoji: "🔍" },
        { className: "龙珠", emoji: "🟠" },
        { className: "EVA", emoji: "🟣" },
        { className: "黑客帝国", emoji: "🕶️" }
    ];
}