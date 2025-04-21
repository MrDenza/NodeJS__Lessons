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

let DATA_LIST = {}
let DATA_REQ = {
	//method: "post",
	//url: "http:/",
	// query: [
	// 	{key: 1},
	// 	{aga: 2},
	// 	{privet: "test"},
	// ],
	// body: '"{"test1": "123", "test2": ["boy","girl"]}"',
	// headers: [
	// 	{"Content-Type": "application/json"},
	// 	{'Accept': 'true'},
	// ]
};
let DATA_RES = {};

const BLANK_DATA_RES = {};
// const BLANK_DATA_REQ = {
// 	method: "",
// 	url: "",
// 	query: [],
// 	body: '',
// 	headers: []
// }

function App() {

	const [dataList, setDataList] = useState(DATA_LIST);
	const [dataReq, setDataReq] = useState(DATA_REQ);
	const [dataRes, setDataRes] = useState(DATA_RES);

	const updateDataReq = (newData) => {
		//setDataReq({...dataReq, ...newData});
	};

	const resetDataReq = () => {
		// setDataReq(BLANK_DATA_REQ);
		// setDataRes(BLANK_DATA_RES);
	}

	const saveDataReq = (data) => {

	};

	return (
		<div className="container">
			<FavoritesList dataList={dataList}/>
			<ControlBody dataReq={dataReq} dataRes={dataRes} updateDataReq={updateDataReq} resetDataReq={resetDataReq} saveDataReq={saveDataReq}/>
		</div>
	);
}

export default App;