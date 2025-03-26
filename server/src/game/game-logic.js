import { ATTRIBUTES, INPUT_TYPE, Inventory, Item, ITEM_TYPE, ItemClasses, LEVEL, LOCK_TYPE, TEAM } from '../model.js';
import { difference, inSameTeam, mapObject, toDict } from '../uitls.js';
import mongoose from 'mongoose';
import { processMachineAction, evaluateItemValue, synthesizeItems, addGptContext, changeItemsInputs, autoProcessMachineAction } from './gpt-gen.js';
import { EventEmitter } from "eventemitter3"
import pkg from 'isolated-vm';
import { setInterval } from 'timers';
const { Isolate, Context, Reference } = pkg;

export const initUser = async (user) => {

}

export class InventoryItem extends EventEmitter {
    constructor({
        owner = [],
        attributes = {},
        reason = null,
        actions = {},
        inputs = {},
        _id,
        id,
        position_x = 0,
        position_y = 0,
        created_at,
        itemClass,
        output = null,
        outputSlotName = null,
        isLocked = true,
        info = "",
        fold = true,
        baseInputs = {},
        script = "",
        player = null,
        privateActions = [],
        currentAction = null,
    }, inventory) {
        super()
        this.player = player
        this.id = id ?? (_id ? _id.toString() : _id);
        this.position_x = position_x;
        this.position_y = position_y;
        this.classId = itemClass.id.toString();
        this.itemClass = itemClass;
        this.outputId = output;
        this.output = null;
        this.outputSlotName = outputSlotName;

        this.type = itemClass.type;
        this.emoji = itemClass.emoji;
        this.info = info

        this.createdAt = created_at;
        this.dirty = false;
        this.inputs = {};

        this.actions = InventoryItem.processAiInput(actions, "type");
        this.inventory = inventory;
        this.isDragging = false;
        this.isLoading = false;

        this.showText = this.itemClass.name;
        this.reason = reason;
        this.showEmojiText = this.showText + this.emoji;
        this.draggingUser = null;
        this.owner = owner;
        this.attributes = attributes;

        //this.moneyChangePerSecond = 0;
        this.fold = fold
        this.isLocked = isLocked
        this.baseInputs = InventoryItem.processAiInput(baseInputs, "type") //{ "baseSlots": { type: INPUT_TYPE.ALLOW_REFERENCE, item: null } }

        this.script = script
        this.scriptFuncs = {}

        this.setScript(script)
        this.setInputName(inputs)
        this.setItemClass(itemClass);
        this.setAttribute(attributes);

        this.shadowDepends = []
        this.currentAction = currentAction
        this.currentActionInputs = {}
        this.setAction(currentAction)
        this.privateActions = privateActions
    }
    distance(targetItem) {
        const dx = this.position_x - targetItem.position_x;
        const dy = this.position_y - targetItem.position_y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    applyScript(key = "mainFunc") {
        if (this.isLoading) return
        const func = this.scriptFuncs[key]
        if (typeof func == "function") {
            func(this.toString(0, false).data)
        }
    }
    async setScript(script) {
        this.scriptFuncs = {}
        // current.applyChange = (json)=>{global.applyChange("${this.id}", json)};\n

        script = `
global.item["${this.id}"] = {};
(()=>{
    const current = global.item["${this.id}"];
    current.applyChange = (json)=>{global.applyChange("${this.id}", json)};
    current.findItems = ()=> global.findItems("${this.id}")
    current.getItemById = (id)=> global.getItemById(id)

    current.applyByGPT = (prompt)=>{global.applyByGPT("${this.id}", prompt)}
` + script + '\n})()'
        this.script = script; // 保存原始脚本字符串
        const isolate = this.inventory.isolate;
        /**@type {Context} */
        const context = this.inventory.context;
        /**@type {Reference} */
        const jail = context.global;

        try {
            const compiledScript = await isolate.compileScript(script);
            await compiledScript.run(context, { timeout: 1000 });
            const mainFunc = jail.getSync("item").getSync(this.id).getSync("mainTick")
            const intiFunc = jail.getSync("item").getSync(this.id).getSync("init")

            this.scriptFuncs = { mainFunc, intiFunc };
            // if (mainFunc && typeof mainFunc == "function") {
            //     this.scriptFuncs = {mainFunc};
            // }
        } catch (error) {
            console.error('设置脚本失败:', error.message, error.stack);
            throw error; // 或者根据需求处理
        }
        this.context = context

        this.applyScript("intiFunc")
        this.applyScript()
    }
    setLock(isLocked) {
        this.isLocked = isLocked
        this.makeDirty()
    }
    static createInitInputsData(item = null) {
        return InventoryItem.createInputData({ item })
    }
    static createInputData({ item = null, isShadow = false, type = INPUT_TYPE.NORMAL }) {
        return {
            item,
            isShadow,
            type
        }
    }
    static processAiActions(inputs) {
        return mapObject(inputs, (value) => InventoryItem.processAiInput(value, "type"))
    }
    static processAiInput(input, JSONkey = "type") {
        if (!input || typeof input !== "object") {
            return {}
        }
        return Object.entries(input).reduce((acc, [key, value]) => {
            acc[key] = value && typeof value === "object" ? value : { [JSONkey]: value };
            return acc;
        }, {});
    }
    // async setActionList(actions) {
    //     for (const action in actions) {
    //         if (!(action in this.actions)) {
    //             this.actions[action] = await this.inventory.updateAiGenInput(this, action)
    //         }
    //     }
    //     //this.actions = actions
    // }

    setAction(action) {
        this.currentAction = action
        this.currentActionInputs = this.actions[action]
        this.updateInputFormAction()//this.actions[action] && this.setInputName(this.actions[action], false)
    }

    updateInputFormAction() {
        // 更新当前 action 到 inputs
        let action = this.currentAction
        const actionKeys = Object.keys(this.actions)
        if (!this.actions[action] && actionKeys.length > 0) {
            // 当前动作被删除
            this.currentAction = actionKeys[0]
            action = this.currentAction
        }
        this.setInputName(this.actions[action] ?? {}, false)
    }

    setInputName(newInputNames, changeItem = true, emitApply = false) {
        newInputNames = { ...this.baseInputs, ...newInputNames }

        // 先删除
        for (const inputName in this.inputs) {
            // if (newInputNames[inputName]?.item == null) {
            //     this.inputs[inputName]?.item?.setOutput(null, null)
            // }
            if (!(inputName in newInputNames)) {
                changeItem && this.setInput(null, inputName, this.inputs[inputName])//this.inputs[inputName]?.item?.setOutput(null, null)
                delete this.inputs[inputName]
            }
        }

        // 再添加
        for (const inputName in newInputNames) {
            const newItem = newInputNames[inputName]?.item
            const oldItem = this.inputs[inputName]?.item

            const oldInput = this.inputs[inputName]
            const newInput = newInputNames[inputName]

            //inputName in this.inputs && this.setInput(null, inputName)

            this.inputs[inputName] = InventoryItem.createInputData({ ...this.inputs[inputName], ...newInput }) // 设为新的Inputs但是保持item不变
            //this.inputs[inputName].item = oldInput?.item ?? null

            if ((newItem?.id !== oldItem?.id || newInput?.isShadow !== oldInput?.isShadow) && changeItem) {
                if (oldItem instanceof InventoryItem) {
                    oldItem.setInput(null, inputName, oldInput)

                    if (!oldInput.isShadow) {
                        emitApply && this.inventory.emit("applyChange", this.id, oldItem.id, "移除")
                    }
                }
                if (newItem instanceof InventoryItem) { // 需要改变 
                    this.setInput(newItem, inputName, newInput)
                    if (!newInput.isShadow) {
                        //newItem.setOutput(this, inputName, newInput)
                        emitApply && this.inventory.emit("applyChange", this.id, newItem.id, "进入")
                    }
                }
            }
        }
        this.makeDirty();
    }

    setAttribute(attributes) {
        // this.moneyChangePerSecond = 0
        if (this.player) {
            for (const key in attributes) {
                switch (key) {
                    case ATTRIBUTES.MONEY:
                        this.inventory.emit("moneyChange", this.player, Number(attributes[key]))
                        break;
                }
            }
        }

        this.attributes = attributes;
        this.makeDirty();
    }

    setItemClass(itemClass) {
        this.classId = itemClass._id.toString();
        this.itemClass = itemClass;
        this.emoji = itemClass.emoji;
        this.showText = this.itemClass.name;
        this.showEmojiText = this.showText + this.emoji;
    }

    setIsDrag(isDragging, userId) {
        this.isDragging = isDragging;
        this.draggingUser = userId.toString();
    }

    setIsLoading(isLoading) {
        this.isLoading = isLoading;
    }

    toString() {
        //let id2Itemid = useIdMapping ? { [id]: this.id } : {};
        const data = {
            id: this.id,
            attributes: this.attributes,
            actions: this.actions,
            name: this.showText,
            info: this.info,
            baseInputs: this.baseInputs,
            inputs: {},
            isLocked: this.isLocked,
            privateActions: this.privateActions,
            owner: this.owner
        };

        const inputData = data.inputs;
        for (const [slotName, inputItem] of Object.entries(this.inputs)) {
            if (inputItem.item) {
                //id += 1;
                const childData = inputItem.item.toString();
                // if (useIdMapping) {
                //     id2Itemid = { ...id2Itemid, ...ids };
                // }
                inputData[slotName] = childData;
            } else {
                inputData[slotName] = null;
            }
        }
        return data;
    }

    populateOutput() {
        if (this.outputId) {
            this.setOutput(this.inventory.getItemById(this.outputId), this.outputSlotName);
        }
    }
    toJson() {
        const inputToJSON = (input) => {
            return {
                ...input,
                item: input?.item?.id ?? null
            }
        }
        const json = {
            x: this.position_x,
            y: this.position_y,
            inputs: Object.fromEntries(
                Object.entries(this.inputs).map(([name, item]) => [name, inputToJSON(item)])
            ),
            output: this.output?.id ?? null,
            outputSlotName: this.outputSlotName,
            showText: this.showText,
            classId: this.classId,
            emoji: this.emoji,
            type: this.type,
            reason: this.reason,
            id: this.id,
            isDragging: this.isDragging,
            isLoading: this.isLoading,
            dragging_user: this.draggingUser,
            owner: this.owner,
            info: this.info,
            actions: this.actions,
            attributes: this.attributes,
            fold: this.fold,
            isLocked: this.isLocked,
            currentAction: this.currentAction,
            baseInputs: this.baseInputs,
            hasScript: Boolean(this.script.length > 0 && this.scriptFuncs.mainFunc),
            privateActions: this.privateActions
        };

        return json;
    }
    setFold(fold) {
        this.fold = fold
    }
    toModelData() {
        const data = {
            class_id: this.classId,
            position_x: this.position_x,
            position_y: this.position_y,
            output: this.output?.id,
            outputSlotName: this.outputSlotName,
            type: this.type,
            created_at: this.createdAt,
            inventory: this.inventory.id,
            inputs: this.inputs,  // Store the inputs object directly
            _id: this.id,
            owner: this.owner,
            actions: this.actions,
            attributes: this.attributes,
            currentAction: this.currentAction,
        };
        return data;
    }
    commit() {
        this.dirty = false;
    }
    makeDirty() {
        this.dirty = true;
        this.inventory.addDirty(this);
    }
    changeProperty(propertyName, value) {
        this[propertyName] = value;
        this.makeDirty();
    }
    moveTo(x, y) {
        this.position_x = x;
        this.position_y = y;
        this.makeDirty();
    }
    addDepend(item, slotName) {
        console.log("添加依赖", item.showText, "依赖", this.showText)
        this.shadowDepends.push({ id: item.id, slotName })
    }
    removeDepend(item, slotName) {
        console.log("移除依赖", item.showText, "不依赖", this.showText)
        this.shadowDepends = this.shadowDepends.filter(({ id, slotName: targetSlotName }) => !(id == item.id && slotName == targetSlotName))
    }

    setOutput(output, outputSlotName, options = {}) {
        const influence = !options?.isShadow

        if (influence) {
            if (this.output instanceof InventoryItem) {
                this.output.inputs[this.outputSlotName].item = null;
            }

            this.output = output;
            this.outputSlotName = outputSlotName;
        }

        if (output instanceof InventoryItem) {
            if (output.inputs[outputSlotName].item instanceof InventoryItem) {
                output.setInput(null, outputSlotName)
            }
            output.inputs[outputSlotName].item = this;
            output.inputs[outputSlotName].isShadow = Boolean(options.isShadow);

            options.isShadow && this.addDepend(output, outputSlotName)
        }

        this.makeDirty();
        return true;
    }
    setInput(input, slotName, options = {}) {
        if (!(slotName in this.inputs)) {
            console.log(`Invalid slot name: ${slotName}`)
            return
        }

        if (this.inputs[slotName]?.item instanceof InventoryItem) {
            if (this.inputs[slotName].isShadow) {
                this.inputs[slotName].item.removeDepend(this, slotName)
            } else {
                this.inputs[slotName].item.setOutput(null, null);
            }
        }
        if (input) {
            input.setOutput(this, slotName, options);
        }
        this.inputs[slotName].item = input;
        this.makeDirty();
        return true;
    }
    getInput(slotName) {
        return this.inputs[slotName]?.item || null;
    }
    getOutput() {
        return this.output;
    }
    removeOutput() {
        return this.setOutput(null, null);
    }
    removeInput(slotName) {
        return this.setInput(null, slotName);
    }
    remove() {

        this.shadowDepends.forEach(({ id, slotName }) => {
            this.inventory.getItemById(id)?.setInput(null, slotName)
        })

        if (this.output) {
            this.output.removeInput(this.outputSlotName);
        }
        this.emit("remove")
    }

    removeAllChildren() {
        for (const slotName in this.inputs) {
            if (this.inputs[slotName]?.item) {
                this.inputs[slotName].item.removeSelfAndChildren();
            }
        }
    }

    removeSelfAndChildren() {
        this.removeAllChildren();
        this.inventory.removeItemById(this.id);
    }
}

const TOO_MANY_REQ_MSG = "操作过频繁，请稍后重试~"
const AI_GEN_ERROR = "AI生成失败，再试一次吧~"
const AI_FIND_DISTANCE = 500
export class GameLogic extends EventEmitter {
    constructor(items = [], id, options) {
        super()
        this.id = id
        this.items = new Map

        this.setupIsolate()

        items.forEach(item => {
            this.addItemFromJson(item)
        })
        this.items.forEach(item => {
            item.populateOutput()
        })

        this.dirtyItem = new Set()
        this.updateItemsState = options.updateItemsState
        this.getMainUser = options.getMainUser
        this.gptContext = []
    }

