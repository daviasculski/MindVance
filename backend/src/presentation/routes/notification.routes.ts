import { Router } from "express";
import { ManageNotificationsUserStory } from "../../application/userstories/ManageNotificationsUserStory";
import { PrismaNotificationRepository } from "../../infrastructure/repositories/PrismaNotificationRepository";
import { sendError } from "../http";

const notificationRoutes = Router();
const notifications = new ManageNotificationsUserStory(new PrismaNotificationRepository());
const statusByMessage = { "Notification not found": 404 };

// Sempre as notificações do próprio usuário logado (NOT-01)
notificationRoutes.get("/", async (req, res) => {
  try {
    return res.status(200).json(await notifications.list(req.user!.id));
  } catch (error) {
    return sendError(res, error, statusByMessage, "Unable to list notifications");
  }
});

notificationRoutes.patch("/read-all", async (req, res) => {
  try {
    await notifications.markAllRead(req.user!.id);
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, statusByMessage, "Unable to update notifications");
  }
});

notificationRoutes.patch("/:id/read", async (req, res) => {
  try {
    await notifications.markRead(req.params.id, req.user!.id);
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, statusByMessage, "Unable to update notification");
  }
});

export { notificationRoutes };
