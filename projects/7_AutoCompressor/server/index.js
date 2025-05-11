// ----------------------- JavaScript -----------------------
// Версия Node.JS: 22.14.0
const readline = require('readline');
const fs = require('fs/promises');
const fsStream = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

// ------- Вспомогательный код для log ---------
const COLORS_LOG = { // Цвета ANSI для терминала
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};
const LEVEL_COLORS = {
    info: 'blue',
    success: 'green',
    warn: 'yellow',
    error: 'red',
    skip: 'gray',
    start: 'cyan',
    done: 'green',
};
const TAG_WIDTH = 16;
const PROGRESS_BAR_LENGTH = 50;

// function getTimeStamp() {
//     return new Date().toISOString().replace('T', ' ').replace('Z', '');
// }
function centerText(text, width, char = '_') {
    const len = text.length;
    if (len >= width) return text;
    const totalPadding = width - len;
    const padStart = Math.floor(totalPadding / 2);
    const padEnd = totalPadding - padStart;
    return char.repeat(padStart) + text + char.repeat(padEnd);
    //return char.repeat(totalPadding) + text;
    //return text + char.repeat(totalPadding);
}

function colorText(text, color) {
    const code = COLORS_LOG[color];
    const upperText = text.toUpperCase();
    const centered = centerText(upperText, TAG_WIDTH);
    const wrapped = `[${centered}]`;
    return code ? `${code}${wrapped}${COLORS_LOG.reset}` : wrapped;
}

function log(level, tag, message) {
    const color = LEVEL_COLORS[level] || 'reset';
    const coloredTag = colorText(tag, color);
    //const time = colorText(getTimeStamp(), 'dim');
    //console.log(`${time} ${coloredTag} ${message}`);
    console.log(`${coloredTag} ${message}`);
}

function logProgress(percent) {
    const tag = colorText('PROGRESS', 'cyan');
    const filledLength = Math.round((percent / 100) * PROGRESS_BAR_LENGTH);
    const bar = '#'.repeat(filledLength) + '-'.repeat(PROGRESS_BAR_LENGTH - filledLength);
    process.stdout.write(`\r${tag} [${bar}] ${percent.toFixed(2)}%   `);
}

// --------------- Основной код ----------------
async function askPath(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (q) => new Promise(resolve => rl.question(q, resolve));

    while (true) {
        const answer = await question(query);
        const trimmed = answer.trim();
        if (trimmed) {
            rl.close();
            return trimmed;
        } else {
            log('error', 'ERROR', "Поле не заполнено. Попробуйте ещё раз.")
        }
    }
}

async function getInputPath() {
    if (process.argv[2]) {
        log('info', 'PATH', 'Путь получен из аргументов командной строки.');
        return process.argv[2];
    } else {
        log('info', 'PATH', 'Введите путь к директории:');
        return askPath("> ");
    }
}

async function checkPath(resolvedPath) {
    const stat = await fs.stat(resolvedPath);
    if (!stat.isFile() && !stat.isDirectory()) {
        throw new Error(`Путь существует, но это не файл и не директория: ${resolvedPath}`);
    }
}

async function initPath() {
    const inputPath = String(await getInputPath());
    const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);

    try {
        await checkPath(resolvedPath);
        return resolvedPath;
    } catch (error) {
        throw new Error(`Файл или директория не найдены или недоступны: ${resolvedPath}`);
    }
}

async function* walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walk(fullPath);
        } else if (entry.isFile()) {
            yield fullPath;
        }
    }
}

async function processFile(filePath) {
    const gzFilePath = filePath + ".gz";
    const fileName = path.basename(filePath);

    console.log();
    log('info', 'FILE', `Файл: ${fileName}`);
    log('skip', 'FILE-PATH', `Путь: ${filePath}`);

    let fileStat, gzFileStat;
    let gzFileExists = true;
    let needCompress = true;

    try {
        fileStat = await fs.stat(filePath);
    } catch {
        log('error', 'FILE-ERROR', `Исходный файл не найден: ${filePath}`);
        return;
    }

    try {
        gzFileStat = await fs.stat(gzFilePath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            gzFileExists = false;
            log('error', 'GZ_FILE-STATUS', 'Отсутствует gz-файл');
        } else {
            throw err;
        }
    }

    if (gzFileExists) {
        if (fileStat.mtime <= gzFileStat.mtime) {
            log('success', 'GZ_FILE-STATUS', 'Актуальный gz-файл');
            needCompress = false;
        } else {
            log('warn', 'GZ_FILE-STATUS', 'Устаревший gz-файл');
            needCompress = true;
        }
    }

    if (!gzFileExists || needCompress) {
        log('success', 'GZ_FILE-CREATE', 'Создаём gz-файла');
        log('start', 'COMPRESS-START', 'Сжатие исходного файла');

        const totalSize = fileStat.size;
        let processed = 0;
        const onError = (err) => {
            log('error', 'COMPRESS-ERROR', err.message);
        };

        const readStream = fsStream.createReadStream(filePath);
        const writeStream = fsStream.createWriteStream(gzFilePath);
        const gzip = zlib.createGzip();

        readStream.on('error', onError);
        gzip.on('error', onError);
        writeStream.on('error', onError);
        readStream.on('data', (chunk) => {
            processed += chunk.length;
            const percent = (processed / totalSize) * 100;
            logProgress(percent);
        });

        await pipeline(readStream, gzip, writeStream);

        process.stdout.write('\n');
        log('done', 'COMPRESS-DONE', 'Создан gz-файл');
    }
    log('skip', 'GZ_FILE-PATH', `Путь: ${gzFilePath}`);
}

async function main () {
    log('success', 'AUTO-COMPRESSOR', 'Запуск...');
    console.log();

    let userPath = await initPath();
    log('info', 'DIRECTORY-PATH', `Путь: ${userPath}`);

    console.log();
    log('info', 'DIRECTORY-SCAN', 'Сканирование директории...');
    for await (const filePath of walk(userPath)) {
        if (filePath.endsWith('.gz')) continue;
        await processFile(filePath);
    }

    console.log();
    log('success', 'AUTO-COMPRESSOR', 'Все файлы обработаны!');
}

main().catch((err) => {
    log('error', 'ERROR', err.message);
    process.exit(1);
});