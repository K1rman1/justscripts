const express = require('express');
const app = express();
const port = 3001;

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidUrl(url) {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

app.get('/', (req, res) => {
    const referer = req.headers.referer || 'Прямой переход';
    const safeReferer = escapeHtml(referer);
    
    res.send(`
        <h1>Добро пожаловать!</h1>
        <p style="color:blue">Вы пришли с: ${safeReferer}</p>
        <p>Это страница главного меню.</p>
        <a href="/page">Перейти на страницу</a>
    `);
});

app.get('/page', (req, res) => {
    const referer = req.headers.referer || 'Прямой переход';
    const safeReferer = escapeHtml(referer);
    
    res.send(`
        <h1>Страница контента</h1>
        <p style="color:blue">Вы пришли с: ${safeReferer}</p>
        <p>Здесь какой-то контент...</p>
        <a href="/">На главную</a>
    `);
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});