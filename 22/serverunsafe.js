const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, about TEXT)`);
    db.run(`INSERT INTO users VALUES (1, 'admin', '123', 'Администратор сайта')`);
    db.run(`INSERT INTO users VALUES (2, 'user', '123', 'Обычный пользователь')`);
});

app.get('/', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.send(`
        <h1>Профиль</h1>
        <a href="/profile/${req.session.userId}">Мой публичный профиль</a><br>
        <a href="/edit">Редактировать</a> | <a href="/logout">Выйти</a>
    `);
});

app.get('/login', (req, res) => {
    res.send(`
        <h1>Вход</h1>
        <form action="/login" method="POST">
            <input name="username" placeholder="Логин"><br><br>
            <input name="password" type="password" placeholder="Пароль"><br><br>
            <button type="submit">Войти</button>
        </form>
        <p><a href="/login?demo=admin">Войти как Admin</a> | <a href="/login?demo=user">Войти как User</a></p>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
        if (!user) return res.send('Ошибка <a href="/login">Назад</a>');
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/');
    });
});

app.get('/edit', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
        res.send(`
            <h1>Редактировать профиль</h1>
            <form action="/edit" method="POST">
                <label>О себе:</label><br>
                <textarea name="about" rows="5" cols="50">${user.about || ''}</textarea><br><br>
                <button type="submit">Сохранить</button>
            </form>
            <a href="/">Назад</a>
        `);
    });
});

app.post('/edit', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { about } = req.body;
    db.run(`UPDATE users SET about = ? WHERE id = ?`, [about, req.session.userId], (err) => {
        res.redirect('/');
    });
});

app.get('/profile/:id', (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, user) => {
        if (!user) return res.send('Пользователь не найден');
        res.send(`
            <h1>Профиль: ${user.username}</h1>
            <p><strong>О себе:</strong></p>
            <div style="border:1px solid #ccc; padding:10px;">
                ${user.about || 'Нет информации'}  Вывод без экранирования!
            </div>
            <a href="/">Назад</a>
        `);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});

//<img src=x onerror=alert('XSS')>