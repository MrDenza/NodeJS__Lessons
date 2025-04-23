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
		url: "http:/",
		query: [
		],
		body: '"{"test1": "123", "test2": ["boy","girl"]}"',
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
// let DATA_REQ = {
// 	method: "post",
// 	url: "http:/",
// 	query: [
// 		{key: 1},
// 		{aga: 2},
// 		{privet: "test"},
// 	],
// 	body: '"{"test1": "123", "test2": ["boy","girl"]}"',
// 	headers: [
// 		{"Content-Type": "application/json"},
// 		{'Accept': 'true'},
// 	]
// };
let DATA_RES = {};

function App() {

	const [dataList, setDataList] = useState(DATA_LIST); // []
    const [dataReq, setDataReq] = useState({});
	const [dataRes, setDataRes] = useState(DATA_RES);

	const updateDataReq = (newData) => {
		console.log('submit');
		setDataReq({...newData});
	};

	const saveDataReq = (data) => {
		console.log('save');
		setDataList(prevDataList => [...prevDataList, data]);
	};

	const openFavoriteReq = (id) => {
		setDataReq(dataList[id]);
	}

	return (
		<div className="container">
			<FavoritesList dataList={dataList} openPosition={openFavoriteReq}/>
			<ControlBody dataReq={dataReq} dataRes={dataRes} updateDataReq={updateDataReq} saveDataReq={saveDataReq}/>
		</div>
	);
}

export default App;