import { Fragment, memo, useEffect, useState } from "react";
import "./ControlBox.css";
import GetBody from "./GetBody";
import PostBody from "./PostBody";
import HeadersBody from "./HeadersBody";

const METHOD_LIST = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const METHOD_FOR_QUERY = ["GET", "DELETE", "HEAD", "OPTIONS"];
const METHOD_FOR_BODY = ["POST", "PUT", "PATCH"];
const HEADERS_LIST = [
    "Accept",
    "Accept-Charset",
    "Accept-Encoding",
    "Accept-Language",
    "Authorization",
    "Cookie",
    "Content-Disposition",
    "Content-Encoding",
    "Content-Language",
    "Content-Length",
    "Content-MD5",
    "Content-Range",
    "Content-Type",
    "Content-Version",
    "Derived-From",
    "Expect",
    "Form",
    "Host",
    "Link",
    "Max-Forwards",
    "Proxy-Authorization",
    "Range",
    "Referer",
    "Title",
    "TE",
];
const BLANK_DATA_REQ = {
    method: "",
    url: "",
    query: [],
    body: "",
    headers: [],
};
const ERRORS_MSG_LIST = {
    method: {
        nullField: "Выберите метод запроса!",
        noValidMethod: "Выбранный метод не доступен!",
    },
    url: {
        nullField: "Введите URL запроса!",
        noValidUrl: "Некорректный формат URL!",
        noParamsAllowed: "URL не должен содержать параметры запроса",
    },
    query: {
        errTypeValue: 'Ошибка значений параметров! Удалите все пары "ключ-значение" и пересоздайте снова.',
        nullField: 'Есть незаполненные поля! Заполните или удалите незаполненные пары "ключ-значение".',
        duplicateKey: 'Нельзя использовать несколько пар "ключ-значение" с одинаковыми ключами!',
    },
    body: {
        noContentType: "Content-Type не указан в заголовках!",
        invalidType: "Неподдерживаемый Content-Type!",
        noValidBody: "Тело запроса не соответствует Content-Type!",
        noCorrectBody: "Некорректный формат тела!",
    },
    headers: {
        errTypeValue: 'Ошибка значений заголовков! Удалите все пары "заголовок-значение" и пересоздайте снова.',
        nullField: 'Есть незаполненные поля! Заполните или удалите незаполненные пары "заголовок-значение".',
        noValidHeader: "Есть некорректные заголовки! Выберите заголовки из доступного списка.",
        duplicateKey: 'Нельзя использовать несколько пар "заголовок-значение" с одинаковыми заголовками!',
    },
};

const validators = {
    method: (value) => {
        if (!value) return ERRORS_MSG_LIST.method.nullField;
        if (!METHOD_LIST.includes(value.toUpperCase())) {
            return ERRORS_MSG_LIST.method.noValidMethod;
        }

        return false;
    },
    url: (value) => {
        if (!value) return ERRORS_MSG_LIST.url.nullField;

        if (URL.canParse) {
            // для современных браузеров
            return URL.canParse(value) ? false : ERRORS_MSG_LIST.url.noValidUrl;
        }

        try {
            new URL(value);
        } catch {
            return ERRORS_MSG_LIST.url.noValidUrl;
        }
        // проверка на отсутствие параметров в url
        // if (urlObj.search && urlObj.search !== '') {
        //     return ERRORS_MSG_LIST.url.noParamsAllowed;
        // }

        return false;
    },
    query: (value) => {
        const isValidStructure = Array.isArray(value) && value.every((obj) => typeof obj === "object" && Object.keys(obj).length === 1);
        if (!isValidStructure) return ERRORS_MSG_LIST.query.errTypeValue;

        const keys = value.map((obj) => Object.keys(obj)[0]);
        const hasDuplicates = keys.length !== new Set(keys).size;
        if (hasDuplicates) return ERRORS_MSG_LIST.query.duplicateKey;

        const hasEmptyFields = value.some((obj) => Object.entries(obj).some(([k, v]) => !k.trim() || !v.toString().trim()));
        if (hasEmptyFields) return ERRORS_MSG_LIST.query.nullField;

        return false;
    },
    body: (value, contentType) => {
        if (!contentType) return ERRORS_MSG_LIST.body.noContentType;

        if (value === undefined || value === null) {
            return ERRORS_MSG_LIST.body.noValidBody;
        }

        try {
            if (contentType.includes("application/json")) {
                const parsed = typeof value === "string" ? JSON.parse(value) : value;
                if (typeof parsed !== "object" || parsed === null) {
                    return ERRORS_MSG_LIST.body.noCorrectBody;
                }
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
                const params = new URLSearchParams(value);
                if (Array.from(params.entries()).length === 0 && value.trim() !== "") {
                    return ERRORS_MSG_LIST.body.noValidBody;
                }
            } else if (contentType.includes("text/plain")) {
                if (typeof value !== "string") {
                    return ERRORS_MSG_LIST.body.noValidBody;
                }
            } else {
                return ERRORS_MSG_LIST.body.invalidType;
            }
            return false;
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            return ERRORS_MSG_LIST.body.noValidBody;
        }
    },
    headers: (value) => {
        const isValidStructure = Array.isArray(value) && value.every((obj) => typeof obj === "object" && Object.keys(obj).length === 1);
        if (!isValidStructure) return ERRORS_MSG_LIST.headers.errTypeValue;

        const keys = value.map((obj) => Object.keys(obj)[0]);
        const hasDuplicates = keys.length !== new Set(keys).size;
        if (hasDuplicates) return ERRORS_MSG_LIST.headers.duplicateKey;

        for (const obj of value) {
            const [[key, val]] = Object.entries(obj);

            if (!key.trim()) return ERRORS_MSG_LIST.headers.nullField;
            if (!HEADERS_LIST.includes(key)) return ERRORS_MSG_LIST.headers.noValidHeader;
            if (!val.toString().trim()) return ERRORS_MSG_LIST.headers.nullField;
        }

        return false;
    },
};

