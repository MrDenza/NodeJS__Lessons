import React, { memo } from "react";

function PostBody (props) {
    return (
        <div>
            <span>Тело запроса:</span>
            <textarea></textarea>
        </div>
    );
}

export default memo(PostBody);