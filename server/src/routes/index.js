import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { returnSuccess } from '../uitls.js';
import fs from 'fs';
import config from '../config.js';
import { ItemClasses, ItemClassesDiscover } from '../model.js';

var router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/help', function (req, res, next) {
  const helpFilePath = path.join(__dirname, '../public/help.html');
  fs.readFile(helpFilePath, 'utf8', (err, data) => {
    if (err) {
      return next(err);
    }
    return returnSuccess(res, '帮助页面内容', data);
  });
});

router.get('/discover_num', async function (req, res, next) {

  return returnSuccess(res, null, {
    num: await ItemClasses.countDocuments().exec(),
    self_num: await ItemClassesDiscover.find({ user: res.locals?.user }).countDocuments().exec(),
  });
});

router.get('/version', function (req, res, next) {
  return returnSuccess(res, '游戏版本', config.gameVersion);
});

export default router;
