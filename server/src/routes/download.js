import { Router } from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/main.apk', function (req, res, next) {
    const filePath = path.join(__dirname, '../public', 'main.apk');
    try {
        res.download(filePath, 'main.apk');
    } catch (err) {
        res.status(404).send('File not found');
    }
});



export default router;