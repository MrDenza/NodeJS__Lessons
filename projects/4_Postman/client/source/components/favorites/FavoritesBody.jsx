import React, { memo } from "react";
import FavoritePos from "./FavoritePos";
import "./FavoritesBody.css";

const DB_FAVORITE = [
    {
        method: "get",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "post",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "gets",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "get",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "post",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "gets",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "get",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "post",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "gets",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "get",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "post",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "gets",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "get",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "post",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "gets",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "get",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "post",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },
    {
        method: "gets",
        url: "http:/",
        body: {"key": "test"},
        headers: {"Content-Type": "application/json"}
    },



];

function FavoritesBody (props) {

    const favoritesPos = DB_FAVORITE.map((pos, index) => {
        return <FavoritePos key={index} idPos={index} method={pos.method} url={pos.url} />;
    });

    return (
        <div className={"favorite-box"}>
            <span className={"favorite-box__title"}>Избранное:</span>
            <div className={"favorite-box__list"}>{favoritesPos}</div>
        </div>
    );
}

export default memo(FavoritesBody);