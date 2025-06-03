import { memo, useCallback, useMemo } from "react";
import './FilesList.css';
import FileItem from "./FileItem";

function FilesList ({ fileList, downloadFile }) {

    const handleDownload = useCallback((fileName) => {
        downloadFile(fileName);
    }, [downloadFile]);

    const sortedFileList = useMemo(() => {
        return [...fileList].sort((a, b) => new Date(b.fileDateAdded) - new Date(a.fileDateAdded));
    }, [fileList]);

    return (
        <div className={"app__file-list-box"}>
            {sortedFileList.map(file => (
                <FileItem key={file.fileName} file={file} handleDownload={handleDownload} />
            ))}
        </div>
    );
}
export default memo(FilesList);