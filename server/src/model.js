import mongoose from 'mongoose';
import { initUser } from './game/game-logic.js';

export const USER_STATUS = {
    BANNED: 'ban',
    NORMAL: 'nor',
    UNVERIFIED: 'unv'
};

export const ITEM_TYPE = {
    CONSUMABLE: 'con',
    MACHINE: 'mac',
    TOOL: 'tool',
    CONTAINER: "container",
    SUBMIT: "sub",
    WAREROOM: "area",
    ANIMAL: "animal"
};

export const LEVEL = {
    PUBLIC: 'pub',
    PRIVATE: 'pri',
}
export const MARKET_TYPE = {
    CONSUMABLE: 'con',
    MACHINE: 'mac',
}
export const INPUT_TYPE = {
    NORMAL: "INPUT_TYPE.NORMAL",
    ALLOW_REFERENCE: "INPUT_TYPE.ALLOW_REFERENCE",
    PRIVATE: "INPUT_TYPE.PRIVATE",
}
export const ATTRIBUTES = {
    MONEY: "金钱"
}

export const LOCK_TYPE = {
    LOCK_OUTPUT: "LOCK_OUTPUT",
    LOCK_INPUT: "LOCK_INPUT",
    LOCK_ACTION: "LOCK_ACTION",
    LOCK_SYNTHESIS: "LOCK_SYNTHESIS",
}
export const TEAM = {
    PLAYER:"player",
    AI:"AI"
}

const LevelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: Object,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: ''
    }
});

LevelSchema.methods = {
    async serialize(user, useContent = true) {
        await this.populate('author');
        const hasLiked = this.likes.some(like => like.equals(user.id));
        return {
            id: this._id,
            title: this.title,
            content: useContent ? this.content : {},
            author: this.author.serialize(LEVEL.PUBLIC),
            likes: this.likes.length,
            isLiked: hasLiked,
            createdAt: formatRelativeTime(this.created_at),
            isPublic: this.isPublic,
            description: this.description
        };
    }
};

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(USER_STATUS),
        default: USER_STATUS.UNVERIFIED,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: String,
    registerTime: { type: Date, default: Date.now },
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
    }
});

UserSchema.pre('save', async function (next) {
    if (this.isNew) {
        const inventory = new Inventory({
            user: this._id
        });
        await inventory.save();
        this.inventory = inventory._id;
        await initUser(this);
    }
    next();
});

// UserSchema.pre('remove', async function (next) {
//     await Inventory.remove({ _id: this.inventory });
//     next();
// });

UserSchema.methods = {
    serialize(level = LEVEL.PUBLIC) {
        const data = {
            id: this._id,
            name: this.name,
            status: this.status
        }
        switch (level) {
            case LEVEL.PRIVATE:
                break;
            case LEVEL.PUBLIC:
                break;
        }
        return data
    },
    async getInventory() {
        await this.populate('inventory');
        return this.inventory;
    },
};

UserSchema.virtual('isVerified').get(function () {
    return this.status === USER_STATUS.NORMAL;
});

UserSchema.virtual('isBanned').get(function () {
    return this.status === USER_STATUS.BANNED;
});

export const ItemClassesDiscoverSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    itemClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ItemClasses',
    }
})
ItemClassesDiscoverSchema.statics = {
    async discover(userId, itemClassId) {
        if (userId && itemClassId) {
            const q = { user: userId, itemClass: itemClassId }
            let classes = await ItemClassesDiscover.findOne(q).exec();
            if (!classes) {
                await ItemClassesDiscover.create(q)
            }
        }
    },
    async countDiscover(itemClassId){
        return await ItemClassesDiscover.find({itemClass:itemClassId}).countDocuments()
    }
}
export const ItemClassesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    emoji: {
        type: String,
        default: '❓'
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(ITEM_TYPE),
        default: ITEM_TYPE.CONSUMABLE
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    first_creater: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});
ItemClassesSchema.methods = {
    async serialize() {
        await this.populate('first_creater')
        return {
            createdAt: formatRelativeTime(this.created_at),
            firstCreater: this.first_creater?.serialize(LEVEL.PUBLIC) ?? {
                name: "无名怪人"
            },
            description: this.description,
            discovedNum: await ItemClassesDiscover.countDiscover(this.id)
        }
    }
}

