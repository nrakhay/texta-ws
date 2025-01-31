import WebSocket from "ws";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import wss from "../websocket.js";
import { getWeather } from "../services/weatherService/weatherService.js";
import { json } from "stream/consumers";
import realtimeBaseInstructions from "../const/instructions.js";

dotenv.config();

const url =
  "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const realtimeWs = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
  },
});

realtimeWs.on("open", function open() {
  console.log("Connected to server.");

  realtimeWs.send(
    JSON.stringify({
      type: "session.update",
      session: {
        instructions: realtimeBaseInstructions,
        modalities: ["text", "audio"],
        tools: [
          {
            type: "function",
            name: "getWeather",
            description: "Get the weather for a given location",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
                units: {
                  type: "string",
                  enum: ["metric", "imperial"],
                  default: "metric",
                },
              },
              required: ["location"],
            },
          },
        ],
      },
    })
  );
});

let audioBuffer = Buffer.alloc(0);

realtimeWs.on("message", function incoming(message) {
  console.log(JSON.parse(message.toString()));

  try {
    const response = JSON.parse(message);

    if (response.type === "response.function_call_arguments.done") {
      const args = JSON.parse(response.arguments);
      const name = response.name;

      if (tools[name]) {
        const res = tools[name](...Object.values(args));
        res.then((result) => {
          const eventId = uuidv4();
          realtimeWs.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "system",
                content: [
                  {
                    type: "input_text",
                    text:
                      "Give weather data based on the location: " +
                      JSON.stringify(result),
                  },
                ],
              },
            })
          );

          realtimeWs.send(
            JSON.stringify({
              type: "response.create",
              event_id: eventId,
              response: {
                modalities: ["text", "audio"],
              },
            })
          );
        });
      } else {
        console.error(`Function ${name} not found in tools`);
      }
    }

    if (response.type === "response.done") {
      console.log(response.response.output[0]);
    }

    if (response.type === "response.audio.delta") {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ type: "audio", content: response.delta })
          );
        }
      });
    }
  } catch (error) {
    console.error("Error parsing message:", error);
  }
});

const tools = {
  getWeather: getWeather,
};

export default realtimeWs;
