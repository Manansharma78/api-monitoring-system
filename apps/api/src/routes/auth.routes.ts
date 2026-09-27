import {
  registerController,
  loginController,
} from "../controllers/auth.controller.js";

export async function authRoutes(app: any) {
  app.post("/register", registerController);
  app.post("/login", loginController);
}
