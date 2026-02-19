const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )
    `);
    
    db.run(`
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product TEXT NOT NULL,
            amount INTEGER NOT NULL CHECK(amount > 0),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    db.run(`INSERT INTO users (name, email) VALUES ('Иван', 'ivan@example.com')`);
    db.run(`INSERT INTO users (name, email) VALUES ('Мария', 'maria@example.com')`);
    db.run(`INSERT INTO orders (user_id, product, amount) VALUES (1, 'Ноутбук', 50000)`);
    db.run(`INSERT INTO orders (user_id, product, amount) VALUES (1, 'Мышь', 1000)`);
    db.run(`INSERT INTO orders (user_id, product, amount) VALUES (2, 'Клавиатура', 3000)`);
});

app.get('/api/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name и email обязательны' });
    
    db.run(`INSERT INTO users (name, email) VALUES (?, ?)`, [name, email], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name, email });
    });
});

app.get('/api/users/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        
        db.all(`SELECT * FROM orders WHERE user_id = ?`, [id], (err, orders) => {
            res.json({ ...user, orders });
        });
    });
});

app.get('/api/orders', (req, res) => {
    db.all(`SELECT * FROM orders`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { user_id, product, amount } = req.body;
    if (!user_id || !product || !amount) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    db.run(`INSERT INTO orders (user_id, product, amount) VALUES (?, ?, ?)`, 
        [user_id, product, amount], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ id: this.lastID, user_id, product, amount });
    });
});

app.delete('/api/orders/:id', (req, res) => {
    db.run(`DELETE FROM orders WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.json({ success: true });
    });
});
app.delete('/api/users/:id', (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
});