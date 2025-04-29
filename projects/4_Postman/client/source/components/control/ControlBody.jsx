import { memo } from "react";
import "./ControlBody.css";
import ControlBox from "./request/ControlBox";
import ViewBox from "./response/ViewBox";

function ControlBody(props) {
    return (
        <div className="control-box">
            <ControlBox
                dataReq={props.dataReq}
                sendDataReq={props.sendDataReq}
                saveDataReq={props.saveDataReq}
                resetDataRes={props.resetDataRes}
            />
            <ViewBox
                dataRes={props.dataRes}
                isLoading={props.isLoading}
            />
        </div>
    );
}

export default memo(ControlBody);
