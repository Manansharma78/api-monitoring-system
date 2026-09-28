import {
  registerController,
  loginController,
  meController,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

export async function authRoutes(app: any) {
  // POST /api/auth/register
  app.post("/register", registerController);

  // POST /api/auth/login
  app.post("/login", loginController);

  // GET /api/auth/me
  app.get(
    "/me",
    {
      preHandler: authenticate,
    },
    meController,
  );
}
