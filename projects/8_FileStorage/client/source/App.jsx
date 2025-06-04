import "./App.css";
import Form from "./components/Form";
import { useCallback, useEffect, useRef, useState } from "react";
import { postApi } from "./api/postApi";
import FilesList from "./components/FilesList";

const URI_LINK = {
    sendFile: "/upload",
    sessionInfo: "/session-info",
    downloadFile: "/download"
};
const WS_MAX_RECONNECT_ATTEMPTS = 3;
const WS_RECONNECT_INTERVAL = 3000;

function buildHeaders(obj) {
    return Object.fromEntries(
        Object.entries(obj)
        .filter(([/* key */, value]) => value !== undefined && value !== null && value !== '')
    );
}

function downloadBlob(data, fileName) {
    const link = document.createElement("a");
    link.href = data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    }, 100);
}

function safeEncode(value) {
    if (value === null || value === undefined) return undefined;
    return encodeURIComponent(String(value));
}

const parseWebSocketMessage = (event) => {
    try {
        return JSON.parse(event.data);
    } catch {
        console.log(event.data);
        return null;
    }
};

function App() {

    const [progressUpload, setProgressUpload] = useState(0);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [fileList, setFileList] = useState([]);
    const [uid, setUid] = useState(() => localStorage.getItem("uid") || null);
    const [wsUrl, setWsUrl] = useState(null);
    const ws = useRef(null);
    const shouldReconnect = useRef(true);

    const connectWebSocket = useCallback((maxAttempts = 3, timeAttempt = 3000, attempt = 1) => {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(wsUrl);

            const timeoutId = setTimeout(() => {
                socket.close();
                if (attempt < maxAttempts) {
                    console.log(`[WebSocket] Попытка подключения #${attempt} не удалась, пробуем снова...`);
                    resolve(connectWebSocket(maxAttempts, attempt + 1));
                } else {
                    reject(new Error('Не удалось установить соединение с сервером (3 попытки).'));
                }
            }, timeAttempt); // Таймаут на подключение

            socket.onopen = () => {
                clearTimeout(timeoutId);
                console.log('[WebSocket] Соединение установлено.');
                if (uid) socket.send(JSON.stringify({ type: 'register', uid }));
                resolve(socket);
            };

            socket.onerror = (err) => {
                console.error('[WebSocket] Ошибка:', err);
                socket.close();
            };

            socket.onclose = () => {
                clearTimeout(timeoutId);
                if (shouldReconnect.current) {
                    if (attempt < maxAttempts) {
                        console.log(`[WebSocket] Соединение закрыто, попытка #${attempt} не удалась, повторяем...`);
                        resolve(connectWebSocket(maxAttempts, timeAttempt, attempt + 1));
                    } else {
                        reject(new Error('Не удалось установить соединение с сервером.'));
                    }
                }
            };
        });
    }, [uid, wsUrl]);

    const updateUid = (newUid) => {
        setUid(newUid);
        if (newUid) {
            localStorage.setItem("uid", newUid);
        } else {
            localStorage.removeItem("uid");
        }
    };

    const fetchSessionInfo = useCallback(async () => {
        try {

            const headers = {
                "Content-Type": "application/json",
                ...(uid ? { "x-user-uid": safeEncode(uid) } : {})
            };

            const data = await postApi(URI_LINK.sessionInfo, {}, { headers });

            if (data.status === 'success') {
                updateUid(data.uid);
                setFileList(data.files);
                setWsUrl(data.wsUrl);
            }
        } catch (error) {
            console.error('Ошибка инициализации: ', error);
        }
    }, [uid])

    const fetchSendForm = useCallback(async (form) => {
        const file = form.elements.file.files[0];
        const comment = form.elements.comment.value;

        setProgressUpload(0);
        setIsLoadingFile(true);

        if (!uid || !wsUrl) {
            console.error('[WebSocket] Невозможно открыть соединение.');
            setIsLoadingFile(false);
            return;
        }

        shouldReconnect.current = true;

        try {
            ws.current = await connectWebSocket(WS_MAX_RECONNECT_ATTEMPTS, WS_RECONNECT_INTERVAL);

            ws.current.onmessage = (event) => {
                const message = parseWebSocketMessage(event);
                if (message.type === 'uploadProgress') {
                    setProgressUpload(message.progress);
                }
                if (message.type === 'endUpload') {
                    shouldReconnect.current = false;
                    if (ws.current) {
                        ws.current.close();
                        ws.current = null;
                    }
                }
            };

            setErrMsg('');
            const headers = buildHeaders({
                'x-user-uid': safeEncode(uid),
                'x-file-comment': comment ? encodeURIComponent(comment) : undefined,
                'x-file-name': file?.name ? encodeURIComponent(file.name) : undefined,
            });

            const data = await postApi(URI_LINK.sendFile, file, { headers });
            if (data.status === 'success') {
                console.log('Файл успешно загружен!');
                setFileList(data.fileList);
                setProgressUpload(100);
                form.reset();
            }
        } catch (error) {
            console.error('Ошибка при загрузке файла: ', error);
            setErrMsg(/^[А-Яа-яЁё]/.test(String(error).trim()) ? `Ошибка: ${error}` : 'Ошибка отправки файла!');
            setProgressUpload(0);
            setIsLoadingFile(false);
        }
    }, [connectWebSocket, uid, wsUrl]);

    const downloadFile = useCallback(async (fileName) => {
        const headers = buildHeaders({
            'x-user-uid': safeEncode(uid),
        });

        try {
            const data = await postApi(URI_LINK.downloadFile, { type: 'downloadFile', fileName }, { headers });
            console.log('Скачивание файла: ', fileName);

            let blob;
            if (data instanceof Blob) {
                blob = data;
            } else if (typeof data === 'string') {
                blob = new Blob([data], { type: 'text/plain' });
            }
            const blobUrl = URL.createObjectURL(blob);
            downloadBlob(blobUrl, fileName);
        } catch (error) {
            console.error(`Ошибка при скачивании файла ${fileName}: `, error);
        }
    }, [uid])

    useEffect(() => {
        (async () => {
            await fetchSessionInfo();
        })();
    }, [fetchSessionInfo]);

    // useEffect(() => {
    //     if (!uid) return;
    //
    //     connect();
    //
    //     return () => {
    //         if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    //         if (ws.current) ws.current.close();
    //     };
    // }, [connect, uid]);

    useEffect(() => {
        if (progressUpload === 100) {
            // Плавная анимация до 100%
            const timeout1 = setTimeout(() => {
                setProgressUpload(0);
                setIsLoadingFile(false);
            }, 300);

            return () => clearTimeout(timeout1);
        }
    }, [progressUpload]);

    useEffect(() => {
        if (errMsg.trim().length > 0) {
            // Убираем сообщение ошибки по таймеру
            const timeout2 = setTimeout(() => {
                setErrMsg('');
            }, 7000);

            return () => clearTimeout(timeout2);
        }
    }, [errMsg]);

    return (
        <div className="container">
            <div className="app__box">
                <h1 className="app__title">FreeCloud</h1>
                <Form sendForm={fetchSendForm} progress={progressUpload} isLoading={isLoadingFile}/>
                <span className={"app__err-msg"}>{errMsg}</span>
                <hr/>
                <FilesList fileList={fileList} downloadFile={downloadFile}/>
            </div>
        </div>
    );
}

export default App;