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

app.get('/', (req, res) => {
    res.send(`
        <h1>Поиск по сайту</h1>
        <form action="/search" method="GET">
            <input name="q" placeholder="Поиск...">
            <button type="submit">Найти</button>
        </form>
    `);
});

app.get('/search', (req, res) => {
    const query = req.query.q || '';
    const safeQuery = escapeHtml(query);
    
    const results = [
        { title: 'Статья 1', content: 'Содержимое статьи...' },
        { title: 'Статья 2', content: 'Ещё содержимое...' }
    ];
    
    let resultsHtml = '';
    results.forEach(function(r) {
        resultsHtml += `<div><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.content)}</p></div>`;
    });
    
    res.send(`
        <h1>Результаты поиска</h1>
        <p style="color:blue">Результаты по запросу: ${safeQuery}</p>
        ${resultsHtml}
        <a href="/">Назад</a>
    `);
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});