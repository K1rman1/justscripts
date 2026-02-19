const express = require('express');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const avatarUrl = req.query.avatar || '';
    
    res.send(`
        <h1>Предпросмотр аватара (Уязвимый)</h1>
        <form action="/" method="GET">
            <input name="avatar" placeholder="URL аватара" value="${avatarUrl}"><br><br>
            <button type="submit">Предпросмотр</button>
        </form>
        
        <h2>Результат:</h2>
        <div class="preview">
            <img src="${avatarUrl}" class="avatar" alt="Avatar">
            <p>URL: ${avatarUrl}</p>
        </div>
    `);
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});

//https://lh4.googleusercontent.com/proxy/eCAiD9Zdx9qG2wb4Fwu14A9t3IIU820nFLTWLqTNz-5Lg_WzParveWhx52D19qNe_ORrGQpLXZoJVv1iSjC7h8wLT_E-o7WDJsKW" onload="alert('XSS')"