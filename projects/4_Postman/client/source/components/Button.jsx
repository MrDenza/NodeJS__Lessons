//import react from 'react';
import { memo } from "react";

function Button (props) {
    return (
        <button onClick={ () => { }}>BTN</button>
    )
}

export default memo(Button);