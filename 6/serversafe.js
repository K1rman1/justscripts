const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ 
    secret: 'secret-key-change-in-production', 
    resave: false, 
    saveUninitialized: true,
    cookie: { httpOnly: true }
}));
let users = [{ id: 1, name: 'Admin', email: 'admin@example.com' }];
let nextId = 2;

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}
function csrfCheck(req, res, next) {
    if (req.method === 'POST' || req.method === 'DELETE') {
        if (req.body._csrf !== req.session.csrfToken) {
            return res.status(403).json({ error: 'CSRF token invalid' });
        }
    }
    next();
}

app.use(function(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateToken();
    }
    next();
});

app.get('/', function(req, res) {
    const csrfToken = req.session.csrfToken;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Users API</title>
        </head>
        <body>
            <div class="section">
                <h2>Добавить пользователя</h2>
                <form id="addForm">
                    <input type="hidden" id="csrfToken" value="${csrfToken}">
                    <input id="nameInput" placeholder="Имя" required><br>
                    <input id="emailInput" placeholder="Email" required><br>
                    <button type="submit">Добавить</button>
                </form>
                <div id="addMessage"></div>
            </div>
            
            <h2>Список пользователей</h2>
            <button onclick="loadUsers()">Обновить</button>
            <table id="usersTable">
                <tr><th>ID</th><th>Имя</th><th>Email</th><th>Действие</th></tr>
            </table>
            
            <script>
                async function loadUsers() {
                    try {
                        const res = await fetch('/api/users');
                        const users = await res.json();
                        const table = document.getElementById('usersTable');
                        table.innerHTML = '<tr><th>ID</th><th>Имя</th><th>Email</th><th>Действие</th></tr>';
                        
                        users.forEach(function(u) {
                            const row = document.createElement('tr');
                            row.innerHTML = 
                                '<td>' + u.id + '</td>' +
                                '<td>' + escapeHtml(u.name) + '</td>' +
                                '<td>' + escapeHtml(u.email) + '</td>' +
                                '<td><button class="delete" onclick="deleteUser(' + u.id + ')">Удалить</button></td>';
                            table.appendChild(row);
                        });
                    } catch (err) {
                        console.error('Ошибка загрузки:', err);
                    }
                }
                
                document.getElementById('addForm').onsubmit = async function(e) {
                    e.preventDefault();
                    
                    const csrf = document.getElementById('csrfToken').value;
                    const name = document.getElementById('nameInput').value;
                    const email = document.getElementById('emailInput').value;
                    const msgDiv = document.getElementById('addMessage');
                    
                    try {
                        const res = await fetch('/api/users', { 
                            method: 'POST', 
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                _csrf: csrf,
                                name: name,
                                email: email 
                            }) 
                        });
                        
                        const data = await res.json();
                        
                        if (res.ok) {
                            msgDiv.innerHTML = '<div class="message success">Пользователь добавлен</div>';
                            document.getElementById('nameInput').value = '';
                            document.getElementById('emailInput').value = '';
                            loadUsers();
                        } else {
                            msgDiv.innerHTML = '<div class="message error">' + (data.error || 'Ошибка') + '</div>';
                        }
                    } catch (err) {
                        msgDiv.innerHTML = '<div class="message error">Ошибка: ' + err.message + '</div>';
                    }
                };
                
                async function deleteUser(id) {
                    if (!confirm('Удалить пользователя с ID ' + id + '?')) {
                        return;
                    }
                    
                    const csrf = document.getElementById('csrfToken').value;
                    
                    try {
                        const res = await fetch('/api/users/' + id, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ _csrf: csrf })
                        });
                        
                        if (res.ok) {
                            loadUsers();
                        } else {
                            alert('Ошибка при удалении');
                        }
                    } catch (err) {
                        alert('Ошибка: ' + err.message);
                    }
                }
                
                function escapeHtml(text) {
                    if (!text) return '';
                    return String(text)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                }
                
                loadUsers();
            </script>
        </body>
        </html>
    `);
});

app.get('/api/users', function(req, res) {
    res.json(users);
});

app.post('/api/users', csrfCheck, function(req, res) {
    const { name, email } = req.body;
    if (!name || name.length < 2) {
        return res.status(400).json({ error: 'Имя мин. 2 символа' });
    }
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Некорректный email' });
    }
    
    const user = { id: nextId++, name: name, email: email };
    users.push(user);
    res.status(201).json(user);
});

app.delete('/api/users/:id', csrfCheck, function(req, res) {
    const id = parseInt(req.params.id);
    users = users.filter(function(u) { return u.id !== id; });
    res.json({ success: true });
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
});

app.listen(port, function() {
    console.log(`Сервер запущен: http://localhost:${port}`);
});