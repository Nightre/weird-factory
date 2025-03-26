import express, { json, urlencoded } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import jwt from 'jsonwebtoken';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import downloadRouter from './routes/download.js'
import gameRouter, { startSocketServer } from './routes/game.js';
import levelsRouter from './routes/levels.js';

import mongoose from 'mongoose';
import config from './config.js';

import { User } from './model.js';
import { ApiError } from './uitls.js';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

export const db = mongoose.connect(config.db);

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use((req, res, next) => {
    const origin = req.headers.origin;
    app.disable('x-powered-by');
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

export const authMiddleware = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, config.jwtSecret);

            const user = await User.findById(decoded.id).exec();
            if (user) {
                res.locals.user = user;
            }
        }
        next();
    } catch (error) {
        next();
    }
}

app.use(authMiddleware);

app.get('/', function (req, res, next) {
    res.send('Hello there, hacker friend! If you are here to test the security, keep going. Have fun :) -- From ******');
});

app.use('/', downloadRouter);
app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/game', gameRouter);
app.use('/api/levels', levelsRouter);

app.use((req, res, next) => {
    next(new ApiError(404, '接口不存在'));
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = status === 500
        ? '服务器内部错误'
        : err.message;

    res.status(status).json({
        success: false,
        error: {
            status,
            message,
        }
    });
});


export default app;
