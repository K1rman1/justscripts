const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: crypto.randomBytes(32).toString('hex'), 
    resave: false, 
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true, 
        maxAge: 15 * 60 * 1000, 
        sameSite: 'strict'
    },
    name: 'sessionId'
}));

const users = { 
    'admin': { password: '123', role: 'admin' },
    'user': { password: '123', role: 'user' }
};

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('Требуется авторизация <a href="/">Войти</a>');
    }
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).send('Требуется авторизация');
        }
        if (req.session.role !== role) {
            return res.status(403).send('Недостаточно прав');
        }
        next();
    };
}

app.get('/', (req, res) => {
    if (req.session.userId) {
        const expireTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleString();
        res.send(`
            <h1>Привет, ${req.session.userId}!</h1>
            <p>Роль: ${req.session.role}</p>
            <p>Сессия действительна до: ${expireTime}</p>
            <p>Время входа: ${new Date(req.session.loginTime).toLocaleString()}</p>
            <a href="/profile">Профиль</a> | 
            ${req.session.role === 'admin' ? '<a href="/admin">Админка</a> | ' : ''}
            <a href="/logout">Выйти</a>
        `);
    } else {
        res.send(`
            <h1>Вход</h1>
            <form action="/login" method="POST">
                <input name="username" placeholder="Логин" value="admin"><br><br>
                <input name="password" type="password" placeholder="Пароль" value="123"><br><br>
                <button type="submit">Войти</button>
            </form>
        `);
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (users[username] && users[username].password === password) {
        req.session.regenerate((err) => {
            if (err) {
                console.error(err);
                return res.send('Ошибка сессии <a href="/">Назад</a>');
            }
            req.session.userId = username;
            req.session.role = users[username].role;
            req.session.loginTime = Date.now();
            res.redirect('/');
        });
        return;
    }
    res.send('Неверный логин/пароль <a href="/">Назад</a>');
});



app.get('/profile', requireAuth, (req, res) => {
    res.send(`
        <h1>Профиль</h1>
        <p>Пользователь: ${req.session.userId}</p>
        <p>Роль: ${req.session.role}</p>
        <p>Время входа: ${new Date(req.session.loginTime).toLocaleString()}</p>
        <a href="/">Назад</a>
    `);
});

app.get('/admin', requireRole('admin'), (req, res) => {
    res.send(`
        <h1>Админка</h1>
        <p style="color:green">Доступ разрешён только администраторам</p>
        <p>Пользователь: ${req.session.userId}</p>
        <p>Роль: ${req.session.role}</p>
        <a href="/">Назад</a>
    `);
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.clearCookie('sessionId');
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
});