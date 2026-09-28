import { FastifyReply, FastifyRequest } from "fastify";
import { getDashboard } from "../services/dashboard.service.js";

export async function getDashboardController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { period = "24h" } = request.query as { period?: string };
    const dashboard = await getDashboard();

    return reply.send({
      success: true,
      dashboard,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}
