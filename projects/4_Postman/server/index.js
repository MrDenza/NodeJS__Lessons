// ----------------------- JavaScript -----------------------
const express = require('express');
const WEBSERVER = express();
const PORT = 3054;
const path = require('path')
const fs = require("fs");
const os = require("os");
const DB_USERS_LIST_PATH = path.join(__dirname, 'db_users-list.json');
const LOG_FILE_PATH = path.join(__dirname, '_server.log');
//const validateAddMiddleware = require('./validateAddMiddleware'); //отключена и оставлена простая проверка req.body.add

WEBSERVER.use(express.static(path.join(__dirname, '../client/public/')));
WEBSERVER.use(express.json());

function validateAddMiddleware(req, res, next) {
	const data = req.body.add;
	if (data) {
		if (typeof data !== 'object' || typeof data.method !== 'string' || typeof data.url !== 'string' || typeof data.url !== 'string' || !Array.isArray(data.query) || typeof data.body !== 'string' || !Array.isArray(data.headers)) {
			return res.status(400).send();
		}
	}
	next();
}

WEBSERVER.post('/datalist', validateAddMiddleware, (req, res) => {
	readJsonFileAsync(DB_USERS_LIST_PATH, (error, data) => {
		if (error) {
			return res.status(404).send(error);
		}

		res.setHeader('Content-Type', 'application/json');
		const ID_USER = String(req.body.id);
		const newItem = req.body.add;

		if (ID_USER && (ID_USER in data)) {
			logLineSync(LOG_FILE_PATH,
				`[${req.ip}] [POST][/datalist] - Авторизация пользователя: ${ID_USER} ${newItem ? `+ добавление данных: ${JSON.stringify(newItem)}` : ''}`);
			if (newItem) {
				if (!Array.isArray(data[ID_USER])) {
					data[ID_USER] = [];
				}
				data[ID_USER].push(newItem);

				writeJsonFileAsync(DB_USERS_LIST_PATH, data, (writeErr) => {
					if (writeErr) {
						logLineSync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при записи данных: ${writeErr}`);
						return res.status(500).send({ error: 'Ошибка записи данных' });
					}
					res.json({ list: data[ID_USER] });
				});
			} else {
				res.json({ list: data[ID_USER] });
			}
		} else {
			const newId = generateUserId();
			logLineSync(LOG_FILE_PATH,
				`[${req.ip}] [POST][/datalist] - Регистрация нового пользователя: ${newId} ${newItem ? `+ добавление данных: ${JSON.stringify(newItem)}` : ''}`);
			const newList = newItem ? [newItem] : [];
			const newData = { ...data, [newId]: newList };

			writeJsonFileAsync(DB_USERS_LIST_PATH, newData, (writeErr) => {
				if (writeErr) {
					return res.status(403).send(writeErr);
				}
				res.json({ id: newId, list: newList });
			});
		}
	});
});

WEBSERVER.post('/send', (req, res) => {
	console.log('[POST] Запроc /send');
	res.send('send');
});

WEBSERVER.use((req, res) => {
	logLineSync(LOG_FILE_PATH, `[${req.ip}]-[ERROR] - Обращение к ${req.originalUrl}`);
	res.status(404).send('Страница не найдена.');
});

WEBSERVER.listen(PORT, () => {
	logLineSync(LOG_FILE_PATH, `[SERVER-INFO] - WebServer запущен на порте: ${PORT}`);
});

function readJsonFileAsync(openFilePath, callback) {
	fs.readFile(openFilePath, 'utf8', (error, data) => {
		if (error) {
			logLineSync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при чтении файла: ${error}`);
			callback(error, null);
		} else {
			try {
				const jsonData = JSON.parse(data);
				callback(null, jsonData);
			} catch (parseError) {
				logLineSync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при чтении файла: ${error}`);
				callback(parseError, null);
			}
		}
	});
}

function writeJsonFileAsync(openFilePath, data, callback) {
	const jsonData = JSON.stringify(data, null, 2);
	fs.writeFile(openFilePath, jsonData, 'utf8', (error) => {
		if (error) {
			logLineSync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при записи файла: ${error}`);
			callback(error);
		} else {
			logLineSync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][SUCCESS] - Данные успешно обновлены!`);
			callback(null);
		}
	});
}

function generateUserId() {
	return 'user_' + (Date.now() + Math.floor(Math.random() * 10000)).toString(36);
}

function logLineSync(logFilePath, logLine) {
	const logDT = new Date();
	let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
	let fullLogLine = time + " " + logLine;

	console.log(fullLogLine);

	const logFd = fs.openSync(logFilePath, "a+");
	fs.writeSync(logFd, fullLogLine + os.EOL);
	fs.closeSync(logFd);
}










// const express = require('express');
// const fetch = require('node-fetch');
// const app = express();
//
// app.use(express.json());
//
// app.post('/proxy', async (req, res) => {
// 	try {
// 		const { url, method, headers, body } = req.body;
//
// 		if (!url) return res.status(400).json({ error: 'URL is required' });
//
// 		const response = await fetch(url, {
// 			method: method || 'GET',
// 			headers,
// 			body: ['GET', 'HEAD'].includes(method) ? undefined : body,
// 		});
//
// 		const contentType = response.headers.get('content-type') || '';
//
// 		const responseBody = contentType.includes('application/json')
// 			? await response.json()
// 			: await response.text();
//
// 		res.status(response.status).json({
// 			status: response.status,
// 			headers: Object.fromEntries(response.headers.entries()),
// 			body: responseBody,
// 			contentType,
// 		});
// 	} catch (error) {
// 		res.status(500).json({ error: error.message });
// 	}
// });
//
// app.listen(3000, () => console.log('Proxy server running on port 3000'));