"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH;

function validateRequest(response) {
    if (!response.ok) {
        throw new Error(`Серверная ошибка: ${response.status} ${response.statusText}`);
    }
}

export const postApi = async (uri, data = {}, accept = '') => {
    try {
        const response = await fetch(`${PROXY_API_PATH}${uri}`, {
            method: 'POST',
            headers: {
                'Accept': accept,
                'Content-Type': accept || 'application/json',
            },
            body: JSON.stringify(data),
        });

        validateRequest(response);

        const contentType = response.headers.get('Content-Type') || '';
        console.log(contentType);
        if (contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType.startsWith('text/')) {
            return await response.text();
        } else if (
            contentType.includes('application/octet-stream') ||
            contentType.includes('application/pdf') ||
            contentType.includes('image/') ||
            contentType.includes('audio/') ||
            contentType.includes('video/')
        ) {
            return await response.blob();
        } else {

            return await response.text();
        }
    } catch (error) {
        console.error('Ошибка в postApi:', error);
        return null;
    }
};