const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/api/content', (req, res) => {
    const content = {
        title: 'Добро пожаловать',
        body: 'Это контент из API...',
        malicious: "<img src=x onerror='alert(\"XSS! Cookies: \" + document.cookie)'>"
    };
    
    res.json({
        title: content.title,
        content: content.malicious  
    });
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});