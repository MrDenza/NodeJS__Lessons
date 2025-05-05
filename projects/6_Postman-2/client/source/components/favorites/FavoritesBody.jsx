import { memo, useEffect } from "react";
import "./FavoritesBody.css";

function FavoritesBody(props) {
    useEffect(() => {
        const container = document.querySelector(".favorite-box__list");
        if (!container) return;

        const handleClick = (e) => {
            const pos = e.target.closest(".favorite-pos");
            if (!pos) return;
            const idPos = pos.getAttribute("data-idpos");
            if (idPos !== null) {
                props.openPosition(idPos);
            }
        };

        container.addEventListener("click", handleClick);
        return () => container.removeEventListener("click", handleClick);
    }, [props, props.dataListHtml]);

    return (
        <div className={"favorite-box"}>
            <span className={"favorite-box__title"}>Избранное:</span>
            {props.isLoading ? (
                <div className="animation__dot-pulse">
                    <span />
                    <span />
                    <span />
                </div>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: props.dataListHtml }} />
            )}
        </div>
    );
}

export default memo(FavoritesBody);
