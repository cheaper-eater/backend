import { env } from "node:process";
import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.mjs";

const app = express();
const port = env.PORT;

app.use(
  cors({
    origin: `http://${env.DOMAIN}:${env.EXPO_WEB_DEV_PORT}`,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api", apiRouter);

//error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({ error: err.message });
});

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
