const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)`);
    db.run(`CREATE TABLE feedback (id INTEGER PRIMARY KEY, user_id INTEGER, message TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    db.run(`INSERT INTO users VALUES (1, 'admin', '123', 'admin')`);
    db.run(`INSERT INTO users VALUES (2, 'user', '123', 'user')`);
});

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
    if (!req.session.userId) return res.redirect('/login');
    res.send(`
        <h1>Обратная связь</h1>
        <p>Привет, ${escapeHtml(req.session.username)}!</p>
        <form action="/feedback" method="POST">
            <textarea name="message" placeholder="Ваше сообщение..." rows="5" cols="50" required></textarea><br><br>
            <button type="submit">Отправить</button>
        </form>
        ${req.session.role === 'admin' ? '<a href="/admin">Админ-панель</a> | ' : ''}
        <a href="/logout">Выйти</a>
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
        req.session.role = user.role;
        res.redirect('/');
    });
});

app.post('/feedback', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { message } = req.body;
    
    if (message.length > 1000) {
        return res.send('Сообщение слишком длинное <a href="/">Назад</a>');
    }
    
    db.run(`INSERT INTO feedback (user_id, message) VALUES (?, ?)`, [req.session.userId, message], (err) => {
        res.redirect('/');
    });
});

app.get('/admin', (req, res) => {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.send('Доступ запрещён <a href="/">Назад</a>');
    }
    
    db.all(`SELECT f.*, u.username FROM feedback f JOIN users u ON f.user_id = u.id ORDER BY f.id DESC`, [], (err, messages) => {
        let messagesHtml = '';
        messages.forEach(function(m) {
            const safeUsername = escapeHtml(m.username);
            const safeMessage = escapeHtml(m.message);
            const safeDate = escapeHtml(m.created_at);
            
            messagesHtml += `
                <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                    <strong>От: ${safeUsername}</strong> <small>(${safeDate})</small><br>
                    <p>${safeMessage}</p>
                </div>
            `;
        });
        
        res.send(`
            <h1>Админ-панель</h1>
            <p>Сообщения от пользователей:</p>
            ${messagesHtml || '<p>Нет сообщений</p>'}
            <a href="/">Назад</a> | <a href="/logout">Выйти</a>
        `);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});