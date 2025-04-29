// ----------------------- JavaScript -----------------------
const express = require("express");
const WEBSERVER = express();
const PORT = 3054;
//const cookieParser = require('cookie-parser');
const path = require("path");
const fs = require("fs");
const os = require("os");
const DB_USERS_LIST_PATH = path.join(__dirname, "db_users-list.json");
const LOG_FILE_PATH = path.join(__dirname, "_server.log");
//const validateAddMiddleware = require('./validateAddMiddleware'); //отключена и оставлена простая проверка req.body.add

WEBSERVER.use(express.static(path.join(__dirname, "../client/public/")));
WEBSERVER.use(express.json());
//WEBSERVER.use(cookieParser());

function validateAddMiddleware(req, res, next) {
    const data = req.body.add || req.body.send;
    if (data) {
        if (
            typeof data !== "object" ||
            typeof data.method !== "string" ||
            typeof data.url !== "string" ||
            !Array.isArray(data.query) ||
            typeof data.body !== "string" ||
            !Array.isArray(data.headers)
        ) {
            return res.status(400).send();
        }
    }
    next();
}

WEBSERVER.post("/datalist", validateAddMiddleware, (req, res) => {
    readJsonFileAsync(DB_USERS_LIST_PATH, (error, data) => {
        if (error) {
            return res.status(404).json({ error: `Ошибка: ${error}` });
        }

        res.setHeader("Content-Type", "application/json");
        const ID_USER = String(req.body.id);
        const newItem = req.body.add;

        if (ID_USER && ID_USER in data) {
            logLineAsync(
                LOG_FILE_PATH,
                `[${req.ip}] [POST][/datalist] - Авторизация пользователя: ${ID_USER} ${newItem ? `+ добавление данных: ${JSON.stringify(newItem)}` : ""}`
            );
            if (newItem) {
                if (!Array.isArray(data[ID_USER])) {
                    data[ID_USER] = [];
                }
                data[ID_USER].push(newItem);

                writeJsonFileAsync(DB_USERS_LIST_PATH, data, (writeErr) => {
                    if (writeErr) {
                        logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при записи данных: ${writeErr}`);
                        return res.status(500).json({ error: "Ошибка записи данных" });
                    }
                    res.json({ list: data[ID_USER] });
                });
            } else {
                res.json({ list: data[ID_USER] });
            }
        } else {
            const newId = generateUserId();
            logLineAsync(
                LOG_FILE_PATH,
                `[${req.ip}] [POST][/datalist] - Регистрация нового пользователя: ${newId} ${newItem ? `+ добавление данных: ${JSON.stringify(newItem)}` : ""}`
            );
            const newList = newItem ? [newItem] : [];
            const newData = { ...data, [newId]: newList };

            writeJsonFileAsync(DB_USERS_LIST_PATH, newData, (writeErr) => {
                if (writeErr) {
					logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при записи данных: ${writeErr}`);
                    return res.status(403).json({ error: writeErr });
                }
                res.json({ id: newId, list: newList });
            });
        }
    });
});

