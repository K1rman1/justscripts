const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, password TEXT)`);
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, ['admin@example.com', 'securepassword123']);
});

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
        <h1>Вход (уязвимый)</h1>
        <form action="/login" method="POST">
            <input name="email" placeholder="Email"><br><br>
            <input name="password" type="password" placeholder="Пароль"><br><br>
            <button type="submit">Войти</button>
        </form>
        <p style="color:red">${req.query.error || ''}</p>
    `);
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    
    console.log("Выполняемый SQL:", query);

    db.get(query, [], (err, user) => {
        if (err) {
            return res.redirect('/?error=Ошибка базы данных');
        }

        if (user) {
            res.send(`<h1>Успех! Вы вошли как: ${user.email}</h1><a href="/">Назад</a>`);
        } else {
            res.redirect('/?error=Неверный логин или пароль');
        }
    });
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});