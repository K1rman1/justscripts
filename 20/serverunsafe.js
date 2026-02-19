const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)`);
    db.run(`CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id TEXT, total REAL, items TEXT)`);
    
    db.run(`INSERT INTO products VALUES (1, 'Ноутбук', 50000)`);
    db.run(`INSERT INTO products VALUES (2, 'Мышь', 1000)`);
    db.run(`INSERT INTO products VALUES (3, 'Клавиатура', 3000)`);
});

app.get('/', (req, res) => {
    if (!req.session.userId) req.session.userId = 'user_' + Date.now();
    
    db.all(`SELECT * FROM products`, [], (err, products) => {
        let productsHtml = '';
        products.forEach(function(p) {
            productsHtml += `
                <div style="border:1px solid #ccc; padding:10px; margin:10px;">
                    <h3>${p.name}</h3>
                    <p>Цена: ${p.price} ₽</p>
                    <form action="/cart/add" method="POST">
                        <input type="hidden" name="product_id" value="${p.id}">
                        <input type="hidden" name="price" value="${p.price}">
                        <input type="number" name="quantity" value="1" min="1">
                        <button type="submit">В корзину</button>
                    </form>
                </div>
            `;
        });
        
        let cartHtml = '';
        let total = 0;
        if (req.session.cart) {
            req.session.cart.forEach(function(item) {
                cartHtml += `<li>${item.name} x${item.quantity} = ${item.price * item.quantity} ₽</li>`;
                total += item.price * item.quantity;
            });
        }
        
        res.send(`
            <h1>Интернет-магазин (Уязвимый)</h1>
            <h2>Товары:</h2>
            ${productsHtml}
            <h2>Корзина:</h2>
            <ul>${cartHtml || '<li>Пуста</li>'}</ul>
            <p><strong>Итого: ${total} ₽</strong></p>
            <form action="/checkout" method="POST">
                <button type="submit">Оформить заказ</button>
            </form>
        `);
    });
});

app.post('/cart/add', (req, res) => {
    if (!req.session.cart) req.session.cart = [];
    
    const { product_id, price, quantity } = req.body;
    
    db.get(`SELECT name FROM products WHERE id = ?`, [product_id], (err, product) => {
        req.session.cart.push({
            product_id,
            name: product ? product.name : 'Unknown',
            price: parseFloat(price),
            quantity: parseInt(quantity)
        });
        res.redirect('/');
    });
});

app.post('/checkout', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.send('Корзина пуста <a href="/">Назад</a>');
    }
    
    let total = 0;
    req.session.cart.forEach(function(item) {
        total += item.price * item.quantity; 
    });
    
    db.run(`INSERT INTO orders (user_id, total, items) VALUES (?, ?, ?)`,
        [req.session.userId, total, JSON.stringify(req.session.cart)],
        function(err) {
            req.session.cart = [];
            res.send(`
                <h1>Заказ оформлен!</h1>
                <p>Сумма: ${total} ₽</p>
                <p>Order ID: ${this.lastID}</p>
                <a href="/">Продолжить покупки</a>
            `);
        }
    );
});

app.listen(port, () => {
    console.log(`Уязвимый сервер: http://localhost:${port}`);
});