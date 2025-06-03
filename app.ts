import express, { type Request, type NextFunction, type Response } from "express"
import rateLimit from "express-rate-limit";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import swaggerUIPath from "swagger-ui-express";
import swaggerjsonFilePath from "./dev-blog-openapi.json" with { type: "json" };

import blogsPostRoutes from "./routes/blogspost.js";
import userRoutes from "./routes/user.js";

const app = express();
dotenv.config();

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 0,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
  skip: (req) => req.path.startsWith("/api-docs"),
});

// CORS Setup
const whitelist = ["http://localhost:3000", "https://dev-blog.ca"];
const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
      return whitelist.includes(origin)
        ? callback(null, true)
        : callback( new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
// Enable preflight across-the-board
app.options("*", cors(corsOptions));

// logging
app.use(morgan("dev"));

// simple console logger - Logging middleware for debugging each request
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// middleware
app.use(express.json());
app.use(apiLimiter);
// serves static files
app.use(express.static("public"));

// Routes
app.get("/", (req: Request, res: Response) => {
   res.json({ message: "Welcome to the A Dev's Blog Backend"});
});

app.get("/api/status", async (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toString()
  });
});

app.use("/api/blogpost", blogsPostRoutes);
app.use("/api/user", userRoutes);

app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("❌ Uncaught error:", err);
    res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
);

// Swagger API Endpoint
app.use("/api-docs", swaggerUIPath.serve, swaggerUIPath.setup(swaggerjsonFilePath));

export default app;