    applyScript() {
        this.items.forEach(item => {
            item.applyScript()
        })
    }
    canFindByAI(item, targetItem) {
        return inSameTeam(targetItem.owner, item.owner) && item.distance(targetItem) < AI_FIND_DISTANCE
    }
    setupIsolate() {
        this.isolate = new Isolate({ memoryLimit: 32 });
        this.context = this.isolate.createContextSync();
        const jail = this.context.global;

        jail.set('global', jail.derefInto());
        jail.set('print', function (...args) { console.log(...args); });
        jail.set('applyChange', (itemID, changeJSON) => {
            const item = this.getItemById(itemID)
            if (!item) return
            (async () => {
                await this.applyFromJSON(item, {}, changeJSON)
                await this.updateItemsState()
            })()
        });
        jail.set('getItemById', (id) => {
            const item = this.getItemById(id)
            if (!item) return {}
            return item.toString()
        });
        jail.set('findItems', (item) => {
            const targetItem = this.getItemById(item)
            const data = Array.from(this.items.values())
                .filter(item => this.canFindByAI(targetItem, item))
                .map(item => item.toString(0, false))
            return data
        });

        jail.set('applyByGPT', (itemID, prompt) => {
            (async () => {
                const item = this.getItemById(itemID)
                if (!item) return
                item.setIsLoading(true)
                const aiResult = await autoProcessMachineAction(JSON.stringify(item.toString()), prompt, this.gptContext);
                await this.applyFromJSON(item, {}, aiResult)
                item.setIsLoading(false)
                await this.updateItemsState()
            })()
        });
        this.context.eval('global.item = {};\n');
    }
    // moneyChangeEmit() {
    //     let change = 0
    //     this.items.forEach(item => {
    //         //change += item.moneyChangePerSecond
    //     })
    //     return change
    // }
    async synthesis(item_1, item_2, firstCreater) {
        const item1 = this.getItemById(item_1)
        const item2 = this.getItemById(item_2)

        let aiResult
        try {
            const item1Data = item1.toString()
            const item2Data = item2.toString(lastId)
            aiResult = await synthesizeItems(
                JSON.stringify(item1Data),
                JSON.stringify(item2Data),
                this.gptContext
            )
        } catch (error) {
            if (error instanceof SyntaxError) {
                return { error: AI_GEN_ERROR };
            }
            return { error: TOO_MANY_REQ_MSG }
        }

        const position = {
            position_x: (item1.position_x + item2.position_x) / 2,
            position_y: (item1.position_y + item2.position_y) / 2
        }
        await this.applyFromJSON(item1, {}, aiResult, position, firstCreater)
        this.removeItemById(item_1)
        this.removeItemById(item_2)

        return {
            items: aiResult?.create?.map(item => this.getItemById(idMapping[item.id])) ?? []
        }
        // return { item: await this.createFromJSON(aiResult, { 
        //     position_x: (item1.position_x + item2.position_x)/2,
        //     position_y: (item1.position_y + item2.position_y)/2 
        // }) }
    }
    async actionMachine(itemId, action, playerItem, ban, firstCreater) {
        const item = this.getItemById(itemId);
        if (!item) return { error: "物品不存在" };

        return await this.handleMachineType(item, action, playerItem, firstCreater);
    }

