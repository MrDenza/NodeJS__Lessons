//import react from 'react';
import { memo } from "react";

function Button (props) {
    return (
        <button onClick={ () => { props.sendVote(props.id) } }>{props.name}</button>
    )
}

export default memo(Button);