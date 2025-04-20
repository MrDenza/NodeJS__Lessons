import React from "react";
import GetPos from "./GetPos";

function HeadersBody (props) {
    return (
        <div>
            <span>Заголовки</span>
            <table>
                <tbody>
                <GetPos></GetPos>
                </tbody>
            </table>
            <button>Добавить заголовок</button>
        </div>
    );
}

export default HeadersBody;