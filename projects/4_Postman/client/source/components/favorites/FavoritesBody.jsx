import React, { memo } from "react";
import FavoritePos from "./FavoritePos";
import "./FavoritesBody.css";

function FavoritesBody (props) {

    const dataList = (Array.isArray(props.dataList)) ? props.dataList : [];
    const favoritesPos = dataList.map((pos, index) => {
        return <FavoritePos key={index} idPos={index} method={pos.method} url={pos.url} openPosition={props.openPosition}/>;
    });

    return (
        <div className={"favorite-box"}>
            <span className={"favorite-box__title"}>Избранное:</span>
            <div className={"favorite-box__list"}>{favoritesPos}</div>
        </div>
    );
}

export default memo(FavoritesBody);