
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findFirstMock,
  userCreateMock,
  monitorCreateMock,
  findManyMock,
  findUniqueMock,
  updateMock,
  deleteMock,
} = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  userCreateMock: vi.fn(),
  monitorCreateMock: vi.fn(),
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findFirst: findFirstMock,
      create: userCreateMock,
    },
    apiMonitor: {
      create: monitorCreateMock,
      findMany: findManyMock,
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import {
  createMonitor,
  deleteMonitor,
  getMonitor,
  getMonitors,
  updateMonitor,
} from "../monitor.service.js";

const monitorInput = {
  name: "Test monitor",
  description: "Unit test monitor",
  url: "https://example.com",
  method: "GET" as const,
  intervalSeconds: 60,
  timeoutMs: 5000,
  expectedStatusCode: 200,
  enabled: true,
};

describe("createMonitor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a monitor using an existing user", async () => {
    findFirstMock.mockResolvedValue({ id: "user-123" });

    const createdMonitor = {
      id: "monitor-123",
      ...monitorInput,
      userId: "user-123",
    };

    monitorCreateMock.mockResolvedValue(createdMonitor);

    const result = await createMonitor(monitorInput);

    expect(result).toEqual(createdMonitor);
    expect(userCreateMock).not.toHaveBeenCalled();
    expect(monitorCreateMock).toHaveBeenCalledWith({
      data: { userId: "user-123", ...monitorInput },
    });
  });

  it("creates a demo user when no user exists", async () => {
    findFirstMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({ id: "demo-user-123" });

    const createdMonitor = {
      id: "monitor-456",
      ...monitorInput,
      userId: "demo-user-123",
    };

    monitorCreateMock.mockResolvedValue(createdMonitor);

    const result = await createMonitor(monitorInput);

    expect(result).toEqual(createdMonitor);
    expect(userCreateMock).toHaveBeenCalledWith({
      data: {
        email: "demo@api-monitoring.local",
        name: "Demo User",
        passwordHash: "not-used",
      },
    });
    expect(monitorCreateMock).toHaveBeenCalledWith({
      data: { userId: "demo-user-123", ...monitorInput },
    });
  });
});

describe("getMonitors", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns monitors ordered newest first", async () => {
    const monitors = [
      { id: "monitor-2", name: "Second monitor" },
      { id: "monitor-1", name: "First monitor" },
    ];

    findManyMock.mockResolvedValue(monitors);

    const result = await getMonitors();

    expect(result).toEqual(monitors);
    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns an empty array when no monitors exist", async () => {
    findManyMock.mockResolvedValue([]);

    const result = await getMonitors();

    expect(result).toEqual([]);
    expect(findManyMock).toHaveBeenCalledOnce();
  });
});

describe("getMonitor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a monitor by ID", async () => {
    const monitor = { id: "monitor-123", name: "Test monitor" };
    findUniqueMock.mockResolvedValue(monitor);

    const result = await getMonitor("monitor-123");

    expect(result).toEqual(monitor);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
    });
  });

  it("returns null when the monitor does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await getMonitor("missing-monitor-id");

    expect(result).toBeNull();
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "missing-monitor-id" },
    });
  });
});

describe("updateMonitor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when the monitor does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await updateMonitor("missing-monitor-id", {
      name: "Updated monitor",
    });

    expect(result).toBeNull();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates an existing monitor", async () => {
    findUniqueMock.mockResolvedValue({
      id: "monitor-123",
      name: "Original monitor",
    });

    const updatedMonitor = {
      id: "monitor-123",
      name: "Updated monitor",
    };

    updateMock.mockResolvedValue(updatedMonitor);

    const result = await updateMonitor("monitor-123", {
      name: "Updated monitor",
    });

    expect(result).toEqual(updatedMonitor);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
      data: { name: "Updated monitor" },
    });
  });
});

describe("deleteMonitor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when the monitor does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await deleteMonitor("missing-monitor-id");

    expect(result).toBe(false);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes an existing monitor and returns true", async () => {
    findUniqueMock.mockResolvedValue({
      id: "monitor-123",
      name: "Test monitor",
    });

    deleteMock.mockResolvedValue({ id: "monitor-123" });

    const result = await deleteMonitor("monitor-123");

    expect(result).toBe(true);
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
    });
  });
});
