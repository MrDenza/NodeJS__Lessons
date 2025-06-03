import './Form.css';
import { memo, useState } from "react";
import ProgressButton from "./ProgressButton";

function Form ({sendForm, progress, isLoading}) {

    const [errMsgFile, setErrMsgFile] = useState('');
    const [errMsgComment, setErrMsgComment] = useState('');

    const validateForm = (eo) => {
        eo.preventDefault();

        const form = eo.target;
        const { files } = eo.target.elements.file;
        const commentValue = eo.target.elements.comment.value;

        const fileError = files.length === 0 ? 'Файл не выбран!' : '';
        const commentError = commentValue.length > 100 ? 'Максимальная длина 100 символов!' : '';

        setErrMsgFile(fileError);
        setErrMsgComment(commentError);

        if (!fileError && !commentError) {
            sendForm(form);
        }
    }

    return (
        <form onSubmit={validateForm} className="app__form-box">
            <label htmlFor={"i-file"} title={"Выбор файла"} className={"app__form-title-file"}>Выберите файл:</label>
                <input id={"i-file"} type={"file"} name={'file'} className={"app__form-btn-file"}></input>

            <span className="app__form-text-err">{errMsgFile}</span>

            <label htmlFor={"i-text"} title={"Комментарии к файлу"} className={"app__form-title-text"}>Введите комментарий:</label>
                <input id={"i-text"} type={"text"} placeholder={"*При необходимости*"} name={'comment'} className={"app__form-input-text"}></input>
            <span className="app__form-text-err">{errMsgComment}</span>

            <ProgressButton type="submit" className="app__form-btn-send" isLoading={isLoading} progress={progress}>Загрузить</ProgressButton>
        </form>
    );
}

export default memo(Form);