import { useCallback, useEffect, useState } from "react";
import "./App.css";
import FavoritesBody from "./components/favorites/FavoritesBody";
import ControlBody from "./components/control/ControlBody";
import { postApi } from "./api/postApi";

const URI_LINK = {
    getDataList: "/datalist",
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

function errViewMsg(text) {
    alert(text);
    console.error(text);
}

function App() {
    const [dataList, setDataList] = useState([]); // []
    const [dataReq, setDataReq] = useState({}); // {}
    const [dataRes, setDataRes] = useState({}); // {}
    const [loadingStatusList, setLoadingStatusList] = useState(false);
    const [loadingStatusReq, setLoadingStatusReq] = useState(false);

    const postData = (url, callback, newData) => {
        const idUser = window.localStorage.getItem("id");
        const objInfo = idUser ? { id: idUser } : {};
        const bodyReq = newData ? { ...objInfo, add: newData } : objInfo;

        postApi(url, bodyReq)
            .then((data) => {
                try {
                    if (data?.id) {
                        window.localStorage.setItem("id", String(data?.id));
                    }
                    if (data?.error) errViewMsg(`Ошибка: ${data?.error}`);
                    if (Array.isArray(data?.list) && data?.list.length > 0) {
                        callback(data?.list);
                    }
                    setLoadingStatusList(false);
                } catch (e) {
                    errViewMsg(`Ошибка загрузки раздела "Избранное": ${e}`);
                }
            })
            .catch((err) => {
                errViewMsg(`Ошибка загрузки раздела "Избранное": ${err}`);
            });
    };

    const updateDataList = useCallback((url, addData) => {
        let callbackFn = (data) => {
            setDataList(data);
        };
        postData(url, callbackFn, addData);
    },[]);

    const postSendData = (url, callback, newData) => {
        const infoReq = newData ? { send: newData } : {};

        postApi(url, infoReq)
            .then((data) => {
                if (data?.dataRes) callback(data.dataRes);
                setLoadingStatusReq(false);
            })
            .catch((err) => {
                errViewMsg(`Ошибка запроса: ${err}`);
            });
    };

    useEffect(() => {
        // componentDidMount
        setLoadingStatusList(true);
        updateDataList(URI_LINK.getDataList, undefined);
        return () => {
            // componentWillUnmount
        };
    }, [updateDataList]);

    const sendDataReq = (sendData) => {
        let callbackFn = (data) => {
            setDataRes(data);
        };
        postSendData(URI_LINK.sendDataReq, callbackFn, sendData);
        setLoadingStatusReq(true);
        setDataReq({ ...sendData });
    };

    const resetDataRes = (key) => {
        if (key) {
            setDataRes({});
            setDataReq({});
        }
    };

    const saveDataReq = (data) => {
        if (isRequestExists(data, dataList)) {
            return alert("Такой запрос уже есть в избранном!");
        } else {
            updateDataList(URI_LINK.getDataList, data);
        }
    };

    const openFavoriteReq = (id) => {
        setDataRes({});
        setDataReq(dataList[id]);
    };

    return (
        <div className="container">
            <FavoritesBody
                dataList={dataList}
                openPosition={openFavoriteReq}
                isLoading={loadingStatusList}
            />
            <ControlBody
                dataReq={dataReq}
                dataRes={dataRes}
                sendDataReq={sendDataReq}
                saveDataReq={saveDataReq}
                resetDataRes={resetDataRes}
                isLoading={loadingStatusReq}
            />
        </div>
    );
}

export default App;