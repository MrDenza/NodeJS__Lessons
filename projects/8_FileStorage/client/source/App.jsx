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
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

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

function App() {

    const [progressUpload, setProgressUpload] = useState(0);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [uid, setUid] = useState(() => localStorage.getItem("uid") || null);
    const [wsUrl, setWsUrl] = useState(null);
    const ws = useRef(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        if (!uid || !wsUrl) return;
        ws.current = new WebSocket(wsUrl);
        ws.current.onopen = () => {
            reconnectAttempts.current = 0;
            console.log('WebSocket соединение установлено!');
            if (uid) ws.current.send(JSON.stringify({ type: 'register', uid }));
        };
        ws.current.onmessage = (event) => {
            let message;
            try {
                message = JSON.parse(event.data);
            } catch {
                console.log(event.data);
                return;
            }
            if (typeof message === 'object' && message !== null && message.type === 'uploadProgress') {
                setProgressUpload(message.progress);
            } else if (typeof message === 'string') {
                console.log(message);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket соединение закрыто!');
            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts.current++;
                reconnectTimeout.current = setTimeout(() => {
                    console.log(`Попытка переподключения #${reconnectAttempts.current}`);
                    connect();
                }, RECONNECT_INTERVAL);
            }
        };
        ws.current.onerror = (error) => {
            console.error('Ошибка WebSocket: ', error);
            ws.current.close();
        };
    }, [uid, wsUrl])

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

        const headers = buildHeaders({
            'x-user-uid': safeEncode(uid),
            'x-file-comment': comment ? encodeURIComponent(comment) : undefined,
            'x-file-name': file?.name ? encodeURIComponent(file.name) : undefined,
        });

        try {
            const data = await postApi(URI_LINK.sendFile, file, { headers });
            if (data.status === 'success') {
                console.log('Файл успешно загружен!');
                setFileList(data.fileList);
                setProgressUpload(100);
                form.reset();
            }
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            setProgressUpload(0);
            setIsLoadingFile(false);
        }
    }, [uid])

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

    useEffect(() => {
        if (!uid) return;

        connect();

        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            if (ws.current) ws.current.close();
        };
    }, [connect, uid]);

    useEffect(() => {
        if (progressUpload === 100) {
            // Плавная анимация до 100%
            const timeout = setTimeout(() => {
                setProgressUpload(0);
                setIsLoadingFile(false);
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [progressUpload]);

    return (
        <div className="container">
            <div className="app__box">
                <h1 className="app__title">FreeCloud</h1>
                <Form sendForm={fetchSendForm} progress={progressUpload} isLoading={isLoadingFile}/>
                <hr/>
                <FilesList fileList={fileList} downloadFile={downloadFile}/>
            </div>
        </div>
    );
}

export default App;