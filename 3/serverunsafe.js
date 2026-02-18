const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE comments (id INTEGER PRIMARY KEY, author TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
});

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    db.all(`SELECT * FROM comments ORDER BY id DESC`, [], (err, comments) => {
        if (err) {
            return res.status(500).send('Ошибка БД');
        }

        let commentsHtml = '';
        comments.forEach(function(c) {
            commentsHtml += `
                <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                    <strong>${c.author}</strong> <small>(${c.created_at})</small><br>
                    ${c.content}
                </div>
            `;
        });

        res.send(`
            <h1>Комментарии (уязвимые)</h1>
            <form action="/add" method="POST">
                <input name="author" placeholder="Ваше имя" required><br><br>
                <textarea name="content" placeholder="Комментарий" required></textarea><br><br>
                <button type="submit">Отправить</button>
            </form>
            <h2>Все комментарии:</h2>
            <div id="comments">${commentsHtml}</div>
        `);
    });
});

app.post('/add', (req, res) => {
    const { author, content } = req.body;
    db.run(`INSERT INTO comments (author, content) VALUES (?, ?)`, [author, content], (err) => {
        if (err) {
            return res.status(500).send('Ошибка БД');
        }
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});