import { FastifyReply, FastifyRequest } from "fastify";

import {
  getIncidents,
  getOpenIncidents,
  getIncident,
  acknowledgeIncident,
  resolveIncident,
} from "../services/incident.service.js";

export async function getIncidentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const incidents = await getIncidents(request.user.id);

    return reply.send({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getOpenIncidentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const incidents = await getOpenIncidents(request.user.id);

    return reply.send({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getIncidentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const incident = await getIncident(request.user.id, params.id);

    if (!incident) {
      return reply.code(404).send({
        success: false,
        message: "Incident not found",
      });
    }

    return reply.send({
      success: true,
      incident,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function acknowledgeIncidentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const incident = await acknowledgeIncident(request.user.id, params.id);

    if (!incident) {
      return reply.code(404).send({
        success: false,
        message: "Open incident not found",
      });
    }

    return reply.send({
      success: true,
      message: "Incident acknowledged successfully",
      incident,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function resolveIncidentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = request.params as {
      id: string;
    };

    const incident = await resolveIncident(request.user.id, params.id);

    if (!incident) {
      return reply.code(404).send({
        success: false,
        message: "Open incident not found",
      });
    }

    return reply.send({
      success: true,
      message: "Incident resolved successfully",
      incident,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}
