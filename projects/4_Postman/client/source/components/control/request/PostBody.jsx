import React, { memo } from "react";
import './PostBody.css';

function PostBody (props) {

    return (
        <div className={'post-body__box'}>
            <span className={'post-body__title'}>Тело запроса:</span>
            <textarea className={'post-body__textarea'} value={props.body} onChange={(eo) => props.onChange(eo.target.value)} placeholder={'Тело запроса должно быть в формате JSON'}></textarea>
        </div>
    );
}

export default memo(PostBody);