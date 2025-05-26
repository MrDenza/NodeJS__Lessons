// ----------------------- JavaScript -----------------------
// Версия Node.JS: 22.14.0
const readline = require('readline');
const fs = require('fs/promises');
const fsStream = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');
const os = require('os');

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

// function log(level, tag, message) {
//     const color = LEVEL_COLORS[level] || 'reset';
//     const coloredTag = colorText(tag, color);
//     //const time = colorText(getTimeStamp(), 'dim');
//     //console.log(`${time} ${coloredTag} ${message}`);
//     console.log(`${coloredTag} ${message}`);
// }

// function logProgress(percent) {
//     const tag = colorText('PROGRESS', 'cyan');
//     const filledLength = Math.round((percent / 100) * PROGRESS_BAR_LENGTH);
//     const bar = '#'.repeat(filledLength) + '-'.repeat(PROGRESS_BAR_LENGTH - filledLength);
//     process.stdout.write(`\r${tag} [${bar}] ${percent.toFixed(2)}%   `);
// }





function log(level, tag, message) {
	const color = LEVEL_COLORS[level] || 'reset';
	const coloredTag = colorText(tag, color);

	// Переместить курсор вниз под прогресс-бары
	if (progressLinesCount > 0) {
		moveCursorDown(progressLinesCount);
	}

	console.log(`${coloredTag} ${message}`);

	// Вернуть курсор обратно вверх к прогресс-барам
	if (progressLinesCount > 0) {
		moveCursorUp(progressLinesCount);
	}
}
// --- Управление курсором терминала ---
function moveCursorUp(lines = 1) {
	process.stdout.write(`\x1b[${lines}A`);
}

function moveCursorDown(lines = 1) {
	process.stdout.write(`\x1b[${lines}B`);
}

function clearLine() {
	process.stdout.write('\x1b[2K\r');
}

// --- Массив для хранения прогресса каждого файла ---
const fileProgressLines = new Map(); // filePath -> lineIndex
let progressLinesCount = 0;          // сколько строк занято под прогресс

// --- Обновлённая функция логирования прогресса ---
function logProgressForFile(filePath, percent) {
	const tag = colorText('PROGRESS', 'cyan');
	const filledLength = Math.round((percent / 100) * PROGRESS_BAR_LENGTH);
	const bar = '#'.repeat(filledLength) + '-'.repeat(PROGRESS_BAR_LENGTH - filledLength);
	const lineIndex = fileProgressLines.get(filePath);

	if (lineIndex === undefined) {
		// Новый файл - добавляем строку прогресса в конец
		process.stdout.write('\n'); // Переходим на новую строку
		fileProgressLines.set(filePath, progressLinesCount);
		progressLinesCount++;
		logProgressForFile(filePath, percent); // Рекурсивно обновим теперь, когда строка есть
		return;
	}

	// Перемещаем курсор вверх, чтобы попасть на строку прогресса файла
	const linesUp = progressLinesCount - lineIndex;
	moveCursorUp(linesUp);

	clearLine();
	process.stdout.write(`${tag} ${path.basename(filePath)} [${bar}] ${percent.toFixed(2)}%`);

	// Возвращаем курсор обратно вниз, чтобы не мешать остальному выводу
	moveCursorDown(linesUp);
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

async function selectMode () {
	const coreNum = os.availableParallelism();
	if (coreNum <= 1) {
		return 1;
	} else {
		log('info', 'MODE-WORK', `Доступно ${coreNum} потоков процессора. Укажите количество параллельных задач (от 1 до ${coreNum}):`);
		while (true) {
			const input = await askPath("> ");
			const num = Number(input);
			if (Number.isInteger(num) && num >= 1 && num <= coreNum) {
				return num;
			} else {
				log('error', 'MODE-WORK-ERROR', `Введите целое число от 1 до ${coreNum}. Попробуйте ещё раз.`);
			}
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
			//logProgress(percent);
			//logProgressForFile(filePath, percent);
		});

		await pipeline(readStream, gzip, writeStream);

		// const lineIndex = fileProgressLines.get(filePath);
		// if (lineIndex !== undefined) {
		//     const linesUp = progressLinesCount - lineIndex;
		//     moveCursorUp(linesUp);
		//     clearLine();
		//     const doneTag = colorText('DONE', 'green');
		//     process.stdout.write(`${doneTag} ${fileName} - сжатие завершено\n`);
		//     moveCursorDown(linesUp - 1);
		//     fileProgressLines.delete(filePath);
		//     progressLinesCount--;
		// }
	}
	log('skip', 'GZ_FILE-PATH', `Путь: ${gzFilePath}`);
}

