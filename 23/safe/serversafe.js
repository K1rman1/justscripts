const express = require('express');
const app = express();
const port = 3001;

app.use(express.static('public'));

app.get('/api/content', (req, res) => {
    const content = {
        title: 'Добро пожаловать',
        body: 'Это контент из API...',
        malicious: "<img src=x onerror='alert(\"XSS\")'>"
    };
    
    res.json({
        title: content.title,
        content: content.malicious
    });
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});