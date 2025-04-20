// ----------------------- JavaScript -----------------------
const express = require('express');
const WEBSERVER = express();
const PORT = 3053;


WEBSERVER.get('/', (req, res) => {
	console.log('[GET] Запрошен файл: ' + req.originalUrl);
	res.sendFile('index.html', { root: path.join((__dirname, '../client/public/')) });
});

// WEBSERVER.get('/:path/:file', (req, res) => {
// 	if (req.originalUrl.includes('..')) res.status(400).send('Я у мамы хакер :3');
// 	console.log('[GET] Запрошен файл: ' + req.originalUrl);
// 	res.sendFile(req.params.file, { root: path.join((__dirname, `../client/public/${req.params.path}`)) });
// });

WEBSERVER.post('/post', (req, res) => {
	console.log('[POST] Запроc');
	res.send('POST-Запрос');
});

WEBSERVER.use((req, res) => {
	res.status(404).send('Страница не найдена.');
});

WEBSERVER.listen(PORT, () => {
	console.log("[SERVER] WebServer running on port " + PORT);
});