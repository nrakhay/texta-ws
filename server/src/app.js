import express from "express";
import realtimeRoutes from "./routes/realtimeRoutes/realtimeRoutes.js";

const app = express();

app.use(express.json());

app.use("/realtime", realtimeRoutes);

export default app;
