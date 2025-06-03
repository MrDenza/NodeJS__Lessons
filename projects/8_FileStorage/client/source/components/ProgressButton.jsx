import './ProgressButton.css';
import { memo } from "react";

function ProgressButton({ isLoading, progress, children, ...props }) {
    return (
        <button {...props} disabled={isLoading} style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Прогресс-бар */}
            {isLoading && (
                <div className={'btn_progress-fill'} style={{width: `${progress}%`}}/>
            )}
            {/* Текст кнопки */}
            <span style={{ position: 'relative', zIndex: 1 }}>
                {isLoading ? 'Загрузка...' : children}
            </span>
        </button>
    );
}

export default memo(ProgressButton);