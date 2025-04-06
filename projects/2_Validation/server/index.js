// ----------------------- JavaScript -----------------------
const express = require('express');
const WEBSERVER = express();
const PORT = 3052;

const fs = require('fs');
const path = require('path');
const os = require('os');
const logFN = path.join(__dirname, '_server.log');

const ERR_VALID = (() => {
    const COMMON = {
        nullField: 'Заполните поле!',
        invalidFormat: 'Некорректный формат'
    };

    return {
        ...COMMON,
        name: {
            length: 'Длина - от 2 до 10 символов!',
            invalidChars: 'Поле не может содержать цифры/символы!'
        },
        age: {
            nan: 'Поле может содержать только цифры!',
            negative: 'Возраст не может быть отрицательным!',
            min: 'Минимальный возраст 18 лет!',
            max: 'Максимальный возраст 100 лет!'
        },
        email: {
            length: 'Длина - до 50 символов!',
            invalidFormat: 'Некорректный формат Email-адреса!'
        }
    };
})();

WEBSERVER.use(express.urlencoded({extended: true}));

WEBSERVER.get('/', (req, res) => {
    const hasQueryParams = Object.keys(req.query).length > 0;

    // Защита от undefined
    const {name = '', age = '', email = ''} = hasQueryParams ? req.query : {};

    // Защита от null/undefined
    const [nameUser, ageUser, emailUser] = [name, age, email].map(param => (param || '').toString().trim());

    const [errValidName, errValidAge, errValidEmail] = hasQueryParams
        ? [validName(nameUser), validAge(ageUser), validEmail(emailUser)]
        : ['', '', ''];

    let keyAllValid = false;

    const fields = [
        { type: 'text', id: 'name', title: 'Имя', value: nameUser, err: errValidName },
        { type: 'number', id: 'age', title: 'Возраст', value: ageUser, err: errValidAge },
        { type: 'text', id: 'email', title: 'Email', value: emailUser, err: errValidEmail }
    ];

    if (hasQueryParams && !errValidName && !errValidAge && !errValidEmail) {
        logLineSync(logFN,`[${req.ip}] [VALID] - ${JSON.stringify(req.query)}`);
        keyAllValid = true;
    }

    if (hasQueryParams) logLineSync(logFN,`[${req.ip}] [NO-VALID] - ${JSON.stringify(req.query)}`);

    const tableContent = fields.map(field =>
        trBlockHtml(keyAllValid, field.type, field.id, field.title, field.value, field.err)
    ).join('');

    res.send(`
       <div style="text-align: center">
            <h2>${keyAllValid ? 'Все поля валидны!' : 'Валидация полей'}</h2>
            <form method="get" action="/" style="display: inline-block">
                <table ${keyAllValid ? '' : 'style="width: 350px"'}>${tableContent}</table>
                ${keyAllValid ? 
                    '<a href="/" title="Вернуться к форме для валидации" style="display: block; margin-top: 20px"><button>Назад</button></a>' 
                    : '<input type="submit" value="Проверить" style="margin-top: 20px">'}
            </form>
        </div>
    `);
});

WEBSERVER.use((req, res) => {
    res.status(404).send('<h2 style="text-align: center">404: Страница не найдена.</h2>');
});

WEBSERVER.listen(PORT, () => {
    console.log('WebServer running on port ' + PORT);
});

function trBlockHtml(keyView, typePos = 'text', idTag, title, valuePos = '', errMsg = '') {
    const inputField = `
        <input 
            type="${typePos}" 
            id="${idTag}" 
            name="${idTag}" 
            value="${valuePos}" 
            style="width: 100%" 
            title="${title}"
        />
    `;

    return (`
        <tr>
            <td><b>${title}:</b></td>
            <td>
                <label for="${idTag}"></label>
                ${keyView ? escapeHTML(valuePos) : inputField}
            </td>
        </tr>
        ${!keyView && errMsg ? `
            <tr>
                <td colSpan="2" style="text-align: center; color: red">
                    <i>${errMsg}</i>
                </td>
            </tr>
        ` : ''}
    `);
}

function validName (eName) {
    const MIN_LENGTH = 2;
    const MAX_LENGTH = 10;
    const REG_ONLY_LETTERS = /[^a-zA-Zа-яА-ЯёЁ]/;

    if(eName.length === 0) return ERR_VALID.nullField;
    if(eName.length < MIN_LENGTH || eName.length > MAX_LENGTH) return ERR_VALID.name.length;
    if(REG_ONLY_LETTERS.test(eName)) return ERR_VALID.name.invalidChars;
    return '';
}

function validEmail(eMail) {
    const MAX_EMAIL_LENGTH = 50;
    const REG_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (eMail.length === 0) return ERR_VALID.nullField;
    if (eMail.length > MAX_EMAIL_LENGTH)  return ERR_VALID.email.length;
    if (!REG_EMAIL.test(eMail)) return ERR_VALID.email.invalidFormat;
    return '';
}

function validAge(eAge) {
    const MIN_AGE = 18;
    const MAX_AGE = 100;
    let ageNum = Number(eAge);

    if (eAge.length === 0) return ERR_VALID.nullField;
    if (isNaN(ageNum)) return ERR_VALID.age.nan;
    if (ageNum < 0) return ERR_VALID.age.negative;
    if (ageNum < MIN_AGE) return ERR_VALID.age.min;
    if (ageNum > MAX_AGE) return ERR_VALID.age.max;
    return "";
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

function escapeHTML(text) {
    if ( !text )
        return text;
    text=text.toString()
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#039;");
    return text;
}