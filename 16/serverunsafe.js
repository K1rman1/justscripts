const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)`);
    db.run(`CREATE TABLE documents (id INTEGER PRIMARY KEY, owner_id INTEGER, title TEXT, content TEXT)`);
    db.run(`INSERT INTO users VALUES (1, 'alice', '123')`);
    db.run(`INSERT INTO users VALUES (2, 'bob', '123')`);
    db.run(`INSERT INTO documents VALUES (1, 1, 'Мои заметки', 'Секретный контент Алисы')`);
    db.run(`INSERT INTO documents VALUES (2, 1, 'Пароли', 'alice_password: secret123')`);
    db.run(`INSERT INTO documents VALUES (3, 2, 'Финансы', 'Счёт банка Боба: 123456')`);
    db.run(`INSERT INTO documents VALUES (4, 2, 'Личное', 'Дневник Боба')`);
});

app.get('/', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    
    db.all(`SELECT id, title FROM documents WHERE owner_id = ?`, [req.session.userId], (err, docs) => {
        let docsList = '';
        docs.forEach(function(doc) {
            docsList += `<li><a href="/documents/${doc.id}">${doc.title}</a></li>`;
        });
        
        res.send(`
            <h1>Привет, ${req.session.username}!</h1>
            <h2>Ваши документы:</h2>
            <ul>${docsList}</ul>
            <a href="/logout">Выйти</a>
        `);
    });
});

app.get('/login', (req, res) => {
    res.send(`
        <h1>Вход</h1>
        <form action="/login" method="POST">
            <input name="username" placeholder="Логин"><br><br>
            <input name="password" type="password" placeholder="Пароль"><br><br>
            <button type="submit">Войти</button>
        </form>
        <p><a href="/login?user=alice">Войти как Alice</a> | <a href="/login?user=bob">Войти как Bob</a></p>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
        if (!user) return res.send('Неверный логин/пароль <a href="/login">Назад</a>');
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/');
    });
});

app.get('/documents/:id', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const docId = req.params.id;
    db.get(`SELECT * FROM documents WHERE id = ?`, [docId], (err, doc) => {
        if (!doc) return res.send('Документ не найден <a href="/">Назад</a>');
        res.send(`
            <h1>${doc.title}</h1>
            <p>${doc.content}</p>
            <p><small>Владелец ID: ${doc.owner_id}</small></p>
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