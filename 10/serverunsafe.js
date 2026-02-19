const express = require('express');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const usersDB = [
    { id: 1, username: 'user', password: '123', isAdmin: false },
    { id: 2, username: 'admin', password: '123', isAdmin: true }
];

function createToken(user) {
    const data = JSON.stringify({ id: user.id, username: user.username, isAdmin: user.isAdmin });
    const hash = crypto.createHash('md5').update(data).digest('hex');
    return Buffer.from(data).toString('base64') + '.' + hash;
}

function verifyToken(token) {
    try {
        const [dataB64, hash] = token.split('.');
        const data = JSON.parse(Buffer.from(dataB64, 'base64').toString());
        const expectedHash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
        
        if (hash !== expectedHash) return null;
        return data;
    } catch (e) {
        return null;
    }
}

app.get('/', (req, res) => {
    const user = req.cookies.remember ? verifyToken(req.cookies.remember) : null;
    
    if (user) {
        res.send(`
            <h1>Привет, ${user.username}!</h1>
            <p>Admin: ${user.isAdmin ? 'YES' : 'NO'}</p>
            <a href="/logout">Выйти</a>
        `);
    } else {
        res.send(`
            <h1>Вход</h1>
            <form action="/login" method="POST">
                <input name="username" placeholder="Логин" required><br><br>
                <input name="password" type="password" placeholder="Пароль" required><br><br>
                <label><input type="checkbox" name="remember"> Запомнить меня</label><br><br>
                <button type="submit">Войти</button>
            </form>
        `);
    }
});

app.post('/login', (req, res) => {
    const { username, password, remember } = req.body;
    const user = usersDB.find(u => u.username === username && u.password === password);
    
    if (!user) return res.send('Неверный логин/пароль <a href="/">Назад</a>');
    
    if (remember === 'on') {
        const token = createToken(user);
        res.cookie('remember', token, { maxAge: 86400000 });
    }
    
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    res.clearCookie('remember');
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});