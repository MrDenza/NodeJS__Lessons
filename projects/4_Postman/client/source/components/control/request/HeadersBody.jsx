import React from "react";
import RowData from "./RowData";
import './HeadersBody.css';



const VARIANT = true;

function HeadersBody(props) {

    const allRowData = props.data?.map((pos, index) => {
        let keyName = Object.keys(pos)[0];

        const usedOptions = props.data.map(p => Object.keys(p)[0]).filter(name => name !== keyName);

        return (
            <RowData
                key={index}
                id={index}
                name={keyName}
                value={pos[keyName]}
                isOptions={VARIANT}
                options={props.headers}
                usedOptions={usedOptions}
                onChange={props.onChange}
                onDelete={props.onDelete}
            />
        );
    });

    return (
        <div className={'head-body__box'}>
            <span className={'head-body__title'}>Заголовки</span>
            <table>
                {(props.data?.length > 0) && (
                    <thead>
                    <tr>
                        <th>Заголовок</th>
                        <th>Значение</th>
                        <th></th>
                    </tr>
                    </thead>
                )}
                <tbody>{allRowData}</tbody>
            </table>
            <button onClick={eo => props.onAdd(eo, VARIANT)}>Добавить заголовок</button>
            <hr />
        </div>
    );
}

export default HeadersBody;