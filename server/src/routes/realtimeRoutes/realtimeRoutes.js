import express from "express";
import realtimeBaseInstructions from "../../const/instructions.js";

const router = express.Router();

const openaiUrl = "https://api.openai.com/v1/realtime/sessions";

// creates a new session and returns ephemeral token
router.post("/create-session", async (req, res) => {
  const response = await fetch(openaiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      instructions: realtimeBaseInstructions,
    }),
  });

  const data = await response.json();
  res.json(data);
});

export default router;
