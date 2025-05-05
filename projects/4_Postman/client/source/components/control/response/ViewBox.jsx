import { memo, useState } from "react";
import "./ViewBox.css";

function downloadBlob(data, fileName) {
    const link = document.createElement("a");
    link.href = data;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

function ViewBox(props) {
    const [expanded, setExpanded] = useState(false);
    if (props.isLoading) {
        return (
            <div className={"view-box__body"}>
                <h3 className={"view-box__title"}>Ответ на запрос</h3>
                <div className="animation__dot-pulse">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        );
    }

    if (!props.dataRes || Object.keys(props.dataRes).length === 0) {
        return null;
    }

    const renderContent = () => {
        const contentType = props.dataRes.headers["content-type"] || "";

        if (contentType.startsWith("application/json")) {
            try {
                return <pre className={"view-box__preview-json"}>{JSON.stringify(props.dataRes.body, null, 2)}</pre>;
            } catch {
                return null;
            }
        }

        if (contentType.startsWith("text/html")) {
            return (
                <iframe
                    srcDoc={props.dataRes.body}
                    title="HTML Preview"
                    sandbox="allow-scripts"
                    className={"view-box__preview-iframe"}
                />
            );
        }

        if (contentType.startsWith("text/plain")) {
            return <pre className={"view-box__preview-text"}>{props.dataRes.body}</pre>;
        }

        if (props.dataRes.body.match(/^[A-Za-z0-9+/=]+$/)) {
            const mediaType = contentType.split(";")[0];

            return (
                <div className={"view-box__preview-binary"}>
                    <span className={"view-box__preview-bin-text"}>Бинарные данные ({mediaType})</span>

                    {mediaType.startsWith("image/") ? (
                        <img
                            src={`data:${mediaType};base64,${props.dataRes.body}`}
                            alt="Preview"
                            className="view-box__preview-img"
                        />
                    ) : mediaType.startsWith("audio/") ? (
                        <audio
                            controls
                            className={"view-box__preview-audio"}
                        >
                            <source src={`data:${mediaType};base64,${props.dataRes.body}`} />
                        </audio>
                    ) : mediaType.startsWith("video/") ? (
                        <video
                            controls
                            className={"view-box__preview-video"}
                        >
                            <source src={`data:${mediaType};base64,${props.dataRes.body}`} />
                        </video>
                    ) : (
                        <div className={"view-box__preview-other"}>
                            <div className={"view-box__preview-box-btn"}>
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className={"view-box__preview-btn"}
                                >
                                    {expanded ? "Скрыть base64" : "Показать base64"}
                                </button>
                                <button
                                    onClick={() =>
                                        // downloadBlob(
                                        //     `data:${mediaType};base64,${props.dataRes.body}`,
                                        //     `file.${mediaType.split("/")[1] || "bin"}`
                                        // )
                                        downloadBlob(
                                            `data:${mediaType};base64,${props.dataRes.body}`,
                                            `file.${"bin"}`
                                        )
                                    }
                                    className={"view-box__preview-btn"}
                                >
                                    Скачать файл
                                </button>
                            </div>
                            {expanded && (
                                <textarea
                                    readOnly
                                    value={props.dataRes.body}
                                    className={"view-box__preview-textarea"}
                                />
                            )}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const redirectList = props.dataRes.redirects?.map((obj, i) => {
        return (
            <div
                key={i}
                className={"view-box__redirect-pos"}
            >
                <span>
                    <b>Redirect №{i + 1}:</b>
                </span>
                <span>
                    <b>URL запроса:</b> {obj.startUrl}
                </span>
                <span>
                    <b>Статус ответа:</b> {obj.status}
                </span>
                <span>
                    <b>Location:</b> {obj.location}
                </span>
                <hr />
            </div>
        );
    });

    const headersList = Object.keys(props.dataRes?.headers).map((key, i) => {
        return (
            <li key={i}>
                <b>{key}</b>: {props.dataRes.headers[key]}
            </li>
        );
    });

    return (
        <div className={"view-box__body"}>
            <h3 className={"view-box__title"}>Ответ на запрос</h3>

            {props.dataRes.redirects?.length > 0 && <div className={"view-box__redirect-container"}>{redirectList}</div>}

            <div className={"view-box__res-container"}>
                <span>
                    <b>URL запроса:</b> {props.dataRes?.finalUrl}
                </span>
                <span>
                    <b>Статус ответа:</b> {props.dataRes?.status}
                </span>

                <span>
                    <b>Заголовки ответа:</b>
                </span>
                <ul className={"view-box__list"}>{headersList}</ul>

                <span>
                    <b>Тело ответа:</b>
                </span>
                <div className={"view-box__res-body"}>
                    {typeof props.dataRes?.body === "string" ? props.dataRes?.body : JSON.stringify(props.dataRes?.body)}
                </div>

                <span>
                    <b>Превью ответа:</b>
                </span>
                <div className={"view-box__res-preview"}>{renderContent()}</div>
            </div>
        </div>
    );
}

export default memo(ViewBox);