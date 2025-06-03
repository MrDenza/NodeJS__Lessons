// --------------------------- Express ---------------------------
const express = require("express");
const app = express();
// ------------------------- HTTP Server -------------------------
const http = require('http');
const PORT = 3058;
const WEBSERVER = http.createServer(app);
// -------------------------- WebSocket --------------------------
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: WEBSERVER });
const wsClients = new Map();
// --------------------------- Modules ---------------------------
const path = require("path");
const fsAsync = require("fs").promises;
const fs = require("fs");
const os = require("os");
// ------------------------- Global Const ------------------------
const STATIC_FILES_PATH = path.join(__dirname, "../client/public/");
const LOG_FILE_PATH = path.join(__dirname, "_server.log");
const UPLOAD_FILES_PATH = path.join(__dirname, "./uploads");
const USER_LIST_PATH = path.join(UPLOAD_FILES_PATH, 'users_list');
const USERS_FILE_PATH = path.join(__dirname, "users.json");
// ------------------------- HTTP Server ------------------------
WEBSERVER.listen(PORT, async () => {
    await logLineAsync(LOG_FILE_PATH, `[SERVER-INFO] - WebServer запущен на порте: ${PORT}`);
});
// ------------------------- Body Express ------------------------
app.use(express.static(STATIC_FILES_PATH));
app.use(express.json());

async function checkUidMiddleware(req, res, next) {
    try {
        let uid;

        uid = req.headers['x-user-uid'];
        if (Array.isArray(uid)) uid = uid[0];
        if (typeof uid !== 'string' || !uid) uid = null;

        let users = await readJsonFile(USERS_FILE_PATH, {});

        if (uid && users[uid]) {
            req.uid = uid;
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[CONNECT][${req.path}][USER] - Авторизация пользователя: ${uid}`);
        } else {
            const newUid = generateUserId();
            users[newUid] = { createdAt: new Date().toISOString() };
            await writeUsers(users);
            req.uid = newUid;
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[CONNECT][${req.path}][NEW-USER] - Регистрация нового пользователя: ${newUid} ${ uid ? `/ Получен x-user-uid: ${uid}` : '' }`);
        }

        next();
    } catch (err) {
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[CHECK-UID][${req.path}][ERROR] - ${err}`);
        res.status(500).send({ status: 'error', error: 'Internal server error' });
    }
}

function wsUrlMiddleware (req, res, next) {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const protocol = isSecure ? 'wss' : 'ws';
    const host = req.headers.host; //test.com:port
    req.wsUrl = `${protocol}://${host}/uploadprogress`;
    next();
}

app.post('/session-info', checkUidMiddleware, wsUrlMiddleware, async (req, res) => {
    try {
        const uid = req.uid;
        const userListFile = path.join(USER_LIST_PATH, `${uid}.json`);
        let info = await readJsonFile(userListFile, []);
        if (!Array.isArray(info)) info = [];

        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}][${req.path}] - Пользователь: ${uid} / wsUrl: ${req.wsUrl} / Список файлов: ${info && '---'}`);
        res.send({ status: 'success', uid, wsUrl: req.wsUrl, files: info });
    }
    catch (e) {
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}]][${req.path}][ERROR] - ${e}`);
        res.status(500).json({status: "error", error: e});
    }
});

app.post('/upload',checkUidMiddleware, async (req, res) => {
    try {
        const uid = req.uid;

        const comment = getDecodedHeader(req.headers, 'x-file-comment');

        const dataLength = parseInt(req.headers['content-length'], 10);

        if (isNaN(dataLength)) {
            console.warn('Не удалось получить content-length');
        }

        let fileName = getDecodedHeader(req.headers, 'x-file-name', `file_${Date.now()}`);
        if (fileName.includes('..') || path.isAbsolute(fileName)) {
            return res.status(400).json({status: "error", error: 'Недопустимое имя файла!'});
        }
        const userDir = path.join(UPLOAD_FILES_PATH, uid);
        await fsAsync.mkdir(userDir, { recursive: true });
        fileName = await getUniqueFileName(userDir, fileName);
        const filePath = path.join(userDir, fileName);

        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}][${req.path}] - Загрузка файла: ${fileName} / Размер: ${dataLength} / Комментарий: ${comment}`);

        const writeStream = fs.createWriteStream(filePath);

        writeStream.on('error', async (err) => {
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}][${req.path}][ERROR] - Ошибка записи файла: ${err}`);
        });

        req.on('error',  async (err) => {
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}][${req.path}][ERROR] - Ошибка при загрузке файла: ${err}`);
        })

        let receivedBytes = 0;
        req.on('data', (chunk) => {
            receivedBytes += chunk.length;
            if (dataLength) {
                const percent = Math.round((receivedBytes / dataLength) * 100);
                //console.log(`Загрузка файла: ${percent}%`);
                if (percent % 2 === 0) sendUploadProgress(uid, percent);
            } else {
                sendUploadProgress(uid, 50)
                //console.log(`Получено байт: ${receivedBytes}`);
            }
        });

        req.pipe(writeStream);

        writeStream.on('finish', async () => {
            await fsAsync.mkdir(USER_LIST_PATH, { recursive: true });
            const userListFile = path.join(USER_LIST_PATH, `${uid}.json`);

            let info = await readJsonFile(userListFile, []);
            if (!Array.isArray(info)) info = [];

            info.push({
                fileName,
                fileSize: dataLength >= receivedBytes ? dataLength : receivedBytes,
                fileDateAdded: new Date().toISOString(),
                fileComment: comment.trim()
            });

            await fsAsync.writeFile(userListFile, JSON.stringify(info, null, 2), 'utf8');
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}][${req.path}] - Загружен файл: ${fileName} / Размер: ${receivedBytes} / Комментарий: ${comment}`);
            res.json({status: "success", uid: uid, fileList: info});
        })
    } catch (e) {
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}][${req.path}][ERROR] - ${e}`);
        res.status(500).json({status: "error", error: e});
    }
});

app.post('/download', checkUidMiddleware, async (req, res) => {
    const { fileName, type} = req.body;
    const uid = req.uid;

    if (type !== 'downloadFile' || !fileName || fileName.includes('..') || path.isAbsolute(fileName)) {
        return res.status(400).json({status: "error", error: 'Неверный запрос!'});
    }

    await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[${req.method}]][${req.path}][SEND] - Запрошен файл: ${fileName}`);

    const filePath = path.join(UPLOAD_FILES_PATH, uid, fileName);
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error(err);
            if (!res.headersSent) {
                res.status(404).json({status: "error", error: 'Файл не найден!'});
            }
        }
    });
});