// функция для сбора всех файлов в массив
async function collectFiles(dir) {
	const files = [];
	for await (const filePath of walk(dir)) {
		if (!filePath.endsWith('.gz')) {
			files.push(filePath);
		}
	}
	return files;
}

// функция для параллельной обработки с ограничением
async function processFilesConcurrently(files, concurrency, processFile) {
	let index = 0;

	async function worker() {
		while (true) {
			let currentIndex;
			// Критическая секция для безопасного доступа к индексу
			if (index < files.length) {
				currentIndex = index++;
			} else {
				return; // Все файлы обработаны
			}
			const file = files[currentIndex];
			await processFile(file);
		}
	}

	const workers = [];
	for (let i = 0; i < concurrency; i++) {
		workers.push(worker());
	}

	await Promise.all(workers);
}

async function main () {
	log('success', 'AUTO-COMPRESSOR', 'Запуск...');
	console.log();

	let processingMode = await selectMode();
	log('success', 'MODE-WORK', `Выбрано для работы ${processingMode} потоков процессора (параллельных задач).`);

	console.log();
	let userPath = await initPath();
	log('info', 'DIRECTORY-PATH', `Путь: ${userPath}`);

	console.log();
	log('info', 'DIRECTORY-SCAN', 'Сканирование директории...');

	const start = Date.now();
	// *** Изменено: собираем все файлы в массив ***
	const files = await collectFiles(userPath);
	// *** Изменено: запускаем обработку файлов параллельно с ограничением processingMode ***
	await processFilesConcurrently(files, processingMode, processFile);
	const end = Date.now(); // фиксируем время окончания
	const duration = end - start; // разница в миллисекундах

	console.log();
	log('warn', 'COMPRESS-TIMER', `Обработка файлов заняла ${duration} мс`);
	log('success', 'AUTO-COMPRESSOR', 'Все файлы обработаны!');
}

// async function main () {
//     log('success', 'AUTO-COMPRESSOR', 'Запуск...');
//     console.log();
//
//     let processingMode = await selectMode();
//     log('success', 'MODE-WORK', `Выбрано для работы ${processingMode} потоков процессора (параллельных задач).`);
//
//     console.log();
//     let userPath = await initPath();
//     log('info', 'DIRECTORY-PATH', `Путь: ${userPath}`);
//
//     console.log();
//     log('info', 'DIRECTORY-SCAN', 'Сканирование директории...');
//     for await (const filePath of walk(userPath)) {
//         if (filePath.endsWith('.gz')) continue;
//         await processFile(filePath);
//     }
//
//     console.log();
//     log('success', 'AUTO-COMPRESSOR', 'Все файлы обработаны!');
// }

main().catch((err) => {
	log('error', 'ERROR', err.message);
	process.exit(1);
});


