// ----------------------- JavaScript -----------------------

// Запуск: node script1 arg1 arg2
// arg1==="a" - ничего не делать :)
// arg1==="b" - сразу выход сурово
// arg1==="c" - сразу выход аккуратно
// arg1==="d" - запустить таймер на arg2 миллисекунд
let arg1=process.argv[2];
let arg2=parseInt(process.argv[3]);

console.log("argv[0]: ",process.argv[0]);
console.log("argv[1]: ",process.argv[1]);
console.log("argv[2]: ",process.argv[2]);
console.log("argv[3]: ",process.argv[3]);

switch ( arg1 ) {
	case "a":
		console.log("arg1 = a - ничего не делаем");
		break;
	case "b":
		console.log("arg1 = b - немедленно остановить");
		process.exit(); // немедленно остановить выполнение программы
		// break; - можно не писать - выполнение сюда не дойдёт
	case "c":
		console.log("arg1 = c - корректно остановить");
		process.kill(process.pid, 'SIGTERM'); // корректно остановить программу
		break; // надо писать - выполнение сюда МОЖЕТ дойти
	case "d":
		console.log("arg1 = d - ожидаем " + arg2 + " миллисекунд");
		setTimeout(()=>{
			console.log("Отложенное выполнение - готово!");
		},arg2);
		break;
}

console.log("Конец.");