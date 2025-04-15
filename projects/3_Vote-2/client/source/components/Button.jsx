//import react from 'react';
import { memo } from "react";

function Button (props) {
    return (
        <button onClick={ () => { props.func(props.info) } } style={{fontWeight: props.selectType ? 'bold' : ''}}>{props.name}</button>
    )
}

export default memo(Button);