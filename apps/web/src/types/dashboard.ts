export type MonitorStatus = "UP" | "DOWN" | "DEGRADED" | "UNKNOWN";

export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface DashboardOverview {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  degradedMonitors: number;
  unknownMonitors: number;
  activeIncidents: number;
}

export interface DashboardChecks {
  total: number;
  successful: number;
  failed: number;
  uptime: number;
}

export interface MonitorSummary {
  id: string;
  name: string;
  url: string;
  method: string;

  status: MonitorStatus;
  enabled: boolean;

  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;

  lastCheckedAt: string | null;
  lastSuccessfulAt: string | null;
  lastFailedAt: string | null;

  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;

  createdAt: string;

  uptime: number;
}

export interface IncidentMonitor {
  id: string;
  name: string;
  url: string;
  status: string;
}

export interface IncidentSummary {
  id: string;

  monitorId: string;
  userId: string;

  title: string;
  description: string | null;

  status: IncidentStatus;

  errorMessage: string | null;
  statusCode: number | null;
  responseTime: number | null;

  startedAt: string;
  resolvedAt: string | null;

  createdAt: string;
  updatedAt: string;

  monitor: IncidentMonitor;
}

export interface DashboardData {
  overview: DashboardOverview;
  checks: DashboardChecks;
  monitors: MonitorSummary[];
  recentIncidents: IncidentSummary[];
}
