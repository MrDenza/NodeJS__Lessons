"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH || "";

/**
 * Универсальная функция для HTTP-запросов с поддержкой таймаута и отмены.
 *
 * @param {string} method - HTTP метод (GET, POST, PUT, DELETE, PATCH и др.)
 * @param {string} uri - URI эндпоинта (относительно PROXY_API_PATH)
 * @param {object} [options={}] - Опции запроса
 * @param {object} [options.params] - Параметры query string для GET и других методов
 * @param {object|FormData|string|null} [options.body] - Тело запроса
 * @param {object} [options.headers] - Заголовки
 * @param {string} [options.accept="application/json"] - Заголовок Accept
 * @param {string} [options.contentType] - Заголовок Content-Type (если нужно переопределить)
 * @param {number} [options.timeout=10000] - Таймаут в миллисекундах (по умолчанию 10 секунд)
 * @param {AbortSignal} [options.signal] - Сигнал отмены (можно передать извне)
 * @returns {Promise<any>} - Распарсенный ответ
 * @throws {Error} - Ошибка с полями status, body
 */

export async function apiRequest(
    method,
    uri,
    options = {}
) {
    const {
        params = {},
        body = null,
        headers = {},
        accept = "application/json",
        contentType,
        timeout = 10000,
        signal: externalSignal,
    } = options;

    // Формируем URL с query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${PROXY_API_PATH}${uri}${queryString ? `?${queryString}` : ""}`;

    // Заголовки
    const fetchHeaders = new Headers({
        Accept: accept,
        ...headers,
    });

    // Обработка тела запроса и Content-Type
    let fetchBody = null;

    if (body instanceof FormData) {
        fetchBody = body; // браузер сам выставит Content-Type с boundary
    } else if (typeof body === "string") {
        fetchBody = body;
        if (contentType) {
            fetchHeaders.set("Content-Type", contentType);
        } else if (!fetchHeaders.has("Content-Type")) {
            fetchHeaders.set("Content-Type", "text/plain;charset=UTF-8");
        }
    } else if (body && typeof body === "object") {
        fetchBody = JSON.stringify(body);
        if (contentType) {
            fetchHeaders.set("Content-Type", contentType);
        } else if (!fetchHeaders.has("Content-Type")) {
            fetchHeaders.set("Content-Type", "application/json;charset=UTF-8");
        }
    }

    // Таймаут и AbortController
    const controller = new AbortController();
    const signal = externalSignal || controller.signal;

    // Запускаем таймаут
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const response = await fetch(url, {
            method,
            headers: fetchHeaders,
            body: fetchBody,
            signal,
        });

        clearTimeout(timeoutId);

        const contentTypeResponse = response.headers.get("Content-Type") || "";

        let responseBody;
        if (contentTypeResponse.includes("application/json")) {
            responseBody = await response.json();
        } else if (contentTypeResponse.startsWith("text/")) {
            responseBody = await response.text();
        } else if (
            contentTypeResponse.includes("application/octet-stream") ||
            contentTypeResponse.includes("application/pdf") ||
            contentTypeResponse.startsWith("image/") ||
            contentTypeResponse.startsWith("audio/") ||
            contentTypeResponse.startsWith("video/")
        ) {
            responseBody = await response.blob();
        } else {
            responseBody = await response.text();
        }

        if (!response.ok) {
            const errorMessage =
                responseBody && typeof responseBody === "object" && responseBody.error
                    ? responseBody.error
                    : response.statusText || "Unknown error";

            const error = new Error(errorMessage);
            error.status = response.status;
            error.body = responseBody;
            throw error;
        }

        return responseBody;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            const abortError = new Error("Запрос отменён или таймаут истёк");
            abortError.name = "AbortError";
            throw abortError;
        }
        throw err;
    }
}

// Использование:
// Создаём контроллер для отмены
// const controller = new AbortController();
//
// setTimeout(() => {
//     controller.abort(); // Отменим запрос через 5 секунд, если он не завершился
// }, 5000);
//
// try {
//     const data = await apiRequest("GET", "/users", {
//         params: { page: 1 },
//         timeout: 8000, // 8 секунд таймаута
//         signal: controller.signal,
//     });
//     console.log("Данные:", data);
// } catch (err) {
//     if (err.name === "AbortError") {
//         console.warn("Запрос отменён или таймаут");
//     } else {
//         console.error("Ошибка запроса:", err.status, err.message);
//     }
// }