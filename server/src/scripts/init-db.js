import mongoose from 'mongoose';
import config from '../config.js';
import { User, Item, Inventory, USER_STATUS } from '../model.js';
import bcrypt from 'bcryptjs';

const initDatabase = async () => {
    // 连接数据库
    console.log('正在连接数据库...');
    await mongoose.connect(config.db);
    console.log('数据库连接成功！');

    // 删除所有现有数据（小心使用！）
    console.log('清理现有数据...');
    await Promise.all([
        User.deleteMany({}),
        Item.deleteMany({}),
        Inventory.deleteMany({}),
    ]);

    // 创建管理员用户
    console.log('创建管理员用户...');
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = new User({
        name: 'admin',
        email: 'admin@example.coml',
        password: adminPassword,
        status: USER_STATUS.NORMAL,
    });
    await admin.save();

    await mongoose.connection.close();
};

// 运行初始化
initDatabase(); 