import express from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';

import { confirmServicePayment, getServiceAppointments, getServiceAppointmentStats } from '../controllers/serviceAppointmentController.js';
import { cancelServiceAppointment, createServiceAppointment, getServiceAppointmentbyId, getServiceAppointmentByPatient, updateServiceAppointment } from '../controllers/serviceAppointmentController.js';

const serviceAppointmentRouter = express.Router();

serviceAppointmentRouter.get("/", getServiceAppointments);
serviceAppointmentRouter.get("/confirm", confirmServicePayment);
serviceAppointmentRouter.get("/stats/summary", getServiceAppointmentStats);

serviceAppointmentRouter.post("/", clerkMiddleware(), requireAuth(), createServiceAppointment);

serviceAppointmentRouter.get("/me", clerkMiddleware(), requireAuth(), getServiceAppointmentByPatient);

serviceAppointmentRouter.get("/:id", getServiceAppointmentbyId);
serviceAppointmentRouter.put("/:id", updateServiceAppointment);
serviceAppointmentRouter.post("/:id/cancel", cancelServiceAppointment);

export default serviceAppointmentRouter;