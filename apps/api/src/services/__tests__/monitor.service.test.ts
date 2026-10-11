
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, updateMock, deleteMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("../../config/database.js", () => ({
  prisma: {
    apiMonitor: {
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import { deleteMonitor, updateMonitor } from "../monitor.service.js";

describe("updateMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the monitor does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await updateMonitor("missing-monitor-id", {
      name: "Updated monitor",
    });

    expect(result).toBeNull();
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "missing-monitor-id" },
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates an existing monitor", async () => {
    const existingMonitor = {
      id: "monitor-123",
      name: "Original monitor",
    };

    const updatedMonitor = {
      id: "monitor-123",
      name: "Updated monitor",
    };

    findUniqueMock.mockResolvedValue(existingMonitor);
    updateMock.mockResolvedValue(updatedMonitor);

    const result = await updateMonitor("monitor-123", {
      name: "Updated monitor",
    });

    expect(result).toEqual(updatedMonitor);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
      data: { name: "Updated monitor" },
    });
  });
});

describe("deleteMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when the monitor does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await deleteMonitor("missing-monitor-id");

    expect(result).toBe(false);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "missing-monitor-id" },
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes an existing monitor and returns true", async () => {
    findUniqueMock.mockResolvedValue({
      id: "monitor-123",
      name: "Test monitor",
    });
    deleteMock.mockResolvedValue({
      id: "monitor-123",
    });

    const result = await deleteMonitor("monitor-123");

    expect(result).toBe(true);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
    });
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "monitor-123" },
    });
  });
});
