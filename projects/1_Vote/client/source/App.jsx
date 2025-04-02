//import React from “react”;
import "./App.css";
import { getApi } from "./api/getApi";
import { useEffect, useState } from "react";
import Button from "./components/Button";
import { postApi } from "./api/postApi";
import InfoBox from "./components/InfoBox";

function App() {

	const [voteOptions, setVoteOptions] = useState([]);
	const [voteStat, setVoteStat] = useState([]);

	const getInfo = (uri) => {
		getApi(uri).then(r => setVoteOptions(r));
	}

	const postInfo = (uri, body)=> {
		postApi(uri, body).then(r => setVoteStat(r));
	}
	//props.sendVote(, { idVote: props.id }
	const sendVote = (id) => {
		postApi('/vote', {idVote: id}).then(() => postInfo('/stat'));
	}

	useEffect( () => {
		// componentDidMount
		getInfo('/variants');
		postInfo('/stat');
		return () => {
			// componentWillUnmount
		}
	}, []);

	// useEffect(() => {
	// 	console.log(voteOptions);
	// 	console.log(voteStat);
	// }, [voteOptions, voteStat]);

	const findNameById = (id) => {
		return voteOptions?.find((elem) => elem.id === id)?.name;
	};

	const buttonGroup = voteOptions?.map((elem) => {
		return <Button key={elem.id + 10} id={elem.id} name={elem.name} sendVote={sendVote}/>
	});

	const voteStatInfo = voteStat?.map((elem) => {
		let nameById = findNameById(elem.id);
		return <InfoBox key={elem.id + 100} id={elem.id} votes={elem.votes} name={nameById}/>
	});

	return (
		<div className="container">
			<h2>Голосование</h2>
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
			<div className="btn-group" style={{ display: (buttonGroup?.length > 0) ? "block" : "none" }}>
				<h3>Проголосовать:</h3>
				{buttonGroup}
			</div>
		</div>
	);
}

export default App;