import React, { memo } from "react";
import './ControlBox.css';
import GetBody from "./GetBody";
import PostBody from "./PostBody";
import HeadersBody from "./HeadersBody";

const METHOD_LIST = ['GET', 'POST'];

function ControlBox (props) {

    //props.dataReq
    //props.updateDataReq
    //props.resetDataReq
    //props.saveDataReq
    const METHOD_NAME = props.dataReq.method?.toUpperCase();

    const submitForm = (eo) => {
        eo.preventDefault();
        console.log('submit');

    };

    const resetForm = (eo) => {
        eo.preventDefault();
        console.log('reset');
        props.resetDataReq();
    };

    const saveForm = () => {
        console.log('save');
        console.log(props.dataReq);
        //props.saveDataReq(data);
    };


    
    const updateMethod = (eo) => {
        props.updateDataReq({method: eo.target.value});
        //console.log(eo.target.value);
    }

    const updateUrl = (eo) => {
        console.log(eo.target.value);
        //props.updateDataReq({url: eo.target.value});
    }

    const optionList = METHOD_LIST.map((pos, index) => {
        return <option key={index} value={pos}>{pos}</option>
    });

    console.log(props.dataReq);
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
                            <input type={"text"} id={'url'} className={'table-url__input'} value={props.dataReq.url} onChange={updateUrl}/>
                        </td>
                    </tr>
                </tbody>
            </table>
            <hr/>
            {(METHOD_NAME === 'GET') && (<GetBody/>)}
            {(METHOD_NAME === 'POST') && (<PostBody/>)}
            {/*<HeadersBody/>*/}
            <hr/>
            <div className={'control-box__btn'}>
                <button type={'button'} onClick={saveForm}>Сохранить запрос</button>
                <button type={'submit'}>Отправить запрос</button>
                <button type={'reset'}>Сбросить форму</button>
            </div>
        </form>
    );
}

export default memo(ControlBox);