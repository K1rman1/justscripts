const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`);
    db.run(`INSERT INTO users VALUES (1, 'Admin', 'admin@example.com')`);
    db.run(`INSERT INTO users VALUES (2, 'User', 'user@example.com')`);
});

app.use(express.json());

app.get('/user/:id', (req, res) => {
    const id = req.params.id;
    
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
        if (err) {
            return res.status(500).json({
                error: err.message,
                stack: err.stack,
                technology: {
                    node: process.version,
                    express: require('express/package.json').version,
                    sqlite3: require('sqlite3/package.json').version
                },
                query: `SELECT * FROM users WHERE id = ${id}`,
                path: __filename
            });
        }
        
        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден',
                details: `ID ${id} отсутствует в таблице users`,
                table: 'users',
                columns: ['id', 'name', 'email'],
                stack: new Error().stack
            });
        }
        
        res.json(user);
    });
});

app.use((err, req, res, next) => {
    res.status(500).json({
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});