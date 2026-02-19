const express = require('express');
const session = require('express-session');
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const users = { 'admin': '12345' };
const loginAttempts = new Map();
const MAX_ATTEMPTS = 3;
const BLOCK_TIME = 60000;
const DELAY = 2000;

function checkBlock(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const attempt = loginAttempts.get(ip);
    
    if (attempt && attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
        const remaining = Math.ceil((attempt.blockedUntil - Date.now()) / 1000);
        return res.status(429).send(`IP заблокирован на ${remaining} сек`);
    }
    next();
}

app.use(checkBlock);

app.get('/', (req, res) => {
    if (req.session.logged) return res.send('<h1>Вход выполнен</h1>');
    res.send(`
        <h1>Вход (Защищённый)</h1>
        <p style="color:red">${req.query.error || ''}</p>
        <form action="/login" method="POST">
            <input name="username" value="admin"><br><br>
            <input name="password" type="password"><br><br>
            <button type="submit">Войти</button>
        </form>
    `);
});

app.post('/login', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const { username, password } = req.body;
    if (!loginAttempts.has(ip)) {
        loginAttempts.set(ip, { count: 0, blockedUntil: null });
    }
    const attempt = loginAttempts.get(ip);
    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
        return res.status(429).send('IP заблокирован');
    }
    if (users[username] && users[username] === password) {
        loginAttempts.delete(ip);
        req.session.logged = true;
        return res.send('<h1>Вход выполнен!</h1>');
    }
    attempt.count++;
    
    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.blockedUntil = Date.now() + BLOCK_TIME;
        return res.status(429).send(`Превышен лимит попыток. Блокировка на ${BLOCK_TIME/1000} сек`);
    }
    await new Promise(r => setTimeout(r, DELAY));
    
    res.send(`Неверный пароль (Попыток: ${attempt.count}/${MAX_ATTEMPTS}) <a href="/">Назад</a>`);
});

app.listen(port, () => {
    console.log(`Защищённый сервер: http://localhost:${port}`);
});