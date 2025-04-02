//import react from 'react';

import { memo } from "react";

let getNumWord = (num, word1 = 'голос', word2 = 'голоса', word5 = "голосов") => {
    const dd = num % 100;
    if (dd >= 11 && dd <= 19) return word5;
    const d = num % 10;
    if (d === 1) return word1;
    if (d >= 2 && d <= 4) return word2;
    return word5;
};

function InfoBox (props) {
    return (
        <tr>
            <td>{`${props.id}`}</td>
            <td>{`${props.name}`}</td>
            <td>{`${props.votes} ${getNumWord(props.votes)}`}</td>
        </tr>
    );
};

export default memo(InfoBox);