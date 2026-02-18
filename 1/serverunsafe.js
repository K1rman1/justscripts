const express = require('express');
const app = express();
const port = 3000;

const usersDB = [];

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    let usersHtml = '';
    usersDB.forEach(function(u) {
        usersHtml += '<div>Пользователь: ' + u.username + '</div><br>';
    });

    res.send(`
        <h1>Регистрация (Уязвимая)</h1>
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
    usersDB.push({ username, email, password });
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});