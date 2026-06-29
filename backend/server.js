import express from "express";
import cors from "cors";
import "dotenv/config";

import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";
import doctorRouter from "./routes/doctorRoutes.js";
import serviceRouter from "./routes/serviceRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRoutes.js";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://medicare-nine-eosin.vercel.app",
  "https://medicare-admin-omega.vercel.app",
];
// Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

console.log("CLERK_PUBLISHABLE_KEY =", process.env.CLERK_PUBLISHABLE_KEY);
console.log("CLERK_SECRET_KEY =", process.env.CLERK_SECRET_KEY?.slice(0, 15));

app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);
// DB
connectDB();

// Routes
app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);

app.post("/api/chat", async (req, res) => {
  try {
    const { message, system } = req.body;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",

          messages: [
            {
              role: "system",
              content: system,
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      },
    );

    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({
        reply: data.error.message,
      });
    }

    console.log(data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      reply: "Sorry, I am unable to respond right now.",
    });
  }
});

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => {
  console.log(`Server Started on https://localhost:${port}`);
});
