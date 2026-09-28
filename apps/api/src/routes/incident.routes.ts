import {
  getIncidentsController,
  getOpenIncidentsController,
  getIncidentController,
  acknowledgeIncidentController,
  resolveIncidentController,
} from "../controllers/incident.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

export async function incidentRoutes(app: any) {
  app.get(
    "/",
    {
      preHandler: authenticate,
    },
    getIncidentsController,
  );

  app.get(
    "/open",
    {
      preHandler: authenticate,
    },
    getOpenIncidentsController,
  );

  app.get(
    "/:id",
    {
      preHandler: authenticate,
    },
    getIncidentController,
  );

  app.patch(
    "/:id/acknowledge",
    {
      preHandler: authenticate,
    },
    acknowledgeIncidentController,
  );

  app.patch(
    "/:id/resolve",
    {
      preHandler: authenticate,
    },
    resolveIncidentController,
  );
}
