const express = require('express');
const app = express();
const port = 3001;

app.use(express.urlencoded({ extended: true }));

function escapeAttr(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\//g, '&#x2F;');
}

function isValidUrl(url) {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

app.get('/', (req, res) => {
    const avatarUrl = req.query.avatar || '';
    const safeUrl = escapeAttr(avatarUrl);
    const safeDisplay = escapeAttr(avatarUrl);
    const showImage = isValidUrl(avatarUrl);
    
    res.send(`
        <h1>Предпросмотр аватара (Безопасный)</h1>
        <form action="/" method="GET">
            <input name="avatar" placeholder="URL аватара" value="${safeUrl}"><br><br>
            <button type="submit">Предпросмотр</button>
        </form>
        
        <h2>Результат:</h2>
        <div class="preview">
            ${showImage 
                ? `<img src="${safeUrl}" class="avatar" alt="Avatar">` 
                : '<p style="color:red">Неверный URL</p>'
            }
            <p>URL: ${safeDisplay}</p>
        </div>
    `);
});

app.listen(port, () => {
    console.log(`Безопасный сервер: http://localhost:${port}`);
});