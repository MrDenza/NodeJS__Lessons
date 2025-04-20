// ----------------------- JavaScript -----------------------
const express = require('express');
const WEBSERVER = express();
const PORT = 3055;

const fs = require('fs');
const path = require('path');
const os = require('os');
const logFN = path.join(__dirname, '_server.log');

WEBSERVER.use(express.json());
WEBSERVER.use(express.urlencoded({extended:true}));

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

const baseFields = [
    { type: 'text', id: 'name', title: 'Имя' },
    { type: 'number', id: 'age', title: 'Возраст' },
    { type: 'text', id: 'email', title: 'Email' }
];

WEBSERVER.get('/', (req, res) => {
    logLineSync(logFN, `[${req.ip}] [GET] - Open website.`);
    const fields = baseFields;
    sendValidationResponse(res, { keyAllValid: false, fields });
});

WEBSERVER.post('/form', (req, res) => {
    const hasData = Object.keys(req.body).length > 0;
    const values = hasData ? extractFields(req.body) : ['', '', ''];
    const errors = hasData ? validateFields(values) : ['', '', ''];
    const keyAllValid = hasData && errors.every(err => !err);
    const fields = buildFields(values, errors);

    if (keyAllValid) {
        logLineSync(logFN, `[${req.ip}] [POST] - VALID: ${JSON.stringify(req.body)}`);
        return res.redirect(301, `/result?` + jsonToQueryString(req.body));
    }

    if (hasData && !keyAllValid) {
        logLineSync(logFN, `[${req.ip}] [POST] - NO-VALID: ${JSON.stringify(req.body)}`);
        sendValidationResponse(res, { keyAllValid, fields });
    }

});

WEBSERVER.get('/result', (req, res) => {
    logLineSync(logFN, `[${req.ip}] [GET] - RESULT: ${JSON.stringify(req.query)}`);
    const hasData = Object.keys(req.query).length > 0;
    const values = hasData ? extractFields(req.query) : ['', '', ''];
    const fields = buildFields(values);
    const keyAllValid = true;

    sendValidationResponse(res, { keyAllValid, fields });
});

WEBSERVER.use((req, res) => {
    res.status(404).send('<h2 style="text-align: center">404: Страница не найдена.</h2>');
});

WEBSERVER.listen(PORT, () => {
    console.log('WebServer running on port ' + PORT);
});

function sendValidationResponse(res, { keyAllValid, fields }) {
    const tableContent = fields.map(field =>
        trBlockHtml(keyAllValid, field.type, field.id, field.title, field.value, field.err)
    ).join('');

    res.send(`
       <div style="text-align: center">
            <h2>${keyAllValid ? 'Все поля валидны!' : 'Валидация полей'}</h2>
            <form method="post" action="/form" style="display: inline-block">
                <table ${keyAllValid ? '' : 'style="width: 350px"'}>${tableContent}</table>
                ${keyAllValid ?
        '<a href="/" title="Вернуться к форме для валидации" style="display: inline-block; margin-top: 20px; padding: 1px 6px; text-align: center; text-decoration: none; border: 1px black solid"> Назад </a>'
        : '<input type="submit" value="Проверить" style="margin-top: 20px">'}
            </form>
        </div>
    `);
}

function extractFields(data) {
    const { name = '', age = '', email = '' } = data || {};
    return [name, age, email].map(param => (param || '').toString().trim());
}

function validateFields([name, age, email]) {
    return [validName(name), validAge(age), validEmail(email)];
}

function buildFields(values, errors = []) {
    return baseFields.map((field, i) => ({
        ...field,
        value: values[i],
        err: errors[i] || ''
    }));
}

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

function jsonToQueryString(json) {
    return Object.entries(json)
    .map(([keyPos, valuePos]) =>
        encodeURIComponent(keyPos) + '=' + encodeURIComponent(valuePos.trim())
    )
    .join('&');
}