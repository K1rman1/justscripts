const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`);
    db.run(`INSERT INTO users VALUES (1, 'Admin', 'admin@example.com')`);
    db.run(`INSERT INTO users VALUES (2, 'User', 'user@example.com')`);
});

app.use(express.json());
function logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, {
        message: error.message,
        stack: error.stack,
        ...context
    });
}

app.get('/user/:id', (req, res) => {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) {
        logError(new Error('Invalid ID format'), { id, ip: req.ip });
        return res.status(400).json({ 
            error: 'Некорректный запрос',
            code: 'INVALID_INPUT'
        });
    }
    
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
        if (err) {
            logError(err, { id, query: 'SELECT * FROM users WHERE id = ?' });
            return res.status(500).json({ 
                error: 'Внутренняя ошибка сервера',
                code: 'SERVER_ERROR',
                requestId: Date.now()
            });
        }
        
        if (!user) {
            logError(new Error('User not found'), { id });
            return res.status(404).json({ 
                error: 'Ресурс не найден',
                code: 'NOT_FOUND'
            });
        }
        
        res.json(user);
    });
});

app.use((err, req, res, next) => {
    logError(err, { path: req.path, method: req.method, ip: req.ip });
    
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        code: 'SERVER_ERROR',
        requestId: Date.now()
    });
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ресурс не найден',
        code: 'NOT_FOUND'
    });
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});