import React, { memo } from "react";
import './ViewBox.css';

function ViewBox (props) {
    const blobUrl = '';
    console.log(props.dataRes);

    return (
        <div>
            {blobUrl && <img src={`data:image/png;base64,${blobUrl}`} alt={''}/>}
            {String(props.dataRes)}
        </div>
    );
}

export default memo(ViewBox);