import React, { useState } from "react";
import "./App.css";
import FavoritesList from "./components/favorites/FavoritesBody";
import ControlBody from "./components/control/ControlBody";

// import { getApi } from "./api/getApi";
// import { postApi } from "./api/postApi";

// const URI_LINK = {
// 	stat: '/stat',
// 	variants: '/variants',
// 	vote: '/vote',
// 	download: '/download',
// }

let DATA_LIST = [
	{
		method: "post",
		url: "http://tyt",
		query: [
		],
		body: '{"test1": "123", "test2": ["boy","girl"]}',
		headers: [
			{"Content-Type": "application/json"},
			{'Accept': 'true'},
		]
	},
	{
		method: "get",
		url: "http:/",
		query: [
			{key: 1},
			{aga: 2},
			{privet: "test"},
		],
		headers: [
			{"Content-Type": "application/json"},
		]
	},
	{
		method: "get",
		url: "http:/",
		query: [
			{key: 1},
		],
		headers: [
			{'Accept': 'true'},
		]
	},
]

function normalizeRequest (req) {
	const sortEntries = arr => arr
	?.map(item => {
		const entries = Object.entries(item);
		entries.sort(([a], [b]) => a.localeCompare(b));
		return JSON.stringify(entries);
	})
	.sort()
	.join('|') || '';

	return {
		method: req.method.toLowerCase(),
		url: req.url.toLowerCase().trim(),
		body: req.body?.trim() || '',
		query: sortEntries(req.query),
		headers: sortEntries(req.headers)
	};
}

function isRequestExists (newItem, arrList) {
	const normalizedNew = normalizeRequest(newItem);

	return arrList.some(item => {
		const normalizedItem = normalizeRequest(item);
		return (
			normalizedItem.method === normalizedNew.method &&
			normalizedItem.url === normalizedNew.url &&
			normalizedItem.body === normalizedNew.body &&
			normalizedItem.query === normalizedNew.query &&
			normalizedItem.headers === normalizedNew.headers
		);
	});
}

function App() {

	const [dataList, setDataList] = useState(DATA_LIST); // []
    const [dataReq, setDataReq] = useState({}); // {}
	const [dataRes, setDataRes] = useState({}); // {}

	const sendDataReq = (newData) => {
		console.log('submit');
		setDataReq({...newData});
	};

	const saveDataReq = (data) => {
		setDataList(prevDataList => {
			if (isRequestExists(data, prevDataList)) {
				alert('Такой запрос уже есть в избранном!');
				return prevDataList;
			} else {
				return [...prevDataList, data];
			}
		});
	};

	const openFavoriteReq = (id) => {
		setDataReq(dataList[id]);
	}

	return (
		<div className="container">
			<FavoritesList dataList={dataList} openPosition={openFavoriteReq}/>
			<ControlBody dataReq={dataReq} dataRes={dataRes} sendDataReq={sendDataReq} saveDataReq={saveDataReq}/>
		</div>
	);
}

export default App;