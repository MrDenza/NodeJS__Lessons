import { memo } from "react";
import './FileItem.css';

const formatSize = (size) => {
    if (size < 1024) return size + ' Б';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' КБ';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' МБ';
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' ГБ';
};

function FileItem ({ file, handleDownload }) {
    const { fileName, fileSize, fileDateAdded, fileComment } = file;
    const formattedDate = new Date(fileDateAdded).toLocaleString();

    return (
        <div className="app__file-item">
            <div className="app__file-item-box">
                <div>
                    <img
                        src="/file-icon.png"
                        alt={`Скачать файл ${fileName}`}
                        tabIndex={0}
                        role="button"
                        className="app__file-item-img"
                        onClick={() => handleDownload(fileName)}
                    />
                    <span className="app__file-info-size">{formatSize(fileSize)}</span>
                </div>

                <div className="app__file-info-box">
                    <span className="app__file-info-name">{fileName}</span>
                    <span>{formattedDate}</span>
                </div>
            </div>
            <div className="app__file-comment"><b>Комментарий: </b>{fileComment}</div>
        </div>
    );
}

export default memo(FileItem);