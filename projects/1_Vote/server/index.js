// ----------------------- JavaScript -----------------------
const express = require('express');
const path = require('path');
const webserver = express();
const port = 3051;
const fs = require("fs");
const DB_VOTES_PATH = path.join(__dirname, 'db_votes.json');

// const DB_VOTES = [
// 	{id: 1, name: 'NodeJs', votes: 1},
// 	{id: 2, name: 'Java', votes: 2},
// 	{id: 3, name: 'C++', votes: 3},
// 	{id: 4, name: 'Assembler', votes: 4},
// ];

webserver.use(express.json());
// Оправка ошибки: res.status(500).send();

function readJsonFileAsync(openFilePath, callback) {
	fs.readFile(openFilePath, 'utf8', (error, data) => {
		if (error) {
			console.error('Ошибка при чтении файла:', error);
			callback(error, null);
		} else {
			try {
				const jsonData = JSON.parse(data);
				callback(null, jsonData);
			} catch (parseError) {
				console.error('Ошибка при чтении файла:', error);
				callback(parseError, null);
			}
		}
	});
}

function writeJsonFileAsync(openFilePath, data, callback) {
	const jsonData = JSON.stringify(data, null, 2);
	fs.writeFile(openFilePath, jsonData, 'utf8', (error) => {
		if (error) {
			console.error('Ошибка при записи файла:', error);
			callback(error);
		} else {
			console.log('Данные успешно обновлены');
			callback(null);
		}
	});
}

webserver.get('/', (req, res) => {
	console.log('[GET] Запрошен файл: ' + req.originalUrl);
	res.sendFile('index.html', { root: path.join((__dirname, '../client/public/')) });
});

webserver.get('/:path/:file', (req, res) => {
	if (req.originalUrl.includes('..')) res.status(400).send('Я у мамы хакер :3');
	console.log('[GET] Запрошен файл: ' + req.originalUrl);
	res.sendFile(req.params.file, { root: path.join((__dirname, `../client/public/${req.params.path}`)) });
});

webserver.get('/variants', (req, res) => {
	// ДЛЯ РАБОТЫ С ВНЕШНИМ JSON ФАЙЛОМ
	readJsonFileAsync(DB_VOTES_PATH, (error, data) => {
		if (error) {
			res.status(404).send(error);
		} else {
			let sendData = data.map((elem) => {
				return {id: elem.id, name: elem.name}
			});
			console.log(`[POST] Запрошена статистика ответов.`);
			res.send(sendData);
		}
	});

	// ДЛЯ РАБОТЫ С ГЛОБАЛЬНОЙ ПЕРЕМЕННО
	// let data = DB_VOTES.map((elem) => {
	// 	return {id: elem.id, name: elem.name}
	// });
	// console.log(`[GET] Запрошены варианты ответов.`);
	// res.send(data);
});

webserver.post('/stat', (req, res) => {

	// ДЛЯ РАБОТЫ С ВНЕШНИМ JSON ФАЙЛОМ
	readJsonFileAsync(DB_VOTES_PATH, (error, data) => {
		if (error) {
			res.status(404).send(error);
		} else {
			let sendData = data.map((elem) => {
				return {id: elem.id, votes: elem.votes}
			});
			console.log(`[POST] Запрошена статистика ответов.`);
			res.send(sendData);
		}
	});

	// ДЛЯ РАБОТЫ С ГЛОБАЛЬНОЙ ПЕРЕМЕННО
	// let sendData = DB_VOTES.map((elem) => {
	// 	return {id: elem.id, votes: elem.votes}
	// });
	// console.log(`[POST] Запрошена статистика ответов.`);
	// res.send(sendData);
});


webserver.post('/vote', (req, res) => {
	readJsonFileAsync(DB_VOTES_PATH,(error, data) => {
		if (error) {
			res.status(404).send(error);
		} else {
			data[data.findIndex(elem => elem.id === req.body.idVote)].votes++
			writeJsonFileAsync(DB_VOTES_PATH, data, (error) => {
				if (error) res.status(403).send(error)
				else res.send()
			});
		}
	});

	// ДЛЯ РАБОТЫ С ГЛОБАЛЬНОЙ ПЕРЕМЕННО
	// const findPosObj = DB_VOTES[DB_VOTES.findIndex(elem => elem.id === req.body.idVote)].votes++;
	// console.log(`[POST] Записан вариант ответа для ID: ${req.body.idVote}.`);
	// res.send();
});

webserver.use((req, res) => {
	res.status(404).send('Страница не найдена.');
});

webserver.listen(port, () => {
	console.log("WebServer running on port " + port);
});