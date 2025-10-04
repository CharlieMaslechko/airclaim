import express, { Request, Response } from "express";
import dotenv from "dotenv";
import archiveRoutes from "./routes/archiveRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "50mb" })); // For handling large payloads
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World from StakeLens API (TypeScript)!");
});

app.use("/api/archives", archiveRoutes);

app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
