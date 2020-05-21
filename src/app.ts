import * as express from "express";
import { healthRouter } from "./routers";

const app = express();

app.use("/", healthRouter);

export default app;