function isEmptyObject(obj) {
    return (
        !obj || // null/undefined
        typeof obj !== "object" || // не объект
        Array.isArray(obj) || // массив
        Object.keys(obj).length === 0 // пустой объект
    );
}

function ControlBox(props) {
    const [dataReq, setDataReq] = useState(BLANK_DATA_REQ);
    const [errsDaraReq, setErrsDaraReq] = useState({});
    const METHOD_NAME = dataReq.method?.toUpperCase() || "";

    // ----- SYNC GET NEW PROPS -----
    useEffect(() => {
        if (!isEmptyObject(props.dataReq)) {
            setDataReq(props.dataReq);
            setErrsDaraReq({});
        }
    }, [props.dataReq]);
    // ----- FUNC VALIDATE -----
    const validate = (dataObj) => {
        let objErrors = {};

        let contentType = null;
        if (Array.isArray(dataObj.headers)) {
            const contentTypeHeader = dataObj.headers.find((h) => Object.keys(h).some((k) => k.toLowerCase() === "content-type"));
            if (contentTypeHeader) {
                const key = Object.keys(contentTypeHeader).find((k) => k.toLowerCase() === "content-type");
                contentType = contentTypeHeader[key];
            }
        }

        const method = typeof dataObj.method === "string" ? dataObj.method.toUpperCase() : "";

        for (let key in dataObj) {
            if (key === "body") {
                if (METHOD_FOR_BODY.includes(method)) {
                    let errorsElem = validators.body(dataObj[key], contentType);
                    if (errorsElem) objErrors[key] = errorsElem;
                }
            } else {
                let errorsElem = validators[key](dataObj[key]);
                if (errorsElem) objErrors[key] = errorsElem;
            }
        }

        setErrsDaraReq(objErrors);
        return !Object.keys(objErrors).length;
    };
    // ----- FUNC FORM -----
    const submitForm = (eo) => {
        eo.preventDefault();
        props.resetDataRes(true);
        let isValid = validate(dataReq);
        if (isValid) return props.sendDataReq(dataReq);
    };

    const resetForm = (eo) => {
        eo.preventDefault();
        setDataReq(BLANK_DATA_REQ);
        setErrsDaraReq({});
        props.resetDataRes(true);
    };

    const saveForm = () => {
        let isValid = validate(dataReq);
        if (isValid) return props.saveDataReq(dataReq);
    };
    // ----- FUNC METHOD -----
    const updateMethod = (eo) => {
        const newMethod = typeof eo.target.value === "string" ? eo.target.value.toUpperCase() : "";
        setDataReq((prevDataReq) => {
            let newDataReq = { ...prevDataReq };
            newDataReq.method = newMethod;
            if (METHOD_FOR_QUERY.includes(newMethod)) {
                if ("body" in newDataReq) {
                    newDataReq.body = "";
                }
            } else {
                if ("query" in newDataReq) {
                    newDataReq.query = [];
                }
            }
            return newDataReq;
        });
        props.resetDataRes(true);
        setErrsDaraReq({});
    };
    // ----- FUNC URL -----
    const updateUrl = (eo) => {
        const newVal = typeof eo.target.value === "string" ? eo.target.value.trim() : "";
        setDataReq((prevDataReq) => {
            if (prevDataReq.url === newVal) return prevDataReq;
            else return { ...prevDataReq, url: newVal };
        });
    };
    // ----- FUNC QUERY/HEADERS -----
    const handleChangeUniversal = (id, field, newValue, isOptions) => {
        const key = isOptions ? "headers" : "query";
        const newVal = typeof newValue === "string" ? newValue.trim() : "";

        setDataReq((prevDataReq) => {
            const newArray = JSON.parse(JSON.stringify(prevDataReq[key]));
            const oldObj = JSON.parse(JSON.stringify(newArray[id])); // {key: 1}
            const oldKey = Object.keys(oldObj)[0]; // key

            if (field === "name") {
                if (oldKey === newVal) return prevDataReq;
                const oldValue = oldObj[oldKey];
                delete oldObj[oldKey];
                oldObj[newVal] = oldValue;
            } else if (field === "value") {
                if (oldObj[oldKey] === newVal) return prevDataReq;
                oldObj[oldKey] = newVal;
            }
            newArray[id] = oldObj;
            return { ...prevDataReq, [key]: newArray };
        });
    };

    const handleDeleteUniversal = (eo, id, isOptions) => {
        eo.preventDefault();
        const key = isOptions ? "headers" : "query";

        setDataReq((prevDataReq) => {
            const deepCopy = JSON.parse(JSON.stringify(prevDataReq));
            deepCopy[key] = deepCopy[key].filter((_, index) => index !== id);
            return deepCopy;
        });
    };

    const handleAddUniversal = (eo, isOptions) => {
        eo.preventDefault();
        const key = isOptions ? "headers" : "query";

        setDataReq((prevDataReq) => ({
            ...prevDataReq,
            [key]: [...(Array.isArray(prevDataReq[key]) ? prevDataReq[key] : []), { "": "" }],
        }));
    };
    // ----- FUNC BODY -----
    const handleChangeBody = (newValue) => {
        const newVal = typeof newValue === "string" ? newValue.trim() : "";
        setDataReq((prevDataReq) => {
            if (prevDataReq.body === newVal) return prevDataReq;
            else return { ...prevDataReq, body: newVal };
        });
    };
    // ----- FUNC OTHER -----
    const optionList = METHOD_LIST.map((pos, index) => {
        return (
            <option
                key={index}
                value={pos}
            >
                {pos}
            </option>
        );
    });

    return (
        <form
            id={"formReq"}
            onSubmit={submitForm}
            onReset={resetForm}
            className={"control-box__form"}
        >
            <table className={"control-box__table"}>
                <thead>
                    <tr>
                        <th className={"control-box__table-method"}>
                            <label htmlFor={"method"}>Метод</label>
                        </th>
                        <th className={"control-box__table-url"}>
                            <label htmlFor={"url"}>URL</label>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <select
                                id={"method"}
                                className={"table-method__input"}
                                value={METHOD_NAME}
                                onChange={updateMethod}
                            >
                                <option
                                    key={"100"}
                                    value={""}
                                    disabled={true}
                                >
                                    Выберите метод:
                                </option>
                                {optionList}
                            </select>
                        </td>
                        <td>
                            <input
                                type={"text"}
                                id={"url"}
                                className={"table-url__input"}
                                value={dataReq?.url || ""}
                                onChange={updateUrl}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className={"control-box_text-err"}>{errsDaraReq?.method}</div>
            <div className={"control-box_text-err"}>{errsDaraReq?.url}</div>
            <hr />

            {METHOD_FOR_QUERY.includes(METHOD_NAME) && (
                <Fragment>
                    <GetBody
                        data={dataReq?.query}
                        onChange={handleChangeUniversal}
                        onDelete={handleDeleteUniversal}
                        onAdd={handleAddUniversal}
                    />
                    <div className={"control-box_text-err"}>{errsDaraReq?.query}</div>
                </Fragment>
            )}
            {METHOD_FOR_BODY.includes(METHOD_NAME) && (
                <Fragment>
                    <PostBody
                        body={dataReq?.body}
                        onChange={handleChangeBody}
                    />
                    <div className={"control-box_text-err"}>{errsDaraReq?.body}</div>
                </Fragment>
            )}
            {METHOD_NAME && <hr />}

            {METHOD_NAME && (
                <Fragment>
                    <HeadersBody
                        data={dataReq?.headers}
                        headers={HEADERS_LIST}
                        onChange={handleChangeUniversal}
                        onDelete={handleDeleteUniversal}
                        onAdd={handleAddUniversal}
                    />
                    <div className={"control-box_text-err"}>{errsDaraReq?.headers}</div>
                </Fragment>
            )}
            {METHOD_NAME && <hr />}

            <div className={"control-box__btn"}>
                <button
                    type={"button"}
                    onClick={saveForm}
                >
                    Сохранить запрос
                </button>
                <button type={"submit"}>Отправить запрос</button>
                <button type={"reset"}>Сбросить форму</button>
            </div>
        </form>
    );
}

export default memo(ControlBox);
