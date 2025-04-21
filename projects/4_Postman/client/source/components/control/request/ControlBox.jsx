import React, { memo, useEffect, useState } from "react";
import './ControlBox.css';
import GetBody from "./GetBody";
import PostBody from "./PostBody";
import HeadersBody from "./HeadersBody";

const METHOD_LIST = [
    '',
    'GET',
    'POST',
];
const HEADERS_LIST = [
    '',
    'Accept',
    'Cookie',
    'Content-Encoding',
    'Content-Language',
    'Content-Type',
];

function ControlBox (props) {

    const [dataReq, setDataReq] = useState(props.dataReq);
    const METHOD_NAME = dataReq.method?.toUpperCase() || '';

    useEffect(() => {
        //console.log(props.dataReq);
        setDataReq(props.dataReq);
    }, [props.dataReq]);
    // ----- FUNC FORM -----
    const submitForm = (eo) => {
        eo.preventDefault();
        console.log('submit');
        props.updateDataReq(dataReq);
    };

    const resetForm = (eo) => {
        eo.preventDefault();
        console.log('reset');
        setDataReq({});
        //props.resetDataReq();
    };

    const saveForm = () => {
        console.log('save');
        console.log(props.dataReq);
        //props.saveDataReq(data);
    };
    // ----- FUNC METHOD -----
    const updateMethod = (eo) => {
        const newMethod = eo.target.value.toLowerCase();
        setDataReq(prevDataReq => {
            const newDataReq = { ...prevDataReq, method: newMethod };
            if (newMethod === 'get') {
                if ('body' in newDataReq) {
                    newDataReq.body = '';
                }
            } else {
                if ('query' in newDataReq) {
                    newDataReq.query = [];
                }
            }
            return newDataReq;
        });
    };
    // ----- FUNC URL -----
    const updateUrl = (eo) => {
        setDataReq({...dataReq, ...{url: eo.target.value}});
    };
    // ----- FUNC QUERY/HEADERS -----
    const handleChangeUniversal = (id, field, newValue, isOptions) => {
        const key = isOptions ? 'headers' : 'query';
        console.log(`Изменяем ${key}, поле - ${field}, у id - ${id}, на - ${newValue}`);

        setDataReq(prevDataReq => {
            const newArray = [...prevDataReq[key]];
            const oldObj = { ...newArray[id] };
            const newObj = { ...oldObj };

            if (field === 'name') {
                const oldKey = Object.keys(oldObj)[0];
                newObj[newValue] = oldObj[oldKey];
                delete newObj[oldKey];
            } else if (field === 'value') {
                const currentKey = Object.keys(oldObj)[0];
                newObj[currentKey] = newValue;
            }

            newArray[id] = newObj;
            return { ...prevDataReq, [key]: newArray };
        });
    };

    const handleDeleteUniversal = (eo, id, isOptions) => {
        eo.preventDefault();
        const key = isOptions ? 'headers' : 'query';
        console.log(`Удалён элемент из ${key} с id: ${id + 1}`);

        setDataReq(prevDataReq => ({
            ...prevDataReq,
            [key]: prevDataReq[key].filter((_, index) => index !== id)
        }));
    };

    const handleAddUniversal = (eo, isOptions) => {
        eo.preventDefault();
        const key = isOptions ? 'headers' : 'query';
        console.log(`Добавлен новый элемент в ${key}`);

        setDataReq(prevDataReq => {
            const prevArray = Array.isArray(prevDataReq[key]) ? prevDataReq[key] : [];
            return {
                ...prevDataReq,
                [key]: [...prevArray, { '': '' }]
            };
        });
    };
    // ----- FUNC BODY -----
    const handleChangeBody = (newValue) => {
        setDataReq(prevDataReq => (
            {...prevDataReq, body: newValue}
        ));
    };
    // ----- FUNC OTHER -----
    const optionList = METHOD_LIST.map((pos, index) => {
        return <option key={index} value={pos}>{pos}</option>
    });

    console.log(dataReq);
    return (
        <form id={'formReq'} onSubmit={submitForm} onReset={resetForm} className={'control-box__form'}>
            <table className={'control-box__table'}>
                <thead>
                    <tr>
                        <th className={'control-box__table-method'}><label htmlFor={'method'}>Метод</label></th>
                        <th className={'control-box__table-url'}><label htmlFor={'url'}>URL</label></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <select id={'method'} className={'table-method__input'} value={METHOD_NAME} onChange={updateMethod}>
                                {optionList}
                            </select>
                        </td>
                        <td>
                            <input type={"text"} id={'url'} className={'table-url__input'} value={dataReq?.url || ''} onChange={updateUrl}/>
                        </td>
                    </tr>
                </tbody>
            </table>
            <hr/>
            {(METHOD_NAME === 'GET') && (<GetBody data={dataReq?.query} onChange={handleChangeUniversal} onDelete={handleDeleteUniversal} onAdd={handleAddUniversal}/>)}
            {(METHOD_NAME === 'POST') && (<PostBody body={dataReq?.body} onChange={handleChangeBody}/>)}
            {(METHOD_NAME) && (<HeadersBody data={dataReq?.headers} headers={HEADERS_LIST} onChange={handleChangeUniversal} onDelete={handleDeleteUniversal} onAdd={handleAddUniversal}/>)}
            <div className={'control-box__btn'}>
                <button type={'button'} onClick={saveForm}>Сохранить запрос</button>
                <button type={'submit'}>Отправить запрос</button>
                <button type={'reset'}>Сбросить форму</button>
            </div>
        </form>
    );
}

export default memo(ControlBox);