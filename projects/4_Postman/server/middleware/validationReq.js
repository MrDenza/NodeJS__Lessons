const METHOD_LIST = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const HEADERS_LIST = [
    'content-type',
    'authorization',
    'accept',
    'user-agent',
    'cache-control',

];

const ERRORS_MSG_LIST = {
    method: {
        nullField: 'Поле method обязательно',
        noValidMethod: 'Недопустимый HTTP метод',
    },
    url: {
        nullField: 'Поле url обязательно',
        noValidUrl: 'Некорректный URL',
    },
    query: {
        errTypeValue: 'Поле query должно быть массивом объектов с одним ключом',
        duplicateKey: 'В query обнаружены дублирующиеся ключи',
        nullField: 'Ключи и значения в query не должны быть пустыми',
    },
    body: {
        noContentType: 'Content-Type не указан в заголовках',
        noValidBody: 'Поле body отсутствует или некорректно',
        noCorrectBody: 'body не является корректным JSON',
        invalidType: 'Content-Type не поддерживается',
    },
    headers: {
        errTypeValue: 'Поле headers должно быть массивом объектов с одним ключом',
        duplicateKey: 'В headers обнаружены дублирующиеся ключи',
        nullField: 'Ключи и значения в headers не должны быть пустыми',
        noValidHeader: 'Недопустимый заголовок',
    },
};

function validateAddMiddleware(req, res, next) {
    const data = req.body.add;

    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Поле add обязательно и должно быть объектом' });
    }

    const { method, url, query, body, headers } = data;

    // Проверка method
    if (typeof method !== 'string' || !METHOD_LIST.includes(method.toUpperCase())) {
        return res.status(400).json({ error: ERRORS_MSG_LIST.method.noValidMethod });
    }

    // Проверка url
    if (typeof url !== 'string' || url.trim() === '') {
        return res.status(400).json({ error: ERRORS_MSG_LIST.url.nullField });
    }
    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: ERRORS_MSG_LIST.url.noValidUrl });
    }

    // Проверка query
    if (!Array.isArray(query)) {
        return res.status(400).json({ error: ERRORS_MSG_LIST.query.errTypeValue });
    }
    const queryKeys = [];
    for (const obj of query) {
        if (typeof obj !== 'object' || obj === null || Object.keys(obj).length !== 1) {
            return res.status(400).json({ error: ERRORS_MSG_LIST.query.errTypeValue });
        }
        const [key, val] = Object.entries(obj)[0];
        if (typeof key !== 'string' || key.trim() === '' || val === undefined || val === null || val.toString().trim() === '') {
            return res.status(400).json({ error: ERRORS_MSG_LIST.query.nullField });
        }
        if (queryKeys.includes(key)) {
            return res.status(400).json({ error: ERRORS_MSG_LIST.query.duplicateKey });
        }
        queryKeys.push(key);
    }

    // Проверка headers
    if (!Array.isArray(headers)) {
        return res.status(400).json({ error: ERRORS_MSG_LIST.headers.errTypeValue });
    }
    const headerKeys = [];
    for (const obj of headers) {
        if (typeof obj !== 'object' || obj === null || Object.keys(obj).length !== 1) {
            return res.status(400).json({ error: ERRORS_MSG_LIST.headers.errTypeValue });
        }
        const [key, val] = Object.entries(obj)[0];
        if (typeof key !== 'string' || key.trim() === '') {
            return res.status(400).json({ error: ERRORS_MSG_LIST.headers.nullField });
        }
        if (!HEADERS_LIST.includes(key.toLowerCase())) {
            return res.status(400).json({ error: ERRORS_MSG_LIST.headers.noValidHeader });
        }
        if (val === undefined || val === null || val.toString().trim() === '') {
            return res.status(400).json({ error: ERRORS_MSG_LIST.headers.nullField });
        }
        if (headerKeys.includes(key.toLowerCase())) {
            return res.status(400).json({ error: ERRORS_MSG_LIST.headers.duplicateKey });
        }
        headerKeys.push(key.toLowerCase());
    }

    // Извлекаем content-type из headers
    const contentTypeHeader = headers.find(h =>
        Object.keys(h).some(k => k.toLowerCase() === 'content-type')
    );
    if (!contentTypeHeader) {
        return res.status(400).json({ error: ERRORS_MSG_LIST.body.noContentType });
    }
    const contentTypeKey = Object.keys(contentTypeHeader).find(k => k.toLowerCase() === 'content-type');
    const contentType = contentTypeHeader[contentTypeKey];

    // Валидация body в зависимости от content-type
    if (body === undefined || body === null) {
        return res.status(400).json({ error: ERRORS_MSG_LIST.body.noValidBody });
    }
    try {
        if (contentType.includes('application/json')) {
            const parsed = typeof body === 'string' ? JSON.parse(body) : body;
            if (typeof parsed !== 'object' || parsed === null) {
                return res.status(400).json({ error: ERRORS_MSG_LIST.body.noCorrectBody });
            }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            if (typeof body !== 'string' || body.trim() === '') {
                return res.status(400).json({ error: ERRORS_MSG_LIST.body.noValidBody });
            }
            const params = new URLSearchParams(body);
            if (Array.from(params.entries()).length === 0) {
                return res.status(400).json({ error: ERRORS_MSG_LIST.body.noValidBody });
            }
        } else if (contentType.includes('text/plain')) {
            if (typeof body !== 'string') {
                return res.status(400).json({ error: ERRORS_MSG_LIST.body.noValidBody });
            }
        } else {
            return res.status(400).json({ error: ERRORS_MSG_LIST.body.invalidType });
        }
    } catch {
        return res.status(400).json({ error: ERRORS_MSG_LIST.body.noValidBody });
    }

    next();
}

module.exports = validateAddMiddleware;