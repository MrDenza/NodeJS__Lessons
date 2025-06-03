"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
"use strict";

const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH || "";

/**
 * Универсальная функция для GET-запросов к API.
 *
 * @param {string} uri - URI эндпоинта (относительно PROXY_API_PATH)
 * @param {object} [params={}] - Параметры запроса (будут сериализованы в query string)
 * @param {object} [options={}] - Дополнительные опции
 * @param {string} [options.accept="application/json"] - Заголовок Accept
 * @param {object} [options.headers={}] - Дополнительные заголовки
 * @returns {Promise<any>} - Распарсенный ответ (json, text, blob)
 * @throws {Error} - В случае ошибки содержит статус и тело ответа
 */
export const getApi = async (
    uri,
    params = {},
    options = {}
) => {
    const { accept = "application/json", headers = {} } = options;

    // Сериализация параметров в query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${PROXY_API_PATH}${uri}${queryString ? `?${queryString}` : ""}`;

    const fetchHeaders = new Headers({
        Accept: accept,
        ...headers,
    });

    const response = await fetch(url, {
        method: "GET",
        headers: fetchHeaders,
    });

    const contentType = response.headers.get("Content-Type") || "";

    let responseBody;
    if (contentType.includes("application/json")) {
        responseBody = await response.json();
    } else if (contentType.startsWith("text/")) {
        responseBody = await response.text();
    } else if (
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/pdf") ||
        contentType.startsWith("image/") ||
        contentType.startsWith("audio/") ||
        contentType.startsWith("video/")
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
};

// Использование:
// try {
//     const users = await getApi("/users", { page: 2, limit: 10 });
//     console.log(users);
// } catch (err) {
//     console.error("Ошибка GET:", err.status, err.message);
// }