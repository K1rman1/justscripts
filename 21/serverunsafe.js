const express = require('express');
const app = express();
const port = 3000;

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
    
    const results = [
        { title: 'Статья 1', content: 'Содержимое статьи...' },
        { title: 'Статья 2', content: 'Ещё содержимое...' }
    ];
    
    let resultsHtml = '';
    results.forEach(function(r) {
        resultsHtml += `<div><h3>${r.title}</h3><p>${r.content}</p></div>`;
    });
    
    res.send(`
        <h1>Результаты поиска</h1>
        <p style="color:blue">Результаты по запросу: ${query}</p>
        ${resultsHtml}
        <a href="/">Назад</a>
    `);
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});

//http://localhost:3000/search?q=<script>window.location='https://ru.wikipedia.org/wiki/%D0%AD%D1%81%D1%82%D0%BB%D0%B8,_%D0%A0%D0%B8%D0%BA'</script>