import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { LEVEL, User } from '../model.js';
import config from '../config.js';
import { USER_STATUS } from '../model.js';
import { returnError, returnSuccess } from '../uitls.js';
const router = Router();

const transporter = nodemailer.createTransport({
  service: config.emailService,
  auth: {
    user: config.emailUser,
    pass: config.emailPass
  }
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.sessionMaxAge });
};

// 注册数据验证规则
const registerValidation = [
  body('name').notEmpty().withMessage('用户名不能为空')
    .trim()
    .isLength({ min: 2, max: 12 }).withMessage('用户名长度必须在2-12个字符之间'),
  body('email').notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确'),
  body('password').notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码长度至少为6个字符')
];

// 注册路由
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return returnError(res, errors.array());

    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return returnError(res, '该邮箱已被注册');
    }
    if (await User.findOne({ name })) {
      return returnError(res, '该名字已被注册');
    }
    // 生成邮箱验证token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = new User({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires
    });

    await user.save();

    // 发送验证邮件
    const verificationUrl = `${config.host}/verify-email/${emailVerificationToken}`;

    if (config.env === 'production' && config.sendEmail) {
      await transporter.sendMail({
        to: email,
        subject: '验证您的邮箱',
        html: `请点击此链接验证您的邮箱：<a href="${verificationUrl}">${verificationUrl}</a>`
      });
    }
    
    const token = generateToken(user._id);
    return returnSuccess(res, '注册成功，请查收验证邮件', { token, user: user.serialize(LEVEL.PRIVATE) });
  } catch (error) {
    console.log(error)
    return returnError(res, '注册失败');
  }
});

// 邮箱验证路由
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: '验证链接无效或已过期' });
    }
    if (user.status === USER_STATUS.BANNED) {
      return res.status(403).json({ message: '账号已被封禁' });
    }

    user.status = USER_STATUS.NORMAL;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return returnSuccess(res, '邮箱验证成功');
  } catch (error) {
    return returnError(res, '验证失败', error.message);
  }
});

// 密码登录
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });

    if (!user) {
      return returnError(res, '用户不存在');
    }

    if (user.status === USER_STATUS.BANNED) {
      return returnError(res, '无法登录封禁账户');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return returnError(res, '密码错误');
    }

    const token = generateToken(user._id);
    return returnSuccess(res, '登录成功', { token, user: user.serialize(LEVEL.PRIVATE) });
  } catch (error) {
    return returnError(res, '登录失败', error.message);
  }
});

// 发送邮箱验证码登录
router.post('/login/email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    if (user.status === USER_STATUS.BANNED) {
      return res.status(403).json({ message: '账号已被封禁' });
    }

    // 生成6位验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10分钟后过期
    await user.save();

    // 发送验证码邮件
    if (config.env === 'production' && config.sendEmail) {
      await transporter.sendMail({
        to: email,
        subject: '登录验证码',
        text: `您的登录验证码是：${verificationCode}，10分钟内有效。`
      });
    }

    return returnSuccess(res, '验证码已发送到您的邮箱');
  } catch (error) {
    return returnError(res, '发送验证码失败', error.message);
  }
});

// 验证邮箱验证码
router.post('/login/email/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email,
      emailVerificationToken: code,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({ message: '验证码无效或已过期' });
    }

    // 清除验证码
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    return returnSuccess(res, '登录成功', { token, user: user.toJSON() });
  } catch (error) {
    return returnError(res, '验证失败', error.message);
  }
});

router.get('/check-login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (res.locals.user) {
    return returnSuccess(res, "已登录", { user: res.locals.user.serialize(LEVEL.PRIVATE) });
  }
  return returnSuccess(res, "未登录", false);
});

export default router;
