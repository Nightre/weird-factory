import request from "supertest";
import mongoose from "mongoose";
import { expect } from 'chai';
import config from "../config.js";
import app from "../app.js";
import { User } from '../model.js';
import { USER_STATUS } from '../model.js';

describe('用户系统测试', () => {
    before(async () => {
        await mongoose.connect(config.db);
        await User.deleteMany({}); // 清空测试数据库中的用户数据
    });

    after(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('注册功能', () => {
        it('应该成功注册新用户', async () => {
            const res = await request(app)
                .post('/users/register')
                .send({
                    name: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            expect(res.status).to.equal(200);

            const user = await User.findOne({ email: 'test@example.com' });
            expect(user).to.exist;
            expect(user.name).to.equal('testuser');
            expect(user.emailVerificationToken).to.exist;
        });

        it('不应该允许重复邮箱注册', async () => {
            const res = await request(app)
                .post('/users/register')
                .send({
                    name: 'testuser2',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });
    });

    describe('邮箱验证功能', () => {
        let verificationToken;

        before(async () => {
            const user = await User.findOne({ email: 'test@example.com' });
            verificationToken = user.emailVerificationToken;
        });

        it('应该成功验证邮箱', async () => {
            const res = await request(app)
                .get(`/users/verify-email/${verificationToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;

            const user = await User.findOne({ email: 'test@example.com' });
            expect(user.status).to.equal(USER_STATUS.NORMAL);
            expect(user.emailVerificationToken).to.be.undefined;
        });

        it('不应该接受无效的验证token', async () => {
            const res = await request(app)
                .get('/users/verify-email/invalidtoken');

            expect(res.status).to.equal(400);
        });
    });

    describe('密码登录功能', () => {
        it('应该成功登录已验证用户', async () => {
            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('name', 'testuser');
        });

        it('不应该允许错误密码登录', async () => {
            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).to.equal(401);
        });
    });

    describe('邮箱验证码登录功能', () => {
        it('应该成功发送验证码', async () => {
            const res = await request(app)
                .post('/users/login/email')
                .send({
                    email: 'test@example.com'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;

            const user = await User.findOne({ email: 'test@example.com' });
            expect(user.emailVerificationToken).to.exist;
        });

        it('应该成功验证邮箱验证码', async () => {
            const user = await User.findOne({ email: 'test@example.com' });
            const verificationCode = user.emailVerificationToken;

            const res = await request(app)
                .post('/users/login/email/verify')
                .send({
                    email: 'test@example.com',
                    code: verificationCode
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('name', 'testuser');
        });

        it('不应该接受错误的验证码', async () => {
            const res = await request(app)
                .post('/users/login/email/verify')
                .send({
                    email: 'test@example.com',
                    code: '000000'
                });

            expect(res.status).to.equal(401);
        });
    });
});