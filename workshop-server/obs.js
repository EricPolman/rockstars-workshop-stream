const OBSWebSocket = require("obs-websocket-js");

const obs = new OBSWebSocket();

const data = {
	scenes: null
};

// Connect to the OBS client
obs.connect({
	address: process.env.OBS_HOST,
	password: process.env.OBS_PASSWORD
});

obs.on("ConnectionOpened", () => {
	console.log("[OBS] Connected");
});

obs.on("ConnectionClosed", () => {
	console.log("[OBS] Lost connection");
});

obs.on("AuthenticationSuccess", async () => {
	console.log("[OBS] Authentication success");

	await getScenes();
});

obs.on("AuthenticationFailure", () => {
	console.log("[OBS] Authentication failure");
});

const send = async (command, data) => {
	return obs.send(command, data);
};

const getScenes = async () => {
	const scenes = (await send("GetSceneList")).scenes;

	data.scenes = scenes;

	return scenes;
};

module.exports = {
	send,
	data,
	getScenes
};