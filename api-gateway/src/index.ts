import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3003";
const CHAT_SERVICE_URL =
  process.env.CHAT_SERVICE_URL || "http://localhost:3002";

app.get("/health", (_req, res) => {
  res.json({ service: "api-gateway", status: "healthy" });
});

const forwardRequest = async (
  req: express.Request,
  res: express.Response,
  targetUrl: string
) => {
  try {
    const path = req.originalUrl.replace(/^\/[^\/]+/, "") || "/";
    const url = new URL(path, targetUrl);

    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers[key] = value;
      }
    });

    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status);

    if (response.headers.get("content-type")?.includes("application/json")) {
      res.json(JSON.parse(data));
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error("Forward request error:", error);
    res.status(500).json({ error: "Service unavailable" });
  }
};

app.use("/auth", (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL));
app.use("/users", (req, res) => forwardRequest(req, res, USER_SERVICE_URL));
app.use("/chats", (req, res) => forwardRequest(req, res, CHAT_SERVICE_URL));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
