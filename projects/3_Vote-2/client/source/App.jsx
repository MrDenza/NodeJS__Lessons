//import React from “react”;
import "./App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getApi } from "./api/getApi";
import { postApi } from "./api/postApi";
import Button from "./components/Button";
import InfoBox from "./components/InfoBox";

const URI_LINK = {
	stat: '/stat',
	variants: '/variants',
	vote: '/vote',
	download: '/download',
}

const MIME_TYPE = {
	XML: {name: 'XML', mimeType: 'application/xml'},
	HTML: {name: 'HTML', mimeType: 'text/html'},
	JSON: {name: 'JSON', mimeType: 'application/json'},
};

function downloadBlob(data, fileName) {
	const link = document.createElement("a");
	link.href = URL.createObjectURL(new Blob([data]));
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(link.href);
}

function App() {

	const [voteOptions, setVoteOptions] = useState([]);
	const [voteStat, setVoteStat] = useState([]);
	const [mimeType, setMimeType] = useState(MIME_TYPE.JSON);

	const getInfo = (uri) => {
		getApi(uri).then(r => setVoteOptions(r));
	}

	const postInfo = (uri, body)=> {
		postApi(uri, body).then(r => setVoteStat(JSON.parse(r)));
	}

	const sendVote = useCallback((id) => {
		postApi(URI_LINK.vote, {idVote: id}).then(() => postInfo(URI_LINK.stat));
	}, []);

	const downloadFile = useCallback(() => {
		postApi(URI_LINK.download, undefined, mimeType?.mimeType).then(r => downloadBlob(r,`file.${mimeType?.name.toLowerCase()}`));
	}, [mimeType]);

	const setDownloadType = (type) => {
		setMimeType(MIME_TYPE[type]);
	};

	useEffect( () => {
		// componentDidMount
		getInfo(URI_LINK.variants);
		postInfo(URI_LINK.stat);
		return () => {
			// componentWillUnmount
		}
	}, []);

	const findNameById = useCallback((id) => {
		return voteOptions?.find((elem) => elem.id === id)?.name;
	}, [voteOptions]);

	const buttonTypeStat = useMemo(
		() => (
			Object.entries(MIME_TYPE).map(([key, elem]) => (
				<Button
					key={key}
					name={elem.name}
					func={setDownloadType}
					info={elem.name}
					selectType={elem.name === mimeType.name}
				/>
			))
	), [mimeType]);

	const buttonVotes = useMemo(() => (
		voteOptions?.map((elem) => {
			return <Button key={elem.id + 10} name={elem.name} func={sendVote} info={elem.id}/>
		})
	), [sendVote, voteOptions]);

	const voteStatInfo = useMemo(() => (

		voteStat?.map((elem) => {
			let nameById = findNameById(elem.id);
			return <InfoBox key={elem.id + 100} id={elem.id} votes={elem.votes} name={nameById}/>
		})
	), [voteStat, findNameById]);

	return (
		<div className="container">
			<h2>Голосование</h2>
			<div style={{ display: (!voteOptions && !voteStatInfo) ? "block" : "none" }}>Ошибка загрузки данных</div>
			<div className="info-box" style={{ display: (voteOptions?.length > 0 && voteStatInfo?.length > 0) ? "block" : "none" }}>
				<h3>Статистика:</h3>
				<table>
					<thead>
					<tr>
						<th>ID</th>
						<th>Позиция</th>
						<th>Количество голосов</th>
					</tr>
					</thead>
					<tbody>
						{voteStatInfo}
					</tbody>
				</table>
			</div>
			<div className="btn-vote" style={{ display: (buttonVotes?.length > 0) ? "block" : "none" }}>
				<h3>Проголосовать:</h3>
				{buttonVotes}
			</div>
			<div className="btn-download" style={{ display: (voteOptions?.length > 0 || voteStatInfo?.length > 0) ? "block" : "none" }}>
				<h3>Тип получения данных:</h3>
				{buttonTypeStat}
				<h3>Скачать результаты:</h3>
				<Button key={'downloadBtn'} name={`Скачать ${mimeType?.name}`} func={downloadFile}/>
			</div>
		</div>
	);
}

export default App;