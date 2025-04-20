import React from "react";
import './GetPos.css';

function GetPos (props) {
    return (
        <tr className={'get-pos__box'}>
            <td>
                <label>
                    <input type={"text"} id={''}/>
                </label>
            </td>
            <td>
                <label>
                    <input type={"text"} />
                </label>
            </td>
            <td>
                <button>Удалить</button>
            </td>
        </tr>
    );
}

export default GetPos;