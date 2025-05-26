// ----------------------- JavaScript -----------------------
const express = require("express");
const WEBSERVER = express();
const PORT = 3059;

const path = require("path");
const fs = require("fs");
const os = require("os");
const mysql = require("mysql");

const LOG_FILE_PATH = path.join(__dirname, "_server.log");

const poolConfig = {
    connectionLimit : 100,
    host     : 'localhost',
    user     : 'tester',
    password : '123456',
    database : 'test',
};
let pool = mysql.createPool(poolConfig);

WEBSERVER.use(express.static(path.join(__dirname, "../client/public/")));
WEBSERVER.use(express.json());

WEBSERVER.post("/api/sql", async (req, res) => {
    const { type, sqlQuery } = req.body;
    if (!sqlQuery || type !== 'query') return res.status(400).json({ type: 'error', error: 'Пустой SQL-запрос!'});

    const connection = await newConnectionFactory(pool, res);
    if (!connection) return; // Ошибка отправляется в newConnectionFactory()

    try {
        const { results, fields } = await queryPromise(connection, sqlQuery);
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[POST][/api/sql] - Запрос: ${JSON.stringify(sqlQuery)}`);

        const hasFields = fields && fields.length > 0;

        if (hasFields) {
            let col = fields.map(f => f.name);
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[SQL][TABLE] - Результат: ${JSON.stringify(col)} // ${JSON.stringify(results)}`);
            res.status(200).json({
                type: 'table',
                columns: col,
                rows: results
            });
        } else {
            let affRow = results.affectedRows || 0;
            await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[SQL][MODIFY] - Количество изменённых строк: ${affRow}`);
            res.status(200).json({
                type: 'modify',
                affectedRows: affRow
            });
        }
    } catch (err) {
        await logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[SQL][ERROR] - Ошибка при sql-запросе: ${err.message}`);
        res.status(500).json({
            type: 'error',
            error: err.message
        });
    } finally {
        connection.release(); // Возвращаем соединение в пул
    }
});

WEBSERVER.use((req, res) => {
    logLineAsync(LOG_FILE_PATH, `[${req.ip}]-[ERROR] - Обращение к ${req.originalUrl}`);
    res.status(404).send("Страница не найдена.");
});

WEBSERVER.listen(PORT, () => {
    logLineAsync(LOG_FILE_PATH, `[SERVER-INFO] - WebServer запущен на порте: ${PORT}`);
});

function getConnection () {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });
};

function queryPromise (connection, sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results, fields) => {
            if (err) reject(err);
            else resolve({ results, fields });
        });
    });
};

async function newConnectionFactory(pool, res) {
    try {
        return await getConnection();
    } catch (err) {
        res.status(500).json({ type: 'error', error: 'Ошибка получения соединения из пула: ' + err.message });
        return null;
    }
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
                    } else
                        fs.close(logFd, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                });
        });
    });
}

// -- Добавить одного пользователя
// INSERT INTO users (name, age, email)
// VALUES ('Иван Иванов', 30, 'ivan@example.com');
// -- Добавить нескольких пользователей
// INSERT INTO users (name, age, email) VALUES
// ('Ольга Петрова', 25, 'olga@example.com'),
//     ('Пётр Сидоров', 40, 'petr@example.com');
//
// -- Обновить возраст пользователя с id = 1
// UPDATE users SET age = 31 WHERE id = 1;
// -- Обновить email пользователя с именем 'Ольга Петрова'
// UPDATE users
// SET email = 'olga.new@example.com'
// WHERE name = 'Ольга Петрова';
//
// -- Выбрать всех пользователей
// SELECT * FROM users;
// -- Выбрать пользователей старше 30 лет
// SELECT * FROM users
// WHERE age > 30;
// -- Выбрать пользователя по email
// SELECT * FROM users
// WHERE email = 'ivan@example.com';
//
// -- Удалить пользователя с id = 2
// DELETE FROM users
// WHERE id = 2;
// -- Удалить всех пользователей младше 25 лет
// DELETE FROM users
// WHERE age < 25;