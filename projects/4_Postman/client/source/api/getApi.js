"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH;

function validateRequest(response) {
    if (!response.ok) {
        //console.log(response.status);
        throw new Error('Серверная ошибка: данные недоступны');
    }
}

export const getApi = async (uri) => {
    try {
        const response = await fetch(`${PROXY_API_PATH}${uri}`);
        validateRequest(response);
        const resData = await response?.text();
        return resData ? JSON.parse(resData) : null;
    } catch (error) {
        console.error(error);
        return null;
    }
};



