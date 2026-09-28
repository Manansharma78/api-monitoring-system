import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createMonitor,
  getMonitors,
  getMonitor,
  updateMonitor,
  deleteMonitor,
} from "../services/monitor.service.js";

import { getMonitorHistory } from "../services/monitor-history.service.js";

const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  url: z.string().url(),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .default("GET"),
  intervalSeconds: z.number().int().min(10).max(86400).default(60),
  timeoutMs: z.number().int().min(1000).max(120000).default(10000),
  expectedStatusCode: z.number().int().min(100).max(599).default(200),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  enabled: z.boolean().default(true),
});

const updateMonitorSchema = createMonitorSchema.partial();

export async function createMonitorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const parsed = createMonitorSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        message: "Invalid monitor data",
        errors: parsed.error.flatten(),
      });
    }

    const monitor = await createMonitor(parsed.data);

    return reply.code(201).send({
      success: true,
      monitor,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Failed to create monitor",
    });
  }
}

export async function getMonitorsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const monitors = await getMonitors();

    return reply.send({
      success: true,
      monitors,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Failed to fetch monitors",
    });
  }
}

export async function getMonitorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const monitor = await getMonitor(params.id);

    if (!monitor) {
      return reply.code(404).send({
        success: false,
        message: "Monitor not found",
      });
    }

    return reply.send({
      success: true,
      monitor,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Failed to fetch monitor",
    });
  }
}

export async function updateMonitorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const parsed = updateMonitorSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        message: "Invalid monitor data",
        errors: parsed.error.flatten(),
      });
    }

    const monitor = await updateMonitor(params.id, parsed.data);

    if (!monitor) {
      return reply.code(404).send({
        success: false,
        message: "Monitor not found",
      });
    }

    return reply.send({
      success: true,
      monitor,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Failed to update monitor",
    });
  }
}

export async function deleteMonitorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const deleted = await deleteMonitor(params.id);

    if (!deleted) {
      return reply.code(404).send({
        success: false,
        message: "Monitor not found",
      });
    }

    return reply.send({
      success: true,
      message: "Monitor deleted successfully",
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Failed to delete monitor",
    });
  }
}

export async function getMonitorHistoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const history = await getMonitorHistory(params.id, 50);

    return reply.send({
      success: true,
      history,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Failed to fetch monitor history",
    });
  }
}