require("dotenv").config();
const WebSocket = require("ws");
const obs = require("./obs");

const wss = new WebSocket.Server({
	port: 1337,
	perMessageDeflate: {
		zlibDeflateOptions: {
			// See zlib defaults.
			chunkSize: 1024,
			memLevel: 7,
			level: 3
		},
		zlibInflateOptions: {
			chunkSize: 10 * 1024
		},
		// Other options settable:
		clientNoContextTakeover: true, // Defaults to negotiated value.
		serverNoContextTakeover: true, // Defaults to negotiated value.
		serverMaxWindowBits: 10, // Defaults to negotiated value.
		// Below options specified as default values.
		concurrencyLimit: 10, // Limits zlib concurrency for perf.
		threshold: 1024 // Size (in bytes) below which messages
		// should not be compressed.
	}
});

const serverState = {
	endTime: null,
	isShutterOpened: false,
	currentCocktailRecipe: null
};

const broadcast = (data) => {
	wss.clients.forEach((socket) => {
		socket.send(JSON.stringify(data));
	});
}

const timeout = (duration) => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, duration);
	});
};

wss.on("connection", (socket) => {
	console.log("[WS] Client connected");

	const send = (data) => {
		socket.send(JSON.stringify(data));
	};

	const sendStatus = () => {
		send({
			event: "status",
			data: {
				obs: obs.data,
				serverState
			}
		});
	};

	// Send status as soon as client connects
	sendStatus();

	socket.on("message", async (data) => {
		// @ts-ignore
		const message = JSON.parse(data);

		switch (message.event) {
			case "refresh":
				await obs.getScenes();

				sendStatus();
				break;
			case "status":
				sendStatus();
				break;
			case "setShutter":
				const opened = message.data.opened;
				serverState.isShutterOpened = opened;

				if (opened) {
					broadcast({
						event: "open"
					});
				} else {
					broadcast({
						event: "close"
					});
				}
				break;
			case "changeScene":
				const { scene, withShutter } = message.data;

				if (withShutter) {
					broadcast({
						event: "close"
					});

					await timeout(2100);
				}

				obs.send("SetCurrentScene", {
					"scene-name": scene
				});

				if (withShutter) {
					await timeout(1000);

					broadcast({
						event: "open"
					});
				}

				break;

			case "setCocktail":
				const { cocktail } = message.data;

				broadcast({
					event: "cocktail",
					data: {
						cocktail
					}
				});

				break;
			case "cancelTimer":
				serverState.endTime = null;

				broadcast({
					event: "continue"
				});
				break;
			case "startTimer":
				const { endTime } = message.data;

				let eventName = "pause";

				if (serverState.endTime !== null && serverState.endTime > Date.now()) {
					eventName = "timer";
				}

				serverState.endTime = endTime;

				broadcast({
					event: eventName,
					data: {
						endTime
					}
				});
				break;
		}
	});
});