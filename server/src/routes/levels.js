import express from 'express';
import { Level } from '../model.js';
import { returnError, returnSuccess } from '../uitls.js';
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

// 校验关卡内容的函数
const validateLevelContent = (content) => {
    const contentJson = typeof content === 'string' ? JSON.parse(content) : content;
    const ajv = new Ajv();
    const valid = ajv.validate(gameConfigSchema, contentJson);

    if (!valid) {
        throw new Error('内容格式错误: \n' + ajv.errors[0].message);
    }

    return contentJson;
};

// 发布关卡
router.post('/create', requireAuth, async (req, res) => {
    const { title, content, isPublic = false, description = '' } = req.body;

    if (!title || !content) {
        return returnError(res, '标题和内容不能为空');
    }
    try {
        const contentJson = validateLevelContent(content);
        const level = await Level.create({
            title,
            content: contentJson,
            isPublic,
            author: res.locals.user._id,
            description
        });

        return returnSuccess(res, '关卡创建成功', await level.serialize());
    } catch (error) {
        return returnError(res, '必须为JSON格式' + error.message);
    }
});

// 修改关卡
router.post('/update/:id', requireAuth, async (req, res) => {
    const { title, content, id, isPublic = false, description = '' } = req.body;

    if (!title || !content) {
        return returnError(res, '标题和内容不能为空');
    }
    try {
        const contentJson = validateLevelContent(content);
        const level = await Level.findByIdAndUpdate(id, {
            title,
            content: contentJson,
            author: res.locals.user.id,
            isPublic,
            description
        }, { new: true });

        if (!level || level.author.toString() !== res.locals.user.id) {
            return returnError(res, '关卡不存在');
        }

        return returnSuccess(res, '关卡更新成功', await level.serialize(res.locals.user));
    } catch (error) {
        return returnError(res, '必须为JSON格式' + error.message);
    }
});

// 获取关卡列表
router.get('/search', requireAuth, async (req, res) => {
    const { search = '', page = 1, limit = 20 } = req.query;

    const query = {
        isPublic: true,  // 只搜索公开的关卡
        ...(search ? { title: new RegExp(search, 'i') } : {})
    };

    const levels = await Level.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Level.countDocuments(query);

    return returnSuccess(res, '获取关卡列表成功', {
        data: await Promise.all(levels.map(level => level.serialize(res.locals.user, false))),
        total,
        page: parseInt(page),
        limit: parseInt(limit)
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

    return returnSuccess(res, '点赞操作成功', await level.serialize(res.locals.user));
});

router.get('/featured', requireAuth, async (req, res) => {
    const levels = await Level.find({ isPublic: true, featured: true }).sort({ likes: -1 }).limit(4);
    return returnSuccess(res, '获取精选关卡成功', {
        data: await Promise.all(levels.map(level => level.serialize(res.locals.user, false)))
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

    return returnSuccess(res, '获取我的关卡成功', {
        data: await Promise.all(levels.map(level => level.serialize(res.locals.user, false))),
        total,
        page: parseInt(page),
        limit: parseInt(limit)
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

    return returnSuccess(res, '关卡已删除');
});

// 获取单个关卡
router.get('/:id', requireAuth, async (req, res) => {
    const level = await Level.findById(req.params.id);
    if (!level) {
        return returnError(res, '关卡不存在');
    }

    return returnSuccess(res, '获取关卡成功', await level.serialize(res.locals.user));
});

export default router; 