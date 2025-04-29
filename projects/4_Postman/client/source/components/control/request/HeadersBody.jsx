import RowData from "./RowData";
import "./HeadersBody.css";

const VARIANT = true;

function HeadersBody(props) {

    const allRowData = (props.data || []).map((pos, index) => {
        const keys = Object.keys(pos);
        const keyName = keys.length > 0 ? keys[0] : "";
        const usedOptions = props.data.map((p) => Object.keys(p)[0]).filter((name) => name !== keyName);
        return (
            <RowData
                key={index}
                id={index}
                name={keyName}
                value={pos[keyName]}
                isOptions={VARIANT}
                options={props.headers}
                usedOptions={usedOptions}
                onChange={props.onChange}
                onDelete={props.onDelete}
            />
        );
    });

    return (
        <div className={"head-body__box"}>
            <span className={"head-body__title"}>Заголовки</span>
            <table>
                {props.data?.length > 0 && (
                    <thead>
                        <tr>
                            <th>Заголовок</th>
                            <th>Значение</th>
                            <th></th>
                        </tr>
                    </thead>
                )}
                <tbody>{allRowData}</tbody>
            </table>
            <button onClick={(eo) => props.onAdd(eo, VARIANT)}>Добавить заголовок</button>
        </div>
    );
}

export default HeadersBody;