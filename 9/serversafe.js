const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`);
    db.run(`INSERT INTO users VALUES (1, 'Admin', 'admin@example.com')`);
    db.run(`INSERT INTO users VALUES (2, 'User', 'user@example.com')`);
    db.run(`INSERT INTO users VALUES (3, 'Guest', 'guest@example.com')`);
});

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
        <h1>Поиск пользователя по ID</h1>
        <form action="/search" method="POST">
            <input name="id" placeholder="Введите ID" required>
            <button type="submit">Найти</button>
        </form>
        <p><a href="/users">Показать всех</a></p>
    `);
});

app.post('/search', (req, res) => {
    const inputId = req.body.id;
    if (!/^\d+$/.test(inputId)) {
        return res.send(`Ошибка: ID должен быть числом <a href="/">Назад</a>`);
    }
    const query = `SELECT * FROM users WHERE id = ?`;
    console.log('SQL:', query, 'Params:', [inputId]);
    
    db.all(query, [inputId], (err, rows) => {
        if (err) return res.send(`Ошибка: ${err.message}`);
        
        let html = `<h2>Результат:</h2>`;
        if (rows.length === 0) {
            html += `<p>Пользователь не найден</p>`;
        } else {
            rows.forEach(row => {
                html += `<p>ID: ${row.id}, Name: ${row.name}, Email: ${row.email}</p>`;
            });
        }
        html += `<a href="/">Назад</a>`;
        res.send(html);
    });
});

app.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) return res.send(`Ошибка: ${err.message}`);
        let html = `<h2>Все пользователи:</h2>`;
        rows.forEach(row => {
            html += `<p>ID: ${row.id}, Name: ${row.name}, Email: ${row.email}</p>`;
        });
        html += `<a href="/">Назад</a>`;
        res.send(html);
    });
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});