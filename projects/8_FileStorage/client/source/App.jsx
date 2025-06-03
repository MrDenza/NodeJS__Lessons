import "./App.css";
import Form from "./components/Form";
import { useEffect, useRef, useState } from "react";
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
    link.click();
    URL.revokeObjectURL(link.href);
}

function App() {

    const [progressUpload, setProgressUpload] = useState(0);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [uid, setUid] = useState(null);
    const [wsUrl, setWsUrl] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        fetchSessionInfo();
    }, []);

    useEffect(() => {
        if (!uid) return;

        let reconnectAttempts = 0;
        let reconnectTimeout;

        function connect() {
            if (!uid || !wsUrl) return;

            ws.current = new WebSocket(wsUrl);
            ws.current.onopen = () => {
                reconnectAttempts = 0;
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
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    reconnectTimeout = setTimeout(() => {
                        console.log(`Попытка переподключения #${reconnectAttempts}`);
                        connect();
                    }, RECONNECT_INTERVAL);
                }
            };
            ws.current.onerror = (error) => {
                console.error('Ошибка WebSocket: ', error);
                ws.current.close();
            };
        }
        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [uid, wsUrl]);

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

    const fetchSessionInfo = () => {
        const storeUid = localStorage.getItem("uid");
        const headers = {
            "Content-Type": "application/json"
        }
        if (storeUid) headers["x-user-uid"] = encodeURIComponent(storeUid);

        postApi(URI_LINK.sessionInfo, {}, { headers })
        .then(data => {
            if (data.status === 'success') {
                localStorage.setItem("uid", data.uid);
                setFileList(data.files);
                setUid(data.uid);
                setWsUrl(data.wsUrl);
            }
        })
        .catch(error => {
            console.error('Ошибка инициализации: ', error);
        })
    }

    const fetchSendForm = async (form) => {
        const file = form.elements.file.files[0];
        const comment = form.elements.comment.value;
        const uid = localStorage.getItem("uid");

        setProgressUpload(0);
        setIsLoadingFile(true);

        const headers = buildHeaders({
            'x-user-uid': uid ? encodeURIComponent(uid) : undefined,
            'x-file-comment': comment ? encodeURIComponent(comment) : undefined,
            'x-file-name': file?.name ? encodeURIComponent(file.name) : undefined,
        });

        await postApi(URI_LINK.sendFile, file, {headers})
        .then(data => {
            if (data.status === 'success') {
                console.log('Файл успешно загружен!');
                setFileList(data.fileList);
                setProgressUpload(100);
                form.reset();
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке файла:', error);
            setProgressUpload(0);
            setIsLoadingFile(false);
        });
    }

    const downloadFile = async (fileName) => {
        const uid = localStorage.getItem("uid");

        const headers = buildHeaders({
            'x-user-uid': uid ? encodeURIComponent(uid) : undefined,
        });

        await postApi(URI_LINK.downloadFile, {type: 'downloadFile', fileName}, { headers })
        .then(data => {
            console.log('Скачивание файла: ', fileName);
            const blobUrl = URL.createObjectURL(data);
            downloadBlob(blobUrl, fileName);
        })
            .catch(error => {
                console.error(`Ошибка при скачивании файла ${fileName}: `,error);
        })
    }

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