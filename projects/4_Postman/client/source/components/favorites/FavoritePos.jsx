import "./FavoritePos.css";

const DB_CLASSNAME_FOR_METHOD = {
    GET: { classN: "favorite-pos_get" },
    POST: { classN: "favorite-pos_post" },
    PUT: { classN: "favorite-pos_put" },
    PATCH: { classN: "favorite-pos_patch" },
    DELETE: { classN: "favorite-pos_delete" },
    HEAD: { classN: "favorite-pos_head" },
    OPTIONS: { classN: "favorite-pos_options" },
};

function classNameForMethod(method) {
    return DB_CLASSNAME_FOR_METHOD[method]?.classN || "";
}

function FavoritePos(props) {
    const method = props.method?.toUpperCase();

    return (
        <div
            className={`favorite-pos ${classNameForMethod(method)}`}
            onClick={() => {
                props.openPosition(props.idPos);
            }}
        >
            <span className={"favorite-pos_text-bold"}>Метод: {method}</span>
            <span className={"favorite-pos_ellipsis"}>{props.url}</span>
        </div>
    );
}

export default FavoritePos;