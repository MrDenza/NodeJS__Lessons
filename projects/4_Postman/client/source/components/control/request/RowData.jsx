import React, { memo } from "react";
import './RowData.css';

function RowData(props) {
    return (
        <tr className={'row-data__box'}>
            <td>
                <label>
                    {props.isOptions ? (
                        <select
                            value={props.name}
                            onChange={e => props.onChange(props.id, 'name', e.target.value, props.isOptions)}
                        >
                            {props.options?.map(opt => (
                                <option
                                    key={opt}
                                    value={opt}
                                    disabled={props.usedOptions.includes(opt) && opt !== props.name}
                                >
                                    {opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={props.name}
                            onChange={e => props.onChange(props.id, 'name', e.target.value)}
                        />
                    )}
                </label>
            </td>
            <td>
                <label>
                    <input
                        type="text"
                        value={props.value}
                        onChange={e => props.onChange(props.id, 'value', e.target.value, props.isOptions)}
                    />
                </label>
            </td>
            <td>
                <button onClick={e => props.onDelete(e, props.id, props.isOptions)}>Удалить</button>
            </td>
        </tr>
    );
}

export default memo(RowData);