"use strict"; // Строгий режим
// ----------------------- JavaScript -----------------------
const PROXY_API_PATH = import.meta.env.VITE_PROXY_API_PATH;

function validateRequest(response) {
    if (!response.ok) {
        //console.log(response.status);
        throw new Error('Серверная ошибка: данные недоступны');
    }
}

export const postApi = async (uri, data = {}, accept = '') => {
    try {
        const response = await fetch(`${PROXY_API_PATH}${uri}`,
            {
                method: 'POST',
                headers: {
                    'Accept': accept,
                    'Content-Type': accept || 'application/json'
                },
                body: JSON.stringify(data)
            }
        );
        validateRequest(response);
        const resData = await response;
        return accept ? resData?.blob() : resData?.text();
    } catch (error) {
        console.error(error);
        return null;
    }
};