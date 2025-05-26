//import React from "react";
import './Form.css';
import { useState } from "react";

function Form (props) {

    const [textValue, setTextValue] = useState('');
    const [errMsg, setErrMsg] = useState('');

    const validateForm = (eo) => {
        eo.preventDefault();
        if (eo.target.query.value) {
            props.sendQuery(eo.target.query.value);
            setErrMsg('');
        } else {
            setErrMsg('Введите SQL-запрос!');
        }
    }

    const updateTextValue = (eo) => {
        setTextValue(eo.target.value);
    }

    return (
        <form onSubmit={(eo) => {validateForm(eo)}} className="app__form-box">
            <textarea id="sql-query" placeholder="Введите SQL-запрос" name="query" className="app__form-query" onChange={(eo) => updateTextValue(eo)} value={textValue}></textarea>
            <span className="app__form-err">{errMsg}</span>
            <button type="submit" className="app__form-btn">Выполнить</button>
        </form>
    );
}

export default Form;