    async handleMachineType(item, action, playerItem, firstCreater) {
        let data = item.toString();
        let playerData = playerItem.toString();

        let aiResult;
        let ids = {}
        try {
            aiResult = await processMachineAction(JSON.stringify(data), JSON.stringify(playerData), action, this.gptContext);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return { error: AI_GEN_ERROR };
            }
            return { error: TOO_MANY_REQ_MSG };
        }
        ids = await this.applyFromJSON(item, ids, aiResult, firstCreater)
        addGptContext(this.gptContext, aiResult.description, ids)
        return {};
    }

    // async handleSubmitType(item, ban, submitData) {
    //     const child = item.getInput("卖物");
    //     if (!child) return { isSubmit: true, error: "请提供商品才能出售" };

    //     const childName = child.showText;
    //     if (ban.includes(childName)) return { isSubmit: true, error: "该物品已卖过。" };

    //     let aiResult;

    //     try {
    //         aiResult = await evaluateItemValue(
    //             JSON.stringify(child.toString()),
    //             submitData[item.showText],
    //             this.gptContext
    //         );
    //     } catch (error) {
    //         if (error instanceof SyntaxError) {
    //             return { error: AI_GEN_ERROR };
    //         }
    //         return { error: TOO_MANY_REQ_MSG };
    //     }

