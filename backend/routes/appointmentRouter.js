import { clerkMiddleware, requireAuth } from "@clerk/express";
import {
  cancelAppointment,
  confirmPayment,
  createAppointment,
  getAppointments,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  getRegisteredUserCount,
  getStats,
  updateAppointment,
} from "../controllers/appointmentController.js";
//import { requireAuth } from "@clerk/clerk-sdk-node";
import express from "express";

const appointmentRouter = express.Router();

appointmentRouter.get("/", getAppointments);
appointmentRouter.get("/confirm", confirmPayment);
appointmentRouter.get("/stats/summary", getStats);

// Authentic Router;
appointmentRouter.post(
  "/",
  clerkMiddleware(),
  requireAuth(),
  createAppointment,
);
appointmentRouter.get("/me", getAppointmentsByPatient);

appointmentRouter.get("/doctor/:doctorId", getAppointmentsByDoctor);

appointmentRouter.post("/:id/cancel", cancelAppointment);
appointmentRouter.get("/patients/count", getRegisteredUserCount);
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;
