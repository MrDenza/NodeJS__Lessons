"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH;

export const postApi = async (uri, data = {}, accept = "") => {
    const response = await fetch(`${PROXY_API_PATH}${uri}`, {
        method: "POST",
        headers: {
            Accept: accept,
            "Content-Type": accept || "application/json",
        },
        body: JSON.stringify(data),
    });

    const contentType = response.headers.get("Content-Type") || "";

    let body;
    if (contentType.includes("application/json")) {
        body = await response.json();
    } else if (contentType.startsWith("text/")) {
        body = await response.text();
    } else if (
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/pdf") ||
        contentType.includes("image/") ||
        contentType.includes("audio/") ||
        contentType.includes("video/")
    ) {
        body = await response.blob();
    } else {
        body = await response.text();
    }

    if (!response.ok) {
        // Если сервер вернул ошибку, выбрасываем с сообщением из тела (если есть)
        const errorMessage = body && body.error ? body.error : response.statusText;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.body = body;
        throw error;
    }

    return body;
};