    //     const { price, reason } = aiResult;
    //     item.removeAllChildren();
    //     return { isSubmit: true, price, reason, name: childName };
    // }
    async createActionByAI(item, newAction) {
        for (const actionName in newAction) {
            if (!(actionName in item.actions)) {
                const data = await changeItemsInputs(actionName, JSON.stringify(item.toString()), this.gptContext)
                if (data.error) {
                    return { error: data.error }
                }
                item.actions[actionName] = InventoryItem.processAiInput(data, "type")
            }
        }

        item.updateInputFormAction()
        return {}
    }

    // 从JSON的操作 ///////
    async createFromJSON(createData, otherData, firstCreater) {
        return await this.addItemFromJson({
            className: createData.name ?? "废物",
            inputs: createData.actions ? InventoryItem.processAiInput(createData.actions, "item") : {}, // 把 {a:1} 改成 {a:{item:1}}
            actions: createData.actions ? InventoryItem.processAiActions(createData.actions) : {}, // 把 {a:1} 改成 {a:{type:1}}
            attributes: createData.attributes ?? {},
            baseInputs: createData.baseInputs ? InventoryItem.processAiInput(createData.baseInputs, "type") : {},
            emoji: createData.emoji,
            reason: createData.reason,
            info: createData.info,
            script: createData.script,
            isLocked: createData.isLocked,
            privateActions: createData.privateActions,
            owner: createData.owner,
            ...otherData
        }, firstCreater)
    }
    async changeItemPropertyFromJSON(item, data) {
        if (typeof data.name !== "undefined") {
            const itemClass = await ItemClasses.getItemClasses(
                data.name ?? item.name,
                data.type ?? item.type,
                data.emoji ?? item.emoji,
                this.getMainUser()
            );

            item.setItemClass(itemClass)
        }

        if (typeof data.attributes !== "undefined") item.setAttribute(data.attributes)
        if (typeof data.actions !== "undefined") item.actions = InventoryItem.processAiActions(data.actions)
        if (typeof data.baseInputs !== "undefined") item.baseInputs = InventoryItem.processAiInput(data.baseInputs, "type")
        if (typeof data.reason !== "undefined") item.reason = data.reason
        if (typeof data.info !== "undefined") item.info = data.info
        if (typeof data.script !== "undefined") item.setScript(data.script)
        if (typeof data.action !== "undefined") item.updateInputFormAction()
        if (typeof data.privateActions != "undefined") item.privateActions = data.privateActions
        if (typeof data.isLocked !== "undefined") item.setLock(data.isLocked)
        if (typeof data.owner != "undefined") item.owner = data.owner

        return item
    }
    async changeItemInputFromJSON(item, inputs, idMapping = {}) {
        item.updateInputFormAction()
        inputs = InventoryItem.processAiInput(inputs, "item") // 把 {a:1} 改成 {a:{item:1}}
        const changedInput = {}
        for (const [slotName, inputData] of Object.entries(inputs)) {
            if (inputData.item !== null) {
                // id mapping
                const id = idMapping[inputData.item] ?? inputData.item
                inputData.item = id ? this.getItemById(id) : null
            }
            changedInput[slotName] = InventoryItem.createInputData({
                ...item.inputs[slotName], // 之前的数据，只改变需要改变的数据（只有item）
                ...inputData,
            })
        }
        item.setInputName(changedInput, true, true)
        item.updateInputFormAction()
    }
    async applyFromJSON(targetItem, idMapping, aiResult, initCreatePosition, createFromJSON) {
        const newItems = []
        const changeInputs = []
        if ('change' in aiResult) {
            for (const id in aiResult.change) {
                const item = await this.getItemById(idMapping[id] ?? id)
                if (item) {
                    await this.changeItemPropertyFromJSON(item, aiResult.change[id])
                    changeInputs.push({ item, inputs: aiResult.change[id].inputs })
                    this.emit("applyChange", targetItem.id, item.id, aiResult.change[id].actionEmoji ?? "❓")
                }
            }
        }

        if ('delete' in aiResult) {
            for (const id of aiResult.delete) {
                await this.removeItemById(idMapping[id] ?? id)
            }
        }

        if ('changeSelf' in aiResult) {
            await this.changeItemPropertyFromJSON(targetItem, aiResult.changeSelf)
            changeInputs.push({ item: targetItem, inputs: aiResult.changeSelf.inputs })
        }

        if ('create' in aiResult) {
            let offset = {}
            for (const createData of aiResult.create) {
                const id = idMapping[createData.createPosId] ?? createData.createPosId

                let pos = {}
                let offsetId = null;

                if (initCreatePosition) {
                    pos = initCreatePosition
                    offsetId = "main"
                } else {
                    let targetPos = id ? this.getItemById(id) : targetItem

                    pos = {
                        position_x: targetPos.position_x + 10,
                        position_y: targetPos.position_y + 10,
                    }
                    offsetId = targetPos.id
                }

                if (!offset[offsetId]) offset[offsetId] = 0

                pos.position_y += offset[offsetId]
                offset[offsetId] += 60

                const newItem = await this.createFromJSON(createData, pos, createFromJSON)
                newItems.push(newItem)
                if (createData.id) idMapping[createData.id] = newItem.id
                changeInputs.push({ item: newItem, inputs: createData.inputs })
            }
        }

        for (let { item, inputs } of changeInputs) {
            if (inputs && item) {
                this.changeItemInputFromJSON(item, inputs, idMapping)
                // inputs = InventoryItem.processAiInput(inputs, "item") // 把 {a:1} 改成 {a:{item:1}}
                // const reIdInputs = {}
                // for (const [slotName, inputData] of Object.entries(inputs)) {
                //     if (inputData == null) {
                //         reIdInputs[slotName] = InventoryItem.createInitInputsData({
                //             ...item.inputs[slotName], // 之前的数据，只改变需要改变的数据（只有item）
                //             item: null
                //         }) // 创建空的
                //     } else {
                //         const itemId = inputData.item
                //         reIdInputs[slotName] = InventoryItem.createInputData({
                //             ...item.inputs[slotName], // 之前的数据，只改变需要改变的数据（只有item）
                //             item: ids[itemId] ? this.getItemById(ids[itemId]) : (itemId ?? null),
                //         })
                //     }
                // }
                // item.setInputName(reIdInputs)
                // item.updateInputFormAction()
            }
        }
        return idMapping
    }
    //////////////////////
    async getClassInfo(classId) {
        const classes = await ItemClasses.findById(classId).exec()
        return await classes.serialize()
    }
    addDirty(item) {
        this.dirtyItem.add(item)
    }

