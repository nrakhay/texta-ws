import { processUserAudio } from "../services/audioService/audioService.js";

const handleWebSocketConnection = (ws) => {
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      const { type, userId, content } = data;

      if (eventHandlers[type]) {
        eventHandlers[type](ws, content);
      } else {
        console.error(`No handler found for event type: ${type}`);
        ws.send(JSON.stringify({ type: "error", content: "No handler found" }));
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });
};

const handleWsUserAudio = (ws, content) => {
  console.log("Received user audio");
  console.log(content);
  const { audio } = content;

  console.log(audio);

  processUserAudio(ws, audio);
};

const eventHandlers = {
  "user-audio": handleWsUserAudio,
};

export default handleWebSocketConnection;