// // ----------------------- JavaScript -----------------------
// // Версия Node.JS: 22.14.0
// const readline = require('readline');
// const fs = require('fs/promises');
// const fsStream = require('fs');
// const path = require('path');
// const zlib = require('zlib');
// const { pipeline } = require('stream/promises');
//
// // ------- Вспомогательный код для log ---------
// const COLORS_LOG = { // Цвета ANSI для терминала
// 	reset: "\x1b[0m",
// 	bright: "\x1b[1m",
// 	dim: "\x1b[2m",
// 	red: "\x1b[31m",
// 	green: "\x1b[32m",
// 	yellow: "\x1b[33m",
// 	blue: "\x1b[34m",
// 	cyan: "\x1b[36m",
// 	gray: "\x1b[90m",
// };
// const LEVEL_COLORS = {
// 	info: 'blue',
// 	success: 'green',
// 	warn: 'yellow',
// 	error: 'red',
// 	skip: 'gray',
// 	start: 'cyan',
// 	done: 'green',
// };
// const TAG_WIDTH = 16;
// const PROGRESS_BAR_LENGTH = 50;
//
// // function getTimeStamp() {
// //     return new Date().toISOString().replace('T', ' ').replace('Z', '');
// // }
// function centerText(text, width, char = '_') {
// 	const len = text.length;
// 	if (len >= width) return text;
// 	const totalPadding = width - len;
// 	const padStart = Math.floor(totalPadding / 2);
// 	const padEnd = totalPadding - padStart;
// 	return char.repeat(padStart) + text + char.repeat(padEnd);
// 	//return char.repeat(totalPadding) + text;
// 	//return text + char.repeat(totalPadding);
// }
//
// function colorText(text, color) {
// 	const code = COLORS_LOG[color];
// 	const upperText = text.toUpperCase();
// 	const centered = centerText(upperText, TAG_WIDTH);
// 	const wrapped = `[${centered}]`;
// 	return code ? `${code}${wrapped}${COLORS_LOG.reset}` : wrapped;
// }
//
// function log(level, tag, message) {
// 	const color = LEVEL_COLORS[level] || 'reset';
// 	const coloredTag = colorText(tag, color);
// 	//const time = colorText(getTimeStamp(), 'dim');
// 	//console.log(`${time} ${coloredTag} ${message}`);
// 	console.log(`${coloredTag} ${message}`);
// }
//
// function logProgress(percent) {
// 	const tag = colorText('PROGRESS', 'cyan');
// 	const filledLength = Math.round((percent / 100) * PROGRESS_BAR_LENGTH);
// 	const bar = '#'.repeat(filledLength) + '-'.repeat(PROGRESS_BAR_LENGTH - filledLength);
// 	process.stdout.write(`\r${tag} [${bar}] ${percent.toFixed(2)}%   `);
// }
//
// // --------------- Основной код ----------------
// async function askPath(query) {
// 	const rl = readline.createInterface({
// 		input: process.stdin,
// 		output: process.stdout,
// 	});
//
// 	const question = (q) => new Promise(resolve => rl.question(q, resolve));
//
// 	while (true) {
// 		const answer = await question(query);
// 		const trimmed = answer.trim();
// 		if (trimmed) {
// 			rl.close();
// 			return trimmed;
// 		} else {
// 			log('error', 'ERROR', "Поле не заполнено. Попробуйте ещё раз.")
// 		}
// 	}
// }
//
// async function getInputPath() {
// 	if (process.argv[2]) {
// 		log('info', 'PATH', 'Путь получен из аргументов командной строки.');
// 		return process.argv[2];
// 	} else {
// 		log('info', 'PATH', 'Введите путь к директории:');
// 		return askPath("> ");
// 	}
// }
//
// async function checkPath(resolvedPath) {
// 	const stat = await fs.stat(resolvedPath);
// 	if (!stat.isFile() && !stat.isDirectory()) {
// 		throw new Error(`Путь существует, но это не файл и не директория: ${resolvedPath}`);
// 	}
// }
//
// async function initPath() {
// 	const inputPath = String(await getInputPath());
// 	const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
//
// 	try {
// 		await checkPath(resolvedPath);
// 		return resolvedPath;
// 	} catch (error) {
// 		throw new Error(`Файл или директория не найдены или недоступны: ${resolvedPath}`);
// 	}
// }
//
// async function* walk(dir) {
// 	const entries = await fs.readdir(dir, { withFileTypes: true });
// 	for (const entry of entries) {
// 		const fullPath = path.join(dir, entry.name);
// 		if (entry.isDirectory()) {
// 			yield* walk(fullPath);
// 		} else if (entry.isFile()) {
// 			yield fullPath;
// 		}
// 	}
// }
//
// async function processFile(filePath) {
// 	const gzFilePath = filePath + ".gz";
// 	const fileName = path.basename(filePath);
//
// 	console.log();
// 	log('info', 'FILE', `Файл: ${fileName}`);
// 	log('skip', 'FILE-PATH', `Путь: ${filePath}`);
//
// 	let fileStat, gzFileStat;
// 	let gzFileExists = true;
// 	let needCompress = true;
//
// 	try {
// 		fileStat = await fs.stat(filePath);
// 	} catch {
// 		log('error', 'FILE-ERROR', `Исходный файл не найден: ${filePath}`);
// 		return;
// 	}
//
// 	try {
// 		gzFileStat = await fs.stat(gzFilePath);
// 	} catch (err) {
// 		if (err.code === 'ENOENT') {
// 			gzFileExists = false;
// 			log('error', 'GZ_FILE-STATUS', 'Отсутствует gz-файл');
// 		} else {
// 			throw err;
// 		}
// 	}
//
// 	if (gzFileExists) {
// 		if (fileStat.mtime <= gzFileStat.mtime) {
// 			log('success', 'GZ_FILE-STATUS', 'Актуальный gz-файл');
// 			needCompress = false;
// 		} else {
// 			log('warn', 'GZ_FILE-STATUS', 'Устаревший gz-файл');
// 			needCompress = true;
// 		}
// 	}
//
// 	if (!gzFileExists || needCompress) {
// 		log('success', 'GZ_FILE-CREATE', 'Создаём gz-файла');
// 		log('start', 'COMPRESS-START', 'Сжатие исходного файла');
//
// 		const totalSize = fileStat.size;
// 		let processed = 0;
// 		const onError = (err) => {
// 			log('error', 'COMPRESS-ERROR', err.message);
// 		};
//
// 		const readStream = fsStream.createReadStream(filePath);
// 		const writeStream = fsStream.createWriteStream(gzFilePath);
// 		const gzip = zlib.createGzip();
//
// 		readStream.on('error', onError);
// 		gzip.on('error', onError);
// 		writeStream.on('error', onError);
// 		readStream.on('data', (chunk) => {
// 			processed += chunk.length;
// 			const percent = (processed / totalSize) * 100;
// 			logProgress(percent);
// 		});
//
// 		await pipeline(readStream, gzip, writeStream);
//
// 		process.stdout.write('\n');
// 		log('done', 'COMPRESS-DONE', 'Создан gz-файл');
// 	}
// 	log('skip', 'GZ_FILE-PATH', `Путь: ${gzFilePath}`);
// }
//
// async function main () {
// 	log('success', 'AUTO-COMPRESSOR', 'Запуск...');
// 	console.log();
//
// 	let userPath = await initPath();
// 	log('info', 'DIRECTORY-PATH', `Путь: ${userPath}`);
//
// 	console.log();
// 	log('info', 'DIRECTORY-SCAN', 'Сканирование директории...');
// 	const start = Date.now(); // фиксируем время старта
// 	for await (const filePath of walk(userPath)) {
// 		if (filePath.endsWith('.gz')) continue;
// 		await processFile(filePath);
// 	}
// 	const end = Date.now(); // фиксируем время окончания
// 	const duration = end - start; // разница в миллисекундах
//
// 	console.log();
// 	log('warn', 'COMPRESS-TIMER', `Обработка файлов заняла ${duration} мс`);
// 	log('success', 'AUTO-COMPRESSOR', 'Все файлы обработаны!');
// }
//
// main().catch((err) => {
// 	log('error', 'ERROR', err.message);
// 	process.exit(1);
// });