WEBSERVER.post("/send", validateAddMiddleware, async (req, res) => {
    try {
		if (!req.body.send) return res.status(400).send();
        const { method, url, query, body, headers } = req.body.send;
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}] [POST][/send] - Запрос: ${JSON.stringify(req.body.send)}`);
        if (!url) return res.status(400).send();

        // Формируем URL с query-параметрами
        let fullUrl = "";
        try {
            const urlObj = new URL(url);
            if (Array.isArray(query) && query.length > 0) {
                query.forEach((obj) => {
                    const [key, value] = Object.entries(obj)[0];
                    urlObj.searchParams.append(key, value);
                });
            }
            fullUrl = urlObj.toString();
        } catch (e) {
            return res.status(400).send();
        }

        // Формируем объект заголовков
        const fetchHeaders = {};
        if (Array.isArray(headers)) {
            headers.forEach((obj) => {
                const [key, value] = Object.entries(obj)[0];
                fetchHeaders[key] = value;
            });
        }
        // Определяем тело запроса
        let fetchBody = body;
        if (fetchHeaders["Content-Type"] && fetchHeaders["Content-Type"].includes("application/json")) {
            try {
                fetchBody = JSON.stringify(JSON.parse(body)); // Проверка и сериализация JSON
            } catch {
                return res.status(400).send();
            }
        }

		if (method && method.toUpperCase() === "GET") {
			fetchBody = undefined;
		}
        // Fetch запрос
        const result = await fetchWithRedirects(fullUrl, {
            method,
            headers: fetchHeaders,
            body: fetchBody,
        });

        await logLineAsync(LOG_FILE_PATH, `[${req.ip}] [POST][/send] - Запрос успешно выполнен по url: ${String(url)}`);
        res.status(200).json({ dataRes: result });
        // res.redirect(result.status, result.finalUrl); // реальный редирект клиенту
    } catch (error) {
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[FETCH][ERROR] - Ошибка при проксировании запроса: ${error}`);
        if (!res.headersSent) {
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[FETCH][ERROR] - Ошибка сервера при отправке запроса.`);
            res.status(500).send("Ошибка сервера при отправке запроса!");
        } else {
            res.end();
        }
    }
});

WEBSERVER.use((req, res) => {
    logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[ERROR] - Обращение к ${req.originalUrl}`);
    res.status(404).send("Страница не найдена.");
});

WEBSERVER.listen(PORT, () => {
    logLineAsync(LOG_FILE_PATH, `[SERVER-INFO] - WebServer запущен на порте: ${PORT}`);
});

function readJsonFileAsync(openFilePath, callback) {
    fs.readFile(openFilePath, "utf8", (error, data) => {
        if (error) {
            logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при чтении файла: ${error}`);
            callback(error, null);
        } else {
            try {
                const jsonData = JSON.parse(data);
                callback(null, jsonData);
            } catch (parseError) {
                logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при чтении файла: ${parseError}`);
                callback(parseError, null);
            }
        }
    });
}

function writeJsonFileAsync(openFilePath, data, callback) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFile(openFilePath, jsonData, "utf8", (error) => {
        if (error) {
            logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][ERROR] - Ошибка при записи файла: ${error}`);
            callback(error);
        } else {
            logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FILE][SUCCESS] - Данные успешно обновлены!`);
            callback(null);
        }
    });
}

function generateUserId() {
    return "user_" + (Date.now() + Math.floor(Math.random() * 10000)).toString(36);
}

function logLineAsync(logFilePath, logLine) {
    return new Promise((resolve, reject) => {
        const logDT = new Date();
        let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
        let fullLogLine = time + " " + logLine;
        console.log(fullLogLine);

        fs.open(logFilePath, "a+", (err, logFd) => {
            if (err) reject(err);
            else
                fs.write(logFd, fullLogLine + os.EOL, (err) => {
                    if (err) {
						fs.close(logFd, () => reject(err));
                        // ещё хорошо бы закрыть файл logFd!
                    } else
                        fs.close(logFd, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                });
        });
    });
}

async function fetchWithRedirects(url, options = {}, maxRedirects = 5) {
    const redirects = [];
    let currentUrl = url;
    let response;

    for (let i = 0; i <= maxRedirects; i++) {
		try {
			response = await fetch(currentUrl, {
				...options,
				redirect: 'manual',
			});
		} catch (error) {
			await logLineAsync(LOG_FILE_PATH, `[SERVER-INFO]-[FETCH][ERROR] - Ошибка fetch: ${error}`);
			throw error;
		}

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) break;
            redirects.push({
                status: response.status,
                startUrl: currentUrl,
                location,
            });
            currentUrl = new URL(location, currentUrl).toString();
        } else {
            break;
        }
    }

	if (!response) {
		throw new Error('Не удалось получить ответ от сервера');
	}

    const contentType = response.headers.get("content-type") || "";
    let bodyContent;
    if (contentType.includes("application/json")) {
        // json
        bodyContent = await response.json();
    } else if (contentType.startsWith("text/")) {
        // text/html
        bodyContent = await response.text();
    } else {
        //application/octet-stream, application/pdf, image/, audio/, video/
        const arrayBuffer = await response.arrayBuffer();
        bodyContent = Buffer.from(arrayBuffer).toString("base64"); // base64 для бинарных данных
    }

    return {
        finalUrl: currentUrl,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: bodyContent,
        redirects,
    };
}

