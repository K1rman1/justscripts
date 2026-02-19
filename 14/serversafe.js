const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3001;

const uploadDir = './secure_uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
};

function checkFileSignature(buffer) {
    if (!buffer || buffer.length < 4) return null;
    
    const signatures = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46]
    };
    
    for (const [mime, sig] of Object.entries(signatures)) {
        if (sig.every((byte, i) => buffer[i] === byte)) return mime;
    }
    return null;
}

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
        return cb(new Error('❌ Недопустимый тип файла'), false);
    }
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = ALLOWED_EXT[file.mimetype];
        const safeName = crypto.randomBytes(16).toString('hex') + '.' + ext;
        cb(null, safeName);
    }
});

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    if (!filepath.startsWith(uploadDir)) {
        return res.status(403).send('Доступ запрещён');
    }
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).send('Файл не найден');
    }
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filepath);
});

app.get('/', (req, res) => {
    let filesList = '';
    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        files.forEach(function(file) {
            filesList += `<a href="/files/${file}" target="_blank">${file}</a><br>`;
        });
    }
    
    res.send(`
        <h1>Загрузка аватарки (только изображения)</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="avatar" accept="image/*" required><br><br>
            <button type="submit">Загрузить</button>
        </form>
        <h2>Ваши файлы:</h2>
        <div>${filesList}</div>
    `);
});

app.post('/upload', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.send('❌ Ошибка: Недопустимый файл <a href="/">Назад</a>');
    const signature = checkFileSignature(req.file.buffer);
    if (!signature || !ALLOWED_MIMES.includes(signature)) {
        fs.unlinkSync(req.file.path);
        return res.send('Файл не является изображением <a href="/">Назад</a>');
    }
    
    res.send(`Файл загружен: <a href="/files/${req.file.filename}">Открыть</a> <a href="/">Назад</a>`);
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});