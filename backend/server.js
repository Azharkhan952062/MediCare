import express from "express";
import cors from "cors";
import "dotenv/config";

import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";
import doctorRouter from "./routes/doctorRoutes.js";
import serviceRouter from "./routes/serviceRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
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

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => {
  console.log(`Server Started on https://localhost:${port}`);
});
