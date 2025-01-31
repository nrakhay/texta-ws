import http from "http";
import app from "./app.js";
import wss from "./websocket.js";
import realtimeWsClient from "./sockets/realtimeWsClient.js";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
