
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  monitorCountMock,
  monitorAggregateMock,
  monitorFindManyMock,
  incidentCountMock,
  incidentFindManyMock,
} = vi.hoisted(() => ({
  monitorCountMock: vi.fn(),
  monitorAggregateMock: vi.fn(),
  monitorFindManyMock: vi.fn(),
  incidentCountMock: vi.fn(),
  incidentFindManyMock: vi.fn(),
}));

vi.mock("../../config/database.js", () => ({
  prisma: {
    apiMonitor: {
      count: monitorCountMock,
      aggregate: monitorAggregateMock,
      findMany: monitorFindManyMock,
    },
    incident: {
      count: incidentCountMock,
      findMany: incidentFindManyMock,
    },
  },
}));

import { getDashboard } from "../dashboard.service.js";

function mockDashboardData(options?: {
  total?: number;
  successful?: number;
  failed?: number;
  monitors?: Array<Record<string, unknown>>;
}) {
  const {
    total = 100,
    successful = 95,
    failed = 5,
    monitors = [],
  } = options ?? {};

  monitorCountMock
    .mockResolvedValueOnce(4)
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(0);

  incidentCountMock.mockResolvedValue(2);

  monitorAggregateMock
    .mockResolvedValueOnce({ _sum: { totalChecks: total } })
    .mockResolvedValueOnce({ _sum: { successfulChecks: successful } })
    .mockResolvedValueOnce({ _sum: { failedChecks: failed } });

  incidentFindManyMock.mockResolvedValue([]);
  monitorFindManyMock.mockResolvedValue(monitors);
}

describe("getDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns monitor counts, incident counts, and overall uptime", async () => {
    mockDashboardData();

    const result = await getDashboard();

    expect(result.overview).toEqual({
      totalMonitors: 4,
      upMonitors: 2,
      downMonitors: 1,
      degradedMonitors: 1,
      unknownMonitors: 0,
      activeIncidents: 2,
    });

    expect(result.checks).toEqual({
      total: 100,
      successful: 95,
      failed: 5,
      uptime: 95,
    });

    expect(result.recentIncidents).toEqual([]);
  });

  it("returns 100 percent uptime when there are no checks", async () => {
    mockDashboardData({
      total: 0,
      successful: 0,
      failed: 0,
    });

    const result = await getDashboard();

    expect(result.checks).toEqual({
      total: 0,
      successful: 0,
      failed: 0,
      uptime: 100,
    });
  });

  it("calculates uptime for each monitor", async () => {
    mockDashboardData({
      monitors: [
        {
          id: "monitor-1",
          name: "API One",
          totalChecks: 40,
          successfulChecks: 38,
          failedChecks: 2,
        },
        {
          id: "monitor-2",
          name: "API Two",
          totalChecks: 0,
          successfulChecks: 0,
          failedChecks: 0,
        },
      ],
    });

    const result = await getDashboard();

    expect(result.monitors).toEqual([
      expect.objectContaining({
        id: "monitor-1",
        uptime: 95,
      }),
      expect.objectContaining({
        id: "monitor-2",
        uptime: 100,
      }),
    ]);
  });

  it("requests the ten most recent incidents", async () => {
    mockDashboardData();

    await getDashboard();

    expect(incidentFindManyMock).toHaveBeenCalledWith({
      include: {
        monitor: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 10,
    });
  });
});
