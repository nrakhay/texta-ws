import { WebSocketServer } from "ws";
import handleWebSocketConnection from "./sockets/wsConnectionHandler.js";

const wss = new WebSocketServer({
  port: process.env.WS_PORT || 3001,
});

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  handleWebSocketConnection(ws);

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

export default wss;
