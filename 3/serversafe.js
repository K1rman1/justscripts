const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE comments (id INTEGER PRIMARY KEY, author TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
});

app.use(express.urlencoded({ extended: true }));

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

app.get('/', (req, res) => {
    db.all(`SELECT * FROM comments ORDER BY id DESC`, [], (err, comments) => {
        if (err) {
            return res.status(500).send('Ошибка БД');
        }

        let commentsHtml = '';
        comments.forEach(function(c) {
            const safeAuthor = escapeHtml(c.author);
            const safeContent = escapeHtml(c.content);
            const safeDate = escapeHtml(c.created_at);
            
            commentsHtml += `
                <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                    <strong>${safeAuthor}</strong> <small>(${safeDate})</small><br>
                    ${safeContent}
                </div>
            `;
        });

        res.send(`
            <h1>Комментарии</h1>
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
    if (!author || author.length < 2) {
        return res.status(400).send('Имя слишком короткое <a href="/">Назад</a>');
    }
    
    if (!content || content.length < 1) {
        return res.status(400).send('Комментарий пустой <a href="/">Назад</a>');
    }
    
    if (content.length > 1000) {
        return res.status(400).send('Комментарий слишком длинный <a href="/">Назад</a>');
    }
    
    db.run(`INSERT INTO comments (author, content) VALUES (?, ?)`, [author, content], (err) => {
        if (err) {
            return res.status(500).send('Ошибка БД');
        }
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});