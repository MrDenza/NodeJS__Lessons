//import React from "react";
import './Result.css';

function Result(props) {
    const { isLoading, dataResult } = props;

    const renderTable = (columns, rows) => {
        return (
            <table className="app__result-table">
                <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col}>{col}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, i) => (
                    <tr key={i}>
                        {columns.map((col) => (
                            <td key={col}>{row[col]}</td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    if (isLoading) {
        return (
            <div className="app__result-box">
                <div className="animation__dot-pulse">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        );
    }

    if (!dataResult || Object.keys(dataResult).length === 0) {
        return (
            <div className="app__result-box"/>
        );
    }

    return (
        <div className="app__result-box">
                {dataResult.type === 'table' && dataResult.columns && dataResult.rows
                    ? renderTable(dataResult.columns, dataResult.rows)
                    : (dataResult.type === 'modify' && (
                        <div className="app__result-modify">
                            Изменено строк: {dataResult.affectedRows}
                        </div>
                    )) ||
                    (dataResult.type === 'error' && (
                        <div className="app__result-err">
                            {dataResult.error}
                        </div>
                    )) ||
                        <div className="app__result-err">Результат: Неподдерживаемый тип данных!</div>
                }
        </div>
    );
}

export default Result;