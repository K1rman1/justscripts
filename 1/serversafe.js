const express = require('express');
const app = express();
const port = 3001;
const usersDB = [];
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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
    let usersHtml = '';
    usersDB.forEach(function(u) {
        const safeName = escapeHtml(u.username);
        usersHtml += '<div>Пользователь: ' + safeName + '</div><br>';
    });

    res.send(`
        <h1>Регистрация (Безопасная)</h1>
        <form action="/register" method="POST">
            <input name="username" placeholder="Имя пользователя"><br><br>
            <input name="email" placeholder="Email"><br><br>
            <input name="password" type="password" placeholder="Пароль"><br><br>
            <button type="submit">Зарегистрироваться</button>
        </form>
        <h2>Список пользователей:</h2>
        <div id="users-list">${usersHtml}</div>
    `);
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || username.length < 2) {
        return res.status(400).send('Имя слишком короткое <a href="/">Назад</a>');
    }
    
    usersDB.push({ username, email, password });
    res.redirect('/');
});

app.get('/users', (req, res) => {
    res.json(usersDB);
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});