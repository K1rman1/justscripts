const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

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
            <input name="email" placeholder="Новый email"><br><br>
            <button type="submit">Изменить email</button>
        </form>
        <a href="/logout">Выйти</a>
    `);
});

app.post('/change-email', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    const { email } = req.body;
    req.session.email = email;
    
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
    console.log(`Уязвимый сервер запущен на http://localhost:${port}`);
});