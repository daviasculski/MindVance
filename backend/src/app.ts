import express from "express";
import cors from "cors";
import { routes } from "./presentation/routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

export { app };