app.use( async (req, res) => {
    await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[ERROR] - Обращение к ${req.originalUrl} методом ${req.method}`);
    res.status(404).send({ status: 'error', error: 'Страница не найдена.' });
});

// -------------------- Body WebSocket Server --------------------
wss.on('connection', (ws, request) => {
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', message => {
        try {
            const dataStr = typeof message === 'string' ? message : message.toString();
            const data = JSON.parse(dataStr);
            if (data.type === 'register' && data.uid) {
                // Связываем ws с uid
                wsClients.set(data.uid, ws);
                ws.uid = data.uid;
                logLineAsync(LOG_FILE_PATH, `[${request.socket.remoteAddress}]-[WS] - Новое соединение! UID: ${ws.uid}`).catch();
            }
        } catch (e) {
            console.error('Ошибка парсинга сообщения WebSocket:', e);
        }
    });

    ws.on('close', () => {
        if (ws.uid) {
            wsClients.delete(ws.uid);
            logLineAsync(LOG_FILE_PATH, `[${request.socket.remoteAddress}]-[WS] - Соединение закрыто! UID: ${ws.uid}`).catch();
        }
    });

    ws.on('error', (err) => console.error('Ошибка WebSocket:', err));
});

setInterval(() => {
    logLineAsync(LOG_FILE_PATH, `[WS][AUTO-CLEANER] - Автоматическая проверка доступности клиентов и очистка...`).catch();
    // Проверяем все WebSocket-соединения
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            logLineAsync(LOG_FILE_PATH, `[WS][AUTO-CLEANER] - Закрываем неактивное соединение: ${ws.uid}`).catch();
            ws.terminate();
        } else {
            ws.isAlive = false;
            ws.ping();
        }
    });
    // Очищаем карту wsClients от закрытых соединений
    for (const [uid, ws] of wsClients.entries()) {
        if (ws.readyState !== WebSocket.OPEN) {
            logLineAsync(LOG_FILE_PATH, `[WS][AUTO-CLEANER] - Удаляем неактивного клиента из списка wsClients: ${ws.uid}`).catch();
            wsClients.delete(uid);
        }
    }
}, 300 * 1000); // каждые 5 мин
// -------------------------- Function ---------------------------
function generateUserId() {
    return "user_" + (Date.now() + Math.floor(Math.random() * 10000)).toString(36);
}

async function logLineAsync(logFilePath, logLine) {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;
    console.log(fullLogLine);
    try {
        await fsAsync.appendFile(logFilePath, fullLogLine + os.EOL, 'utf8');
    } catch (err) {
        console.error('Ошибка записи в файл логов:', err);
    }
}

function getDecodedHeader(headers, name, defaultValue = '') {
    let value = headers[name];
    if (Array.isArray(value)) value = value[0];
    if (typeof value === 'string' && value) {
        try {
            return decodeURIComponent(value);
        } catch {
            return value; // если decodeURIComponent упадёт, вернём исходное значение
        }
    }
    return defaultValue;
}

async function getUniqueFileName(dir, originalFileName) {
    const ext = path.extname(originalFileName); // расширение файла
    const baseName = path.basename(originalFileName, ext); // имя без расширения

    let counter = 0;
    let fileName, filePath;
    do {
        fileName = counter === 0
            ? originalFileName
            : `${baseName}(${counter})${ext}`;
        filePath = path.join(dir, fileName);
        counter++;
    } while (await fileExists(filePath));
    return fileName;
}

async function fileExists(path) {
    // есть ли файл по такому пути
    try {
        await fsAsync.access(path);
        return true;
    } catch {
        return false;
    }
}

async function readJsonFile(path, errReturn, doParse = true) {
    try {
        const data = await fsAsync.readFile(path, 'utf8');
        return doParse ? JSON.parse(data) : data;
    } catch {
        return errReturn;
    }
}

async function writeUsers(users) {
    await fsAsync.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
}

function sendUploadProgress(uid, progress) {
    const ws = wsClients.get(uid);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'uploadProgress', progress }));
    }
}