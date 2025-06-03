"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH || "";
/**
 * Универсальная функция для HTTP-запросов с телом (POST, PUT, PATCH, DELETE).
 *
 * @param {string} method - HTTP метод (POST, PUT, DELETE, PATCH)
 * @param {string} uri - URI эндпоинта (относительно PROXY_API_PATH)
 * @param {object|FormData|string|null} [data={}] - Тело запроса
 * @param {object} [options={}] - Дополнительные опции
 * @param {string} [options.accept="application/json"] - Заголовок Accept
 * @param {object} [options.headers={}] - Дополнительные заголовки
 * @param {string} [options.contentType] - Явно указать Content-Type
 * @returns {Promise<any>} - Распарсенный ответ
 * @throws {Error} - В случае ошибки содержит статус и тело ответа
 */
export const sendApi = async (
    method,
    uri,
    data = {},
    options = {}
) => {
    const {
        accept = "application/json",
        headers = {},
        contentType,
    } = options;

    const fetchHeaders = new Headers({
        Accept: accept,
        ...headers,
    });

    let body;
    if (data instanceof FormData) {
        body = data;
    } else if (typeof data === "string") {
        body = data;
        if (contentType) {
            fetchHeaders.set("Content-Type", contentType);
        } else if (!fetchHeaders.has("Content-Type")) {
            fetchHeaders.set("Content-Type", "text/plain;charset=UTF-8");
        }
    } else if (data && typeof data === "object") {
        body = JSON.stringify(data);
        if (contentType) {
            fetchHeaders.set("Content-Type", contentType);
        } else if (!fetchHeaders.has("Content-Type")) {
            fetchHeaders.set("Content-Type", "application/json;charset=UTF-8");
        }
    } else {
        body = null;
    }

    const response = await fetch(`${PROXY_API_PATH}${uri}`, {
        method,
        headers: fetchHeaders,
        body,
    });

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
};


// Использование:
// // POST запрос с JSON
// try {
//     const newUser = await sendApi("POST", "/users", { name: "Пётр" });
//     console.log(newUser);
// } catch (err) {
//     console.error("Ошибка POST:", err.status, err.message);
// }
//
// // PUT запрос с FormData (например, загрузка файла)
// const formData = new FormData();
// formData.append("avatar", fileInput.files[0]);
//
// try {
//     const updatedUser = await sendApi("PUT", "/users/123/avatar", formData);
//     console.log(updatedUser);
// } catch (err) {
//     console.error("Ошибка PUT:", err.status, err.message);
// }
//
// // DELETE запрос без тела
// try {
//     const result = await sendApi("DELETE", "/users/123");
//     console.log(result);
// } catch (err) {
//     console.error("Ошибка DELETE:", err.status, err.message);
// }