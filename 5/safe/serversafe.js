const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

function csrfProtection(req, res, next) {
    if (req.method === 'POST') {
        const tokenFromSession = req.session.csrfToken;
        const tokenFromRequest = req.body._csrf;
        
        if (!tokenFromSession || !tokenFromRequest || tokenFromSession !== tokenFromRequest) {
            return res.status(403).send(`
                <h1>403 Forbidden</h1>
                <p>CSRF-токен не совпадает или отсутствует</p>
                <a href="/profile">Назад</a>
            `);
        }
    }
    next();
}

function addCSRFToken(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
}

app.use(addCSRFToken);

const usersDB = {
    'user1': { id: 1, email: 'user1@example.com', password: '123' }
};

app.get('/login', (req, res) => {
    res.send(`
        <h1>Вход</h1>
        <form action="/login" method="POST">
            <input name="username" placeholder="Логин"><br><br>
            <input name="password" type="password" placeholder="Пароль"><br><br>
            <button type="submit">Войти</button>
        </form>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (usersDB[username] && usersDB[username].password === password) {
        req.session.userId = username;
        req.session.email = usersDB[username].email;
        req.session.csrfToken = generateCSRFToken(); 
        return res.redirect('/profile');
    }
    res.send('Неверный логин или пароль <a href="/login">Назад</a>');
});

app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.send(`
        <h1>Профиль пользователя: ${req.session.userId}</h1>
        <p>Текущий email: ${req.session.email}</p>
        <form action="/change-email" method="POST">
            <!-- CSRF-ТОКЕН В ФОРМЕ -->
            <input type="hidden" name="_csrf" value="${req.session.csrfToken}">
            <input name="email" placeholder="Новый email"><br><br>
            <button type="submit">Изменить email</button>
        </form>
        <a href="/logout">Выйти</a>
    `);
});
app.post('/change-email', csrfProtection, (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    const { email } = req.body;
    req.session.email = email;
    req.session.csrfToken = generateCSRFToken();
    
    res.send(`
        <h1>Email изменён на: ${email}</h1>
        <a href="/profile">Вернуться в профиль</a>
    `);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Безопасный сервер запущен на http://localhost:${port}`);
});