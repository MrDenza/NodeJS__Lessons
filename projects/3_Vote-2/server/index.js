// ----------------------- JavaScript -----------------------
const express = require('express');
const path = require('path');
const WEBSERVER = express();
const PORT = 3053;
const fs = require("fs");
const DB_VOTES_PATH = path.join(__dirname, 'db_votes.json');

WEBSERVER.use(express.json());
// Оправка ошибки: res.status(500).send();

function readJsonFileAsync(openFilePath, callback) {
	fs.readFile(openFilePath, 'utf8', (error, data) => {
		if (error) {
			console.error('[FILE] Ошибка при чтении файла:', error);
			callback(error, null);
		} else {
			try {
				const jsonData = JSON.parse(data);
				callback(null, jsonData);
			} catch (parseError) {
				console.error('[FILE] Ошибка при чтении файла:', error);
				callback(parseError, null);
			}
		}
	});
}

function writeJsonFileAsync(openFilePath, data, callback) {
	const jsonData = JSON.stringify(data, null, 2);
	fs.writeFile(openFilePath, jsonData, 'utf8', (error) => {
		if (error) {
			console.error('[FILE] Ошибка при записи файла:', error);
			callback(error);
		} else {
			console.log('[FILE] Данные успешно обновлены');
			callback(null);
		}
	});
}

function jsonToXml ({jsonData, rootTag = 'data', compactViewMode}) {
	const jsonObject = (typeof (jsonData) === 'string') ? JSON.parse(jsonData) : jsonData;
	return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>${compactViewMode ? '' : '\n'}${generateXml({obj: jsonObject, compactViewMode: compactViewMode})}</${rootTag}>`;
}

function generateXml ({obj, itemTag = 'elem', compactViewMode = false}) {
	let xml = '';
	let lineWrapping = compactViewMode ? '' : '\n';

	if (Array.isArray(obj)) {
		obj.forEach((item) => {
			if (typeof item === 'object') {
				xml += `<${itemTag}>${lineWrapping}${generateXml({obj: item, itemTag: itemTag, compactViewMode: compactViewMode})}</${itemTag}>${lineWrapping}`;
			} else {
				xml += `<${itemTag}>${item}</${itemTag}>${lineWrapping}`;
			}
		});
		return xml;
	}

	if (typeof obj === 'object' && obj !== null) {
		Object.keys(obj).forEach((key) => {
			const value = obj[key];
			if (typeof value === 'object' && value !== null || Array.isArray(value)) {
				xml += `<${key}>${lineWrapping}${generateXml({obj: value, itemTag: itemTag, compactViewMode: compactViewMode})}</${key}>${lineWrapping}`;
			}
			else {
				xml += `<${key}>${value}</${key}>${lineWrapping}`;
			}
		});
		return xml;
	}
	return obj;
}

function jsonToHtml(json) {
	let html = '<ul>';

	function generateList(data) {
		let items = '';
		for (const key in data) {
			items += `<li><strong>${key}:</strong> `;
			if (typeof data[key] === 'object' && data[key] !== null) {
				items += generateList(data[key]);
			} else {
				items += data[key];
			}
			items += '</li>';
		}
		return `<ul>${items}</ul>`;
	}

	html += generateList(json) + '</ul>';
	return html;
}

WEBSERVER.get('/', (req, res) => {
	console.log('[GET] Запрошен файл: ' + req.originalUrl);
	res.sendFile('index.html', { root: path.join((__dirname, '../client/public/')) });
});

WEBSERVER.get('/:path/:file', (req, res) => {
	if (req.originalUrl.includes('..')) res.status(400).send('Я у мамы хакер :3');
	console.log('[GET] Запрошен файл: ' + req.originalUrl);
	res.sendFile(req.params.file, { root: path.join((__dirname, `../client/public/${req.params.path}`)) });
});

WEBSERVER.get('/variants', (req, res) => {
	readJsonFileAsync(DB_VOTES_PATH, (error, data) => {
		if (error) {
			res.status(404).send(error);
		} else {
			let sendData = data.map((elem) => {
				return {id: elem.id, name: elem.name}
			});
			console.log(`[POST] Запрошены варианты ответов.`);
			res.send(sendData);
			//res.send('');
		}
	});
});

WEBSERVER.post('/stat', (req, res) => {
	readJsonFileAsync(DB_VOTES_PATH, (error, data) => {
		if (error) {
			res.status(404).send(error);
		} else {
			let sendData = data.map((elem) => {
				return {id: elem.id, votes: elem.votes}
			});
			console.log(`[POST] Запрошена статистика ответов.`);
			res.send(sendData);
			//res.send('');
		}
	});
});

WEBSERVER.post('/vote', (req, res) => {
	console.log('[POST] Голос за вариант: ' + req.body.idVote);
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
});

WEBSERVER.post('/download', (req, res) => {
	try {
		const format = req.accepts(['json', 'xml', 'html']);
		console.log(`[POST] Скачивание данных в формате: ${format}`);

		if (!format) {
			res.status(406).send('Формат не поддерживается. Используйте формат: json, xml или html.')
		}

		res.setHeader('Content-Disposition','attachment');
		readJsonFileAsync(DB_VOTES_PATH, (error, data) => {
			if (error) {
				res.status(404).send(error);
			} else {
				let filename = 'votes';
				let content;
				let contentType;

				switch (format) {
					case 'json':
						filename += '.json';
						contentType = 'application/json';
						content = data;
						break;
					case 'xml':
						filename += '.xml';
						contentType = 'application/xml';
						content = jsonToXml({jsonData: data});
						break;
					case 'html':
						filename += '.html';
						contentType = 'text/html';
						content = jsonToHtml(data);
						break;
				}
				res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
				res.setHeader('Content-Type', contentType);
				res.send(content);
			}
		});
	} catch (e) {
		console.error('Ошибка при скачивании:', e);
		res.status(500).send('Ошибка сервера при скачивании файла');
	}
});

WEBSERVER.use((req, res) => {
	res.status(404).send('Страница не найдена.');
});

WEBSERVER.listen(PORT, () => {
	console.log("[SERVER] WebServer running on port " + PORT);
});