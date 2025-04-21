import React, { memo, useState } from "react";
import RowData from "./RowData";
import './GetBody.css';

function GetBody (props) {

    const allGetPos = props.data?.map((pos, index) => {
        let keyName = Object.keys(pos)[0];
        return (
            <RowData
                key={index}
                id={index}
                name={keyName}
                value={pos[keyName]}
                onChange={props.onChange}
                onDelete={props.onDelete}
            />
        )
    });

    return (
        <div className={'get-body__box'}>
            <span className={'get-body__title'}>Параметры</span>
            <table>
                {(props.data?.length > 0) && (
                    <thead>
                        <tr>
                            <th>Ключ</th>
                            <th>Значение</th>
                            <th></th>
                        </tr>
                    </thead>
                )}
                <tbody>
                    {allGetPos}
                </tbody>
            </table>
            <button onClick={(eo) => {props.onAdd(eo)}}>Добавить параметр</button>
            <hr/>
        </div>
    );
}

export default memo(GetBody);