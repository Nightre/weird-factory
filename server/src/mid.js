import { ApiError } from './uitls.js';
import { USER_STATUS } from './model.js';

export const requireLogin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.status != USER_STATUS.BANNED) {
        next();
    } else {
        next(new ApiError(401, '需要登录'));
    }
};

export const requireVerifiedLogin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.status == USER_STATUS.NORMAL) {
        next();
    } else {
        next(new ApiError(401, '需要登录'));
    }
};