// 格式化相对时间的函数
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);

    if (diffYear > 0) return `${diffYear}年前`;
    if (diffMonth > 0) return `${diffMonth}个月前`;
    if (diffDay > 0) return `${diffDay}天前`;
    if (diffHour > 0) return `${diffHour}小时前`;
    if (diffMin > 0) return `${diffMin}分钟前`;
    return "刚刚";
}

ItemClassesSchema.statics = {
    async getItemClasses(text, type = ITEM_TYPE.CONSUMABLE, emoji = "❓", first_creater) {
        let classes = await ItemClasses.findOne({ name: text, type, emoji }).exec();
        if (!classes) {
            classes = await ItemClasses.create({ name: text, type, emoji, first_creater });
        }
        await ItemClassesDiscover.discover(first_creater, classes.id)

        return classes;
    },
};

const ItemSchema = new mongoose.Schema({
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ItemClasses',
        required: true
    },
    position_x: {
        type: Number,
        required: true,
        default: 0
    },
    position_y: {
        type: Number,
        required: true,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },

    output: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine',
    },
    outputSlotName: {
        type: Number,
        default: 0
    },
    inputs: {
        type: { type: Map, of: String },
        default: {}
    },

    attributes: {
        type: [String],
        ref: 'Machine',
    },
    actions: {
        type: { type: Map, of: String },
        default: {}
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
});

ItemSchema.methods = {
    async getItemClasses() {
        await this.populate('classes');
        return this.class_id;
    },
    async getInventory() {
        await this.populate('inventory');
        return this.inventory;
    },
    async setInput(input_index, input) {
        if (input_index > Object.keys(this.inputs).length) {
            return false;
        }
        input.setOutput(this, input_index);
        await input.save();
        return true;
    },
    async setOutput(output, outputSlotName) {
        this.output = output._id;
        this.outputSlotName = outputSlotName;
        await this.save();
    },
    async removeInput(input_index) {
        const input = await Machine.findOne({ output: this._id, outputSlotName: input_index }).exec();
        if (input) {
            input.removeOutput();
        }
    },
    async removeOutput() {
        this.output = null;
        this.outputSlotName = null;
        await this.save();
    },
    async getInput(input_index) {
        return await Machine.findOne({ output: this._id, outputSlotName: input_index }).exec();
    },
    async getOutput() {
        await this.populate('output');
        return this.output;
    },
    async getInputCount() {
        return await Machine.countDocuments({ output: this._id });
    },
};

const InventorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
});
// InventorySchema.pre('remove', async function (next) {
//     await Item.remove({ inventory: this._id });
//     next();
// });

InventorySchema.methods = {
    async removeItemById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid item ID format');
        }
        await Item.deleteOne({ _id: id, inventory: this._id });
        return this;
    },
    async removeAll() {
        await Item.deleteMany({ inventory: this._id });
    },
    async getItemById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid item ID format');
        }
        return await Item.findOne({ _id: id, inventory: this._id }).exec();
    },

    async getItems() {
        return await Item.find({ inventory: this._id }).exec();
    },
    async getItemIDs() {
        return (await Item.find({ inventory: this._id }, "_id").exec()).map(item => item._id.toString());
    },
    async getItemNum() {
        return await Item.countDocuments({ inventory: this._id }).exec();
    },
    async addItem(name, emoji = "❓", type = ITEM_TYPE.CONSUMABLE) {
        const classes = await ItemClasses.getItemClasses(name, type, emoji);

        const item = new Item({
            class_id: classes._id,
            inventory: this._id
        });
        await item.save();
        return item;
    }
};

export const ItemClasses = mongoose.model('ItemClasses', ItemClassesSchema);
export const Item = mongoose.model('Items', ItemSchema);
export const Inventory = mongoose.model('Inventory', InventorySchema);
export const User = mongoose.model('User', UserSchema);
export const ItemClassesDiscover = mongoose.model('ItemClassesDiscover', ItemClassesDiscoverSchema)
export const Level = mongoose.model('Level', LevelSchema);