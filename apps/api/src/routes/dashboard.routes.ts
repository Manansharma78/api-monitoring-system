import { getDashboardController } from "../controllers/dashboard.controller.js";

export async function dashboardRoutes(app: any) {
  app.get("/", getDashboardController);
}
