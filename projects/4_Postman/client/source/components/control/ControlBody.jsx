import React, { memo } from "react";
import "./ControlBody.css";
import ControlBox from "./request/ControlBox";
import ViewBox from "./response/ViewBox";



function ControlBody (props) {
    return (
        <div className='control-box'>
            <ControlBox dataReq={props.dataReq} updateDataReq={props.updateDataReq} resetDataReq={props.resetDataReq} saveDataReq={props.saveDataReq}/>
            <ViewBox dataRes={props.dataRes}/>
        </div>
    );
}

export default memo(ControlBody);