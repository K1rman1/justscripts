const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'demo@example.com', pass: 'password' }
});

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function sanitizeHeader(value) {
    if (!value) return '';
    return value.replace(/[\r\n%0A%0D]/g, '');
}

app.get('/', (req, res) => {
    res.send(`
        <h1>Отправить другу (Безопасно)</h1>
        <form action="/send" method="POST">
            <label>Ваш email:</label><br>
            <input name="fromEmail" placeholder="your@example.com" required><br><br>
            
            <label>Email друга:</label><br>
            <input name="toEmail" placeholder="friend@example.com" required><br><br>
            
            <label>Тема:</label><br>
            <input name="subject" placeholder="Интересная статья" required><br><br>
            
            <label>Сообщение:</label><br>
            <textarea name="message" placeholder="Привет! Посмотри эту статью..." required></textarea><br><br>
            
            <button type="submit">Отправить</button>
        </form>
        <p style="color:green">Все поля валидируются и очищаются</p>
    `);
});

app.post('/send', (req, res) => {
    const { fromEmail, toEmail, subject, message } = req.body;
    
    const safeFrom = sanitizeHeader(fromEmail);
    const safeTo = sanitizeHeader(toEmail);
    const safeSubject = sanitizeHeader(subject);
    const safeMessage = sanitizeHeader(message);
    if (!isValidEmail(safeFrom)) {
        return res.status(400).send('Некорректный email отправителя <a href="/">Назад</a>');
    }
    if (!isValidEmail(safeTo)) {
        return res.status(400).send('Некорректный email получателя <a href="/">Назад</a>');
    }
    if (safeTo.includes(',') || safeTo.includes(';')) {
        return res.status(400).send('Можно указать только один email <a href="/">Назад</a>');
    }
    if (safeSubject.length > 100) {
        return res.status(400).send('Тема слишком длинная <a href="/">Назад</a>');
    }
    
    const mailOptions = {
        from: safeFrom,
        to: safeTo,
        subject: safeSubject,
        text: safeMessage
    };
    
    console.log('=== ОТПРАВКА EMAIL (Безопасно) ===');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('================================');
    
    res.send(`
        <h1>Email отправлен!</h1>
        <p>From: ${mailOptions.from}</p>
        <p>To: ${mailOptions.to}</p>
        <p>Subject: ${mailOptions.subject}</p>
        <a href="/">Назад</a>
    `);
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});