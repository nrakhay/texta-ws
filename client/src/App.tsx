declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

import { useState, useEffect, useRef } from "react";
import { audioBase64 } from "./audio";

const WS_URL = "ws://localhost:3001";

export default function VoiceAssistant() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  const initializeWebSocket = () => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      console.log("WebSocket already initialized or open.");
      return;
    }

    console.log("Attempting to connect to WebSocket...");
    ws.current = new WebSocket(WS_URL);
    if (ws.current) {
      ws.current.binaryType = "arraybuffer";
    }

    ws.current.onopen = () => {
      console.log("WebSocket connected!");
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      console.warn("WebSocket closed. Attempting to reconnect...");
      setIsConnected(false);
      setTimeout(initializeWebSocket, 2000); // Retry after 2 seconds
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.current.onmessage = handleMessage;
  };

  useEffect(() => {
    if (ws.current?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected. Reconnecting...");
      initializeWebSocket();
      return;
    }

    return () => {
      if (ws.current) {
        const socket = ws.current;
        socket.onclose = null;
        socket.onopen = null;
        socket.onerror = null;
        socket.onmessage = null;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    // const message = JSON.parse(event.data);
    // if (message.type === "audio") {
    //   const audioData = new Uint8Array(
    //     Buffer.from(message.content.payload, "base64")
    //   );
    //   playAudio(audioData);
    // }
  };

  const startRecording = async () => {
    if (!audioContext.current) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      audioContext.current = new AudioContextClass();
    }
    if (audioContext.current.state === "suspended") {
      await audioContext.current.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };
    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      const reader = new FileReader();
      reader.onloadend = () => {
        if (!reader.result) return;
        const base64Audio = reader.result.toString().split(",")[1];
        if (ws.current?.readyState === WebSocket.CLOSED) {
          initializeWebSocket();
        }
        ws.current?.send(
          JSON.stringify({
            type: "user-audio",
            content: { audio: audioBase64 },
          })
        );
      };
      reader.readAsDataURL(audioBlob);
      audioChunks.current = [];
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          AI Voice Assistant
        </h1>
        {!isConnected ? (
          <p className="text-center text-gray-600">Connecting to server...</p>
        ) : (
          <>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-4 px-6 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              } text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105`}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          </>
        )}
        <p className="text-gray-600 text-center mt-4 text-sm">
          {isConnected ? "Connected to voice assistant" : "Connecting..."}
        </p>
      </div>
    </div>
  );
}
