import { useState } from 'react';
import useWebSocket from 'react-use-websocket';

interface Status {
	obs: {
		scenes: any[];
	};
	serverState: {
		currentCocktailRecipe: string | null;
		isShutterOpened: boolean;
		endTime: number | null;
	};
}

const cocktails = [{
	key: "none",
	value: "null",
	name: "Hide"
}, {
	key: "suikerwater",
	value: "suikerwater",
	name: "Suiker-water"
}, {
	key: "espressoMartini",
	value: "espressoMartini",
	name: "Espresso Martini"
}, {
	key: "rockstarMartini",
	value: "rockstarMartini",
	name: "Rockstar Martini"
}];

let interval: NodeJS.Timeout | null = null;

function App() {
	const [status, setStatus] = useState<Status | null>(null);
	const [withShutter, setWithShutter] = useState<boolean>(false);
	const [timerDuration, setTimerDuration] = useState<number>(0);
	const [remainingTime, setRemainingTime] = useState<string>("0:00");
	const [endTime, setEndTime] = useState<number | null>(null);

	const socketUrl = "ws://10.100.0.251:1337";
	
	const { sendMessage } = useWebSocket(socketUrl, {
		onOpen: () => {
			console.log("opened");

			sendMessage(JSON.stringify({
				command: "status"
			}));
		},
		onMessage: (event: MessageEvent) => {
			const message = JSON.parse(event.data);

			try {
				switch(message.event) {
					case "status":
						setStatus(message.data);

						console.log(message.data);

					break;
				}
			} catch (err) {
				console.error(err);
			}
		},
		shouldReconnect: (closeEvent) => true,
	});

	const send = (data: any) => {
		sendMessage(JSON.stringify(data));
	}

	const setShutter = (opened: boolean) => {
		send({
			event: "setShutter",
			data: {
				opened
			}
		});
	};

	const refreshScenes = () => {
		send({
			event: "refresh"
		});
	}

	const changeScene = (scene: string) => {
		send({
			event: "changeScene",
			data: {
				scene,
				withShutter
			}
		});
	}

	const setCocktail = (cocktail: string | null) => {
		send({
			event: "setCocktail",
			data: {
				cocktail
			}
		});
	}

	const setTimer = () => {
		if (interval) {
			window.clearInterval(interval);
		}

		if (timerDuration === 0) {
			send({
				event: "cancelTimer"
			});

			setEndTime(null);
			setRemainingTime("0:00");

			return;
		}

		let endTime = Date.now() + (timerDuration * 1000);

		setEndTime(endTime);

		interval = setInterval(() => {
			let now = Date.now();

			if (interval && now > endTime) {
				window.clearInterval(interval);

				setEndTime(null);

				return;
			}

			let remainingSeconds = Math.round((endTime - now) / 1000);

			let minutes = Math.floor(remainingSeconds / 60);
			let seconds = remainingSeconds % 60;

			setRemainingTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
		}, 100);

		send({
			event: "startTimer",
			data: {
				endTime
			}
		});
	}

	return (
		<>
			<div>
				<h2>Shutter</h2>
				<div className="buttons">
					<button type="button" onClick={() => setShutter(true)}>Open</button>
					<button type="button" onClick={() => setShutter(false)}>Close</button>
				</div>
			</div>
			<div>
				<div className="heading">
					<h2>Switch scene</h2>
					<button type="button" className="button" onClick={refreshScenes}>Refresh scenes</button>
					<div>
						<label><input type="checkbox" checked={withShutter} onChange={(event) => setWithShutter(event.target.checked)} /> With shutter</label>
					</div>
				</div>
				
				<div className="buttons">
					{status && status.obs && status.obs.scenes.map((s) => (
						<button type="button" key={s.name} onClick={() => changeScene(s.name)}>{s.name}</button>
					))}
				</div>
			</div>
			<div>
				<h2>Cocktails</h2>
				<div className="buttons">
					{cocktails.map((c) => (
						<button type="button" key={c.key} onClick={() => setCocktail(c.value)}>{c.name}</button>
					))}
				</div>
			</div>
			<div>
				<h2>Timer</h2>
				<div className="buttons">
					<button type="button" onClick={setTimer}>Set</button>
					<div className="fake-button">{remainingTime}</div>
					<input type="number" min="0" max="600" step="5" value={timerDuration} onChange={(event) => setTimerDuration(parseInt(event.target.value, 10))} />
				</div>
			</div>
		</>
	);
}

export default App;