    getItemNum() {
        return this.items.size
    }
    getItemById(id) {
        if (typeof id == "undefined" || id == null) {
            return null
        }
        id = typeof id == "string" ? id : id.toString()
        return this.items.get(id)
    }
    removeAll() {
        this.dirtyItem.clear()
        this.items.clear()
    }
    removeItemById(id) {
        if (!id) return
        id = typeof id == "string" ? id : id.toString()
        this.dirtyItem.delete(id)
        const c = this.items.get(id)
        if (!c) {
            return
        }
        c.remove()
        this.items.delete(id)
        return c
    }
    getItemIDs() {
        return Array.from(this.items.keys())
    }
    getItems() {
        return this.items
    }
    async addItemFromJson(data, firstCreater) {
        if (!firstCreater && this.getMainUser) {
            firstCreater = this.getMainUser()
        }
        if (data.className) {
            data.itemClass = await ItemClasses.getItemClasses(data.className, data.type ?? ITEM_TYPE.CONSUMABLE, data.emoji ?? "❓", firstCreater);
            delete data.className
        }
        if (!data.id) {
            data.id = new mongoose.Types.ObjectId().toString()
        }
        const item = new InventoryItem(data, this)
        this.items.set(data.id.toString(), item)
        return item
    }
    async addItem(className, emoji = "❓", type = ITEM_TYPE.CONSUMABLE, firstCreater) {
        // const itemClass = await ItemClasses.getItemClasses(className, type, emoji, firstCreater);
        // const id = new mongoose.Types.ObjectId().toString()
        // const item = new InventoryItem({ id: id, itemClass }, this)
        // this.items.set(id, item)
        //this.onAdditem(className)
        return await this.addItemFromJson({ className, emoji, type }, firstCreater)
    }

