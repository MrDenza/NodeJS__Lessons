import React, { useEffect, useState } from "react";
import "./App.css";
import FavoritesBody from "./components/favorites/FavoritesBody";
import ControlBody from "./components/control/ControlBody";

import { getApi } from "./api/getApi";
import { postApi } from "./api/postApi";

const URI_LINK = {
    getDataList: "/datalist",
    saveDataElem: "/save",
    sendDataReq: "/send",
};

function normalizeRequest(req) {
    const sortEntries = (arr) =>
        arr
            ?.map((item) => {
                const entries = Object.entries(item);
                entries.sort(([a], [b]) => a.localeCompare(b));
                return JSON.stringify(entries);
            })
            .sort()
            .join("|") || "";

    return {
        method: req.method.toLowerCase(),
        url: req.url.toLowerCase().trim(),
        body: req.body?.trim() || "",
        query: sortEntries(req.query),
        headers: sortEntries(req.headers),
    };
}

function isRequestExists(newItem, arrList) {
    const normalizedNew = normalizeRequest(newItem);

    return arrList.some((item) => {
        const normalizedItem = normalizeRequest(item);
        return (
            normalizedItem.method === normalizedNew.method &&
            normalizedItem.url === normalizedNew.url &&
            normalizedItem.body === normalizedNew.body &&
            normalizedItem.query === normalizedNew.query &&
            normalizedItem.headers === normalizedNew.headers
        );
    });
}

function App() {
    const [dataList, setDataList] = useState([]); // []
    const [dataReq, setDataReq] = useState({}); // {}
    const [dataRes, setDataRes] = useState({}); // {}

    const sendPostRequest = (url, callback, newData) => {
        const idUser = window.localStorage.getItem('id');
        const objInfo = idUser ? { id: idUser } : undefined;
        const bodyReq = newData ? {...objInfo, add: newData}: objInfo;

        postApi(url, bodyReq).then(r => {
            const data = JSON.parse(r);
            if (data.id) window.localStorage.setItem('id', String(data.id));
            if (data.list.length) {
                callback(data.list);
            }
        });
    };
    const postData = (url, callback, newData) => {
        const idUser = window.localStorage.getItem('id');
        const objInfo = idUser ? { id: idUser } : {};
        const bodyReq = newData ? { ...objInfo, add: newData } : objInfo;

        postApi(url, bodyReq).then(r => {
            try {
                const data = JSON.parse(r);
                if (data.id) {
                    window.localStorage.setItem('id', String(data.id));
                }
                if (Array.isArray(data.list) && data.list.length > 0) {
                    callback(data.list);
                }
            } catch (e) {
                console.error('Ошибка парсинга ответа:', e);
            }
        }).catch(err => {
            console.error('Ошибка запроса:', err);
        });
    };

    const updateDataList = (url, addData) => {
        let callbackFn = (data) => {
            setDataList(data);
        }
        postData(url, callbackFn, addData);
    };

    useEffect( () => {
        // componentDidMount
        updateDataList(URI_LINK.getDataList);
        return () => {
            // componentWillUnmount
        }
    }, []);

    const sendDataReq = (newData) => {
        console.log("submit");
        setDataReq({ ...newData });
    };

    const saveDataReq = (data) => {
        if (isRequestExists(data, dataList)) {
            return alert("Такой запрос уже есть в избранном!");
        } else {
            updateDataList(URI_LINK.getDataList, data)
        }

        // setDataList((prevDataList) => {
        //     if (isRequestExists(data, prevDataList)) {
        //         alert("Такой запрос уже есть в избранном!");
        //         return prevDataList;
        //     } else {
        //         return [...prevDataList, data];
        //     }
        // });
    };

    const openFavoriteReq = (id) => {
        setDataReq(dataList[id]);
    };

    return (
        <div className="container">
            <FavoritesBody dataList={dataList} openPosition={openFavoriteReq} />
            <ControlBody dataReq={dataReq} dataRes={dataRes} sendDataReq={sendDataReq} saveDataReq={saveDataReq} />
        </div>
    );
}

export default App;
