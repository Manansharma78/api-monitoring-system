
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, updateMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("../../config/database.js", () => ({
  prisma: {
    apiMonitor: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

import { updateMonitor } from "../monitor.service.js";

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
