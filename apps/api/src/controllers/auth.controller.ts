import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { registerUser, loginUser } from "../services/auth.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = registerSchema.parse(request.body);

    const user = await registerUser(body.email, body.password, body.name);

    return reply.code(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        message: "Invalid request data",
        errors: error.issues,
      });
    }

    if (
      error instanceof Error &&
      error.message === "User with this email already exists"
    ) {
      return reply.code(409).send({
        success: false,
        message: error.message,
      });
    }

    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = loginSchema.parse(request.body);

    const user = await loginUser(body.email, body.password);

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        message: "Invalid request data",
        errors: error.issues,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return reply.code(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}