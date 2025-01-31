import decode from "audio-decode";
import { base64EncodeAudio, base64ToArrayBuffer } from "./helpers.js";
import realtimeWs from "../../sockets/realtimeWsClient.js";
import { createReadStream } from "fs";

export const processUserAudio = async (ws, audioData) => {
  try {
    // verify valid base64 string
    // if (!/^[A-Za-z0-9+/=]+$/.test(audioData)) {
    //   throw new Error("Invalid base64 string");
    // }

    const bytes = base64ToArrayBuffer(audioData);
    const audioBuffer = await decode(bytes);

    // verify audio format, clearly used chatgpt here
    // Convert to mono if needed
    let channelData;
    if (audioBuffer.numberOfChannels !== 1) {
      console.warn("Converting stereo to mono");
      // If stereo, convert to mono by averaging channels
      const mono = new Float32Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        let sum = 0;
        for (
          let channel = 0;
          channel < audioBuffer.numberOfChannels;
          channel++
        ) {
          sum += audioBuffer.getChannelData(channel)[i];
        }
        mono[i] = sum / audioBuffer.numberOfChannels;
      }
      channelData = mono;
    } else {
      channelData = audioBuffer.getChannelData(0);
    }

    const base64Chunk = base64EncodeAudio(channelData);

    realtimeWs.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_audio",
              audio: base64Chunk,
            },
          ],
        },
      })
    );

    realtimeWs.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["text"],
        },
      })
    );
  } catch (error) {
    console.error("Error processing audio", error);
    ws.send(
      JSON.stringify({ type: "error", content: "Error processing audio" })
    );
  }
};
