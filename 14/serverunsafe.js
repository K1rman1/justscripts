const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const uploadDir = './public/uploads/';
if (!fs.existsSync('./public')) fs.mkdirSync('./public');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

app.use(express.static('public'));

app.get('/', (req, res) => {
    let filesList = '';
    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        files.forEach(function(file) {
            filesList += `<a href="/uploads/${file}" target="_blank">${file}</a><br>`;
        });
    }
    
    res.send(`
        <h1>Загрузка аватарки (Уязвимая)</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="avatar" required><br><br>
            <button type="submit">Загрузить</button>
        </form>
        <h2>Ваши файлы:</h2>
        <div>${filesList}</div>
    `);
});

app.post('/upload', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.send('Ошибка загрузки <a href="/">Назад</a>');
    res.send(`Файл загружен: <a href="/uploads/${req.file.filename}">Открыть</a> <a href="/">Назад</a>`);
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});