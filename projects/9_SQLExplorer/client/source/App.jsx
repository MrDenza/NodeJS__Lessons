import { useCallback, useState } from "react";
import "./App.css";
import Form from "./components/Form";
import Result from "./components/Result";
import { postApi } from "./api/postApi";

const URI_LINK = {
    sendSqlQuery: "/api/sql",
};

function App() {

    const [result, setResult] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const postData = (url, data, callback) => {
        postApi(url, { type: 'query', sqlQuery: data })
        .then((data) => {
            if (data && data.type === 'error') {
                console.error('Ошибка SQL-запроса:', data.error);
            }
            callback(data);
        })
        .catch((err) => {
            console.error(`Ошибка SQL-запроса: ${err.message}`);
            const errBody = err.body ?? { type: 'error', error: err.message };
            callback(errBody);
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    const sendQuery = useCallback((dataQuery) => {
        let callbackFn = (data) => {
            setResult(data);
        };
        setIsLoading(true);
        postData(URI_LINK.sendSqlQuery, dataQuery, callbackFn);
    },[]);

    console.log(result);

    return (
        <div className="container">
            <h1 className="app__title">SQLExplorer</h1>
            <Form sendQuery={sendQuery}/>
            <Result isLoading={isLoading} dataResult={result}/>
        </div>
    );
}

export default App;