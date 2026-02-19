const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database_secure.sqlite',
    logging: false
});

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [2, 50], notEmpty: true }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [8, 100], notEmpty: true }
    }
}, {
    timestamps: true,
    defaultScope: { attributes: { exclude: ['password'] } }
});

User.beforeCreate(async (user) => {
    if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});
(async () => {
    await sequelize.sync({ force: true });
    console.log('БД инициализирована');
})();
function validateUserInput(data) {
    const errors = [];
    if (!data.name || data.name.length < 2 || data.name.length > 50) {
        errors.push('Имя должно быть от 2 до 50 символов');
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Некорректный email');
    }
    if (!data.password || data.password.length < 8) {
        errors.push('Пароль должен быть минимум 8 символов');
    }
    return errors;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/users', async (req, res) => {
    const { name, email, password } = req.body;
    const errors = validateUserInput({ name, email, password });
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    try {
        const user = await User.create({ name, email, password });
        res.status(201).json({ message: 'Пользователь создан', user: user.toJSON() });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
        }
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user.toJSON());
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    try {
        const user = await User.scope(null).findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        res.json({ message: 'Успешный вход', user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});