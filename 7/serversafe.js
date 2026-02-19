const express = require('express');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

const usersDB = [];

app.get('/', (req, res) => {
    res.send(`
        <h1>Регистрация</h1>
        <form action="/register" method="POST">
            <input name="username" placeholder="Логин" required><br><br>
            <input name="password" type="password" placeholder="Пароль" required><br><br>
            <button type="submit">Зарегистрироваться</button>
        </form>
        <h2>Пользователи в БД:</h2>
        <pre>${JSON.stringify(usersDB, null, 2)}</pre>
    `);
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (password.length < 6) {
        return res.send('Пароль мин. 6 символов <a href="/">Назад</a>');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    usersDB.push({ 
        username, 
        password: hashedPassword
    });
    
    res.send(`
        <h1>Успешная регистрация!</h1>
        <p>Пароль захеширован и сохранён</p>
        <a href="/">Назад</a>
    `);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = usersDB.find(u => u.username === username);
    
    if (!user) {
        return res.send('Пользователь не найден');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
        res.send('Успешный вход!');
    } else {
        res.send('Неверный пароль');
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});