// Заметки - полезный код:
// --- Перенаправляем все запросы с сервера клиенту ---
// const { pipeline } = require('node:stream/promises');
// const { Readable } = require('stream');
// Копируем статус
//res.status(proxy_response.status);
// Копируем заголовки
// proxy_response.headers.forEach((value, name) => {
//     if (["transfer-encoding", "content-length", 'content-encoding'].includes(name.toLowerCase())) return;
//     res.setHeader(name, value);
// });
// Вариант 1 -
// Конвертация из Web-ReadableStream в Node.js-ReadableStream
// function webStreamToNodeStream(webStream) {
//     const reader = webStream.getReader();
//     return new Readable({
//         async read() {
//             const { done, value } = await reader.read();
//             if (done) {
//                 this.push(null);
//             } else {
//                 this.push(value);
//             }
//         },
//     });
// }
// const nodeReadable = webStreamToNodeStream(proxy_response.body);
// Вариант 2 -
// Конвертация из Web-ReadableStream в Node.js-ReadableStream
//const nodeReadable = Readable.fromWeb(proxy_response.body);
// Слушатели
// nodeReadable.on("data", (chunk) => {
// 	console.log('send');
// });
// nodeReadable.on("end", () => {
// 	console.log("Stream ended");
// });
//
// Перенаправляем поток клиенту
//await pipeline(nodeReadable, res);

// --- Получаем ответ и формируем клиенту JSON ответ ---
// Отправляем запрос
// const proxy_response = await fetch(fullUrl, {
// 	method: method || 'GET',
// 	headers,
// 	body: fetchBody,
// 	redirect: 'manual',
// });
// Копируем статус и заголовки для ответа
// const status = proxy_response.status;
// const headersObj = {};
// proxy_response.headers.forEach((value, name) => {
// 	headersObj[name] = value;
// });
// Обрабатываем тело ответа
// const contentType = proxy_response.headers.get('content-type') || '';
// let bodyContent;
// if (contentType.includes('application/json')) {
// 	bodyContent = await proxy_response.json();
// } else if (contentType.startsWith('text/')) {
// 	bodyContent = await proxy_response.text();
// } else if (
// 	contentType.includes('application/octet-stream') ||
// 	contentType.includes('application/pdf') ||
// 	contentType.includes('image/') ||
// 	contentType.includes('audio/') ||
// 	contentType.includes('video/')
// ) {
// Для бинарных данных читаем как буфер и конвертируем в base64 для безопасной передачи в JSON
// 	const arrayBuffer = await proxy_response.arrayBuffer();
// 	const buffer = Buffer.from(arrayBuffer);
// 	bodyContent = buffer.toString('base64');
// } else {
// 	bodyContent = await proxy_response.text();
// }
// Обработка редиректа - если был
// const redirect = proxy_response.redirected;
// const urlRedirect = redirect ? proxy_response.url: undefined;
// Формируем объект для клиента
// const responseData = {
// 	status,
// 	headers: headersObj,
// 	body: bodyContent,
// 	redirect: redirect,
// 	urlRedirect: urlRedirect,
// };
// Отправляем JSON клиенту
// res.status(200);
// res.setHeader('Content-Type', 'application/json');
// res.end(JSON.stringify(responseData));
