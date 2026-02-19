const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const users = { 'admin': '12345' };

app.get('/', (req, res) => {
    if (req.session.logged) return res.send('<h1>Вход выполнен!</h1>');
    res.send(`
        <h1>Вход</h1>
        <form action="/login" method="POST">
            <input name="username" value="admin"><br><br>
            <input name="password" type="password"><br><br>
            <button type="submit">Войти</button>
        </form>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.logged = true;
        return res.send('<h1>Вход выполнен!</h1>');
    }
    res.send('Неверный пароль <a href="/">Назад</a>');
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});