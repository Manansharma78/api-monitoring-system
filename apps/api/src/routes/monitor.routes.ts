import {
  createMonitorController,
  getMonitorsController,
  getMonitorController,
  updateMonitorController,
  deleteMonitorController,
  getMonitorHistoryController,
} from "../controllers/monitor.controller.js";

export async function monitorRoutes(app: any) {
  app.post("/", createMonitorController);

  app.get("/", getMonitorsController);

  app.get("/:id/history", getMonitorHistoryController);

  app.get("/:id", getMonitorController);

  app.patch("/:id", updateMonitorController);

  app.delete("/:id", deleteMonitorController);
}
