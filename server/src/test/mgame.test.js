import request from "supertest";
import mongoose from "mongoose";
import { expect } from 'chai';
import config from "../config.js";
import app from "../app.js";
import { Inventory, Item, ItemClasses, User } from '../model.js';
import { USER_STATUS } from '../model.js';
import { initUser, inventoryDBManager } from "../game/game-logic.js";

describe('游戏测试', function () {  // 移除 async
    before(async function () {
        await mongoose.connect(config.db);
        await User.deleteMany({})
        await Promise.all([
            Item.deleteMany({}),
            Inventory.deleteMany({}),
            ItemClasses.deleteMany({}),
        ]);

        this.user = new User({
            name: 'test',
            email: 'test@test.com',
            password: 'test',
            status: USER_STATUS.NORMAL,
        });

        await this.user.save();
        await initUser(this.user);

    });

    after(async function () {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe("物品数据库", function () {
        it("添加物品应该创建类", async function () {
            const inventory = await this.user.getInventory();

            await inventory.addItem('石头');
            await inventory.addItem('木头');

            const item = await ItemClasses.findOne({ name: "石头" });
            expect(item).to.exist;
            const item2 = await ItemClasses.findOne({ name: "木头" });
            expect(item2).to.exist;
        });

        it("应该删除物品", async function () {
            const inventory = await this.user.getInventory();

            const item = await inventory.addItem('木头');

            await inventory.removeItemById(item._id)

            expect(await inventory.getItemById(item._id)).to.not.exist;
        });
    });

    describe("物品缓存", function () {

        beforeEach(function () {
            inventoryDBManager.removeAllInventory()
        });

        it("从DB读取创建", async function () {
            const inventory = await this.user.getInventory();

            await inventory.removeAll()
            await inventory.addItem('石头');
            await inventory.addItem('木头');
            const chache_inventory = await inventoryDBManager.createInventory(inventory._id)
            expect(chache_inventory.getItemNum()).to.be.equal(2)
        });

        it("保存到DB", async function () {
            const inventory = await this.user.getInventory();

            await inventory.removeAll()
            const i1 = await inventory.addItem('石头');
            const i2 = await inventory.addItem('木头');
            expect(await inventory.getItemNum()).to.be.equal(2)
            const chache_inventory = await inventoryDBManager.createInventory(inventory._id)
            //chache_inventory.removeItemById(i2._id)
            await chache_inventory.addItem("木棍")
            await chache_inventory.addItem("木棍")

            await inventoryDBManager.commitInventory(chache_inventory)
            expect(await inventory.getItemNum()).to.be.equal(2 + 2)

            chache_inventory.removeItemById(i1._id)
            chache_inventory.removeItemById(i2._id)

            await inventoryDBManager.commitInventory(chache_inventory)
            expect(await inventory.getItemNum()).to.be.equal(2)
        });

        it("属性保存到DB", async function () {
            const inventory = await this.user.getInventory();
            const chache_inventory = await inventoryDBManager.createInventory(inventory._id)

            const i1 = await chache_inventory.addItem("孙子")
            i1.changeProperty("position_x", 1145)

            await inventoryDBManager.commitInventory(chache_inventory)
            expect(await inventory.getItemById(i1.id)).to.have.property("position_x").eq(1145)
        })
    });
});