    async commit(oldItemDb) {
        const oldIds = oldItemDb
        const newIds = this.getItemIDs()

        const deleted = difference(oldIds, newIds)
        const created = difference(newIds, oldIds)
        if (deleted.length > 0) { await Item.deleteMany({ _id: { $in: deleted } }) }
        if (created.length > 0) { await Item.insertMany(created.map(id => this.getItemById(id).toModelData())) }

        const changed = Array.from(this.dirtyItem).map(item => item.toModelData())
        if (changed.length > 0) {
            const bulkOps = changed.map(item => ({
                updateOne: {
                    filter: { _id: item.id },
                    update: { $set: item },
                }
            }));
            await Inventory.bulkWrite(bulkOps)
        }

        this.items.forEach(item => item.commit())
        this.dirtyItem = new Set()
    }
    toString() {
        const itemsArray = Array.from(this.items.values()).reduce((obj, value) => {
            obj[value.id] = value.toString();
            return obj;
        }, {});
        return {
            items: itemsArray,
        };
    }
    toJson() {
        const itemsArray = Array.from(this.items.values()).reduce((obj, value) => {
            obj[value.id] = value.toJson();
            return obj;
        }, {});
        return {
            items: itemsArray,
        };
    }
    startDrag(id, userId) {
        this.getItemById(id)?.setIsDrag(true, userId)
    }
    endDrag(id, userId) {
        this.getItemById(id)?.setIsDrag(false, userId)
    }
    startLoading(id) {
        this.getItemById(id)?.setIsLoading(true)
    }
    endLoading(id) {
        this.getItemById(id)?.setIsLoading(false)
    }
}

class InventoryDBManager {
    constructor() {
        this.inventorys = new Map();
    }
    async createInventory(id) {
        const inventoryDb = await Inventory.findById(id).exec()
        const inventory = new GameLogic(await inventoryDb.getItems(), id)
        this.inventorys.set(id, inventory)
        return inventory
    }
    async getInventory(id) {
        if (!this.inventorys.has(id)) {
            await this.createInventory(id);
        }
        return this.inventorys.get(id);
    }
    removeInventory(id) {
        this.inventorys.delete(id)
    }
    removeAllInventory() {
        this.inventorys.clear()
    }
    async commitInventory(inventory) {

        const inventoryDb = await Inventory.findById(inventory.id).exec()
        return await inventory.commit(await inventoryDb.getItemIDs())
    }

    async commit() {
        const promises = Array.from(this.inventorys.values()).map(inventory =>
            this.commitInventory(inventory)
        );
        await Promise.all(promises);
    }
}

export const inventoryDBManager = new InventoryDBManager()


