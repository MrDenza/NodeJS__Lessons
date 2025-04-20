import React, { memo, useState } from "react";
import GetPos from "./GetPos";
import './GetBody.css';

const DB_PARAMS = [
    {key: 1},
    {aga: 2},
    {privet: "test"},
];

function GetBody (props) {

    const [dataKeyValue, setDataKeyValue] = useState(DB_PARAMS);

    const addPos = (eo) => {
        eo.preventDefault();
        setDataKeyValue( [...dataKeyValue, {}]);
    };

    const allGetPos = dataKeyValue.map((pos, index) => {
        return <GetPos key={index}/>
    });

    return (
        <div className={'get-body__box'}>
            <span className={'get-body__title'}>Параметры</span>
            <table className={'get-body__table'}>
                {(dataKeyValue.length > 0) && (
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
            <button onClick={(eo) => {addPos(eo)}}>Добавить параметр</button>
        </div>
    );
}

export default memo(GetBody);