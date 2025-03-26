import express from 'express';
import { Level } from '../model.js';
import { returnError } from '../uitls.js';
import Ajv from 'ajv';
import { gameConfigSchema } from '../game-data/game-config.js';

const router = express.Router();

// 需要登录的中间件
const requireAuth = (req, res, next) => {
    if (!res.locals.user) {
        return returnError(res, '需要登录');
    }
    next();
};

// 发布关卡
router.post('/create', requireAuth, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return returnError(res, '标题和内容不能为空');
    }
    try {
        const contentJson = JSON.parse(content)
        const ajv = new Ajv()
        const valid = ajv.validate(gameConfigSchema, contentJson)

        if (!valid) {
            return returnError(res, '内容格式错误: \n' + ajv.errors[0].message);
        }
        const level = await Level.create({
            title,
            content: contentJson,
            author: res.locals.user._id
        });

        res.json({
            success: true,
            data: await level.serialize()
        });
    } catch (error) {
        return returnError(res, '必须为JSON格式' + error.message);
    }
});

// 获取关卡列表
router.get('/search', requireAuth, async (req, res) => {
    const { search = '', page = 1, limit = 20 } = req.query;

    const query = search
        ? { title: new RegExp(search, 'i') }
        : {};

    const levels = await Level.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Level.countDocuments(query);

    res.json({
        success: true,
        data: {
            data: await Promise.all(levels.map(level => level.serialize(res.locals.user, false))),
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        }
    });
});

// 点赞关卡
router.post('/:id/like', requireAuth, async (req, res) => {
    const level = await Level.findById(req.params.id);
    if (!level) {
        return returnError(res, '关卡不存在');
    }

    const userId = res.locals.user._id;
    const hasLiked = level.likes.includes(userId);

    if (hasLiked) {
        level.likes = level.likes.filter(id => !id.equals(userId));
    } else {
        level.likes.push(userId);
    }

    await level.save();

    res.json({
        success: true,
        data: await level.serialize(res.locals.user),
    });
});

// 获取我的关卡
router.get('/my-levels', requireAuth, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const query = { author: res.locals.user._id };
    const levels = await Level.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Level.countDocuments(query);

    res.json({
        success: true,
        data: {
            data: await Promise.all(levels.map(level => level.serialize(res.locals.user, false))),
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        }
    });
});


// 删除关卡
router.delete('/delete/:id', requireAuth, async (req, res) => {
    const level = await Level.findById(req.params.id);
    if (!level) {
        return returnError(res, '关卡不存在');
    }

    // 检查是否是作者
    if (!level.author.equals(res.locals.user._id)) {
        return returnError(res, '只能删除自己创建的关卡');
    }

    await level.deleteOne();

    res.json({
        success: true,
        message: '关卡已删除'
    });
});

// 获取单个关卡
router.get('/:id', requireAuth, async (req, res) => {
    const level = await Level.findById(req.params.id);
    if (!level) {
        return returnError(res, '关卡不存在');
    }

    res.json({
        success: true,
        data: await level.serialize(res.locals.user)
    });
});

export default router; 