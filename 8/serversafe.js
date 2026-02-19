const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const usersDB = [];

app.get('/register', (req, res) => {
    res.send(`
        <h1>Регистрация</h1>
        <form action="/register" method="POST">
            <input name="username" placeholder="Логин" required><br><br>
            <input name="password" type="password" placeholder="Пароль" required><br><br>
            <button type="submit">Зарегистрироваться</button>
        </form>
        <a href="/login">Уже есть аккаунт? Войти</a>
    `);
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (usersDB.find(u => u.username === username)) {
        return res.send('Пользователь существует <a href="/register">Назад</a>');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    usersDB.push({ username, password: hashedPassword });
    res.send('Успешно! <a href="/login">Войти</a>');
});
app.get('/login', (req, res) => {
    res.send(`
        <h1>Вход</h1>
        <form action="/login" method="POST">
            <input name="username" placeholder="Логин" required><br><br>
            <input name="password" type="password" placeholder="Пароль" required><br><br>
            <button type="submit">Войти</button>
        </form>
        <a href="/register">Нет аккаунта? Регистрация</a>
    `);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = usersDB.find(u => u.username === username);
    
    if (!user) {
        return res.send('Пользователь не найден <a href="/login">Назад</a>');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return res.send('Неверный пароль <a href="/login">Назад</a>');
    }
    
    req.session.userId = username;
    res.send(`
        <h1>Добро пожаловать, ${username}!</h1>
        <a href="/profile">Профиль</a> | <a href="/logout">Выйти</a>
    `);
});

app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.send(`
        <h1>Профиль: ${req.session.userId}</h1>
        <a href="/logout">Выйти</a>
    `);
});

app.get('/debug/users', (req, res) => {
    res.json(usersDB);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});