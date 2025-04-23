import React from "react";
import './FavoritePos.css';

const DB_CLASSNAME_FOR_METHOD = {
    'GET': {classN: 'favorite-pos_get'},
    "POST": {classN: 'favorite-pos_post'}
}

function classNameForMethod (method) {
    return DB_CLASSNAME_FOR_METHOD[method]?.classN || '';
}

function FavoritePos (props) {

    const method = props.method?.toUpperCase();

    return (
        <div className={`favorite-pos ${classNameForMethod(method)}`} onClick={() => {props.openPosition(props.idPos)}}>
            <span className={'favorite-pos_text-bold'}>Метод: {method}</span>
            <span>{props.url}</span>
        </div>
    );
}

export default FavoritePos;