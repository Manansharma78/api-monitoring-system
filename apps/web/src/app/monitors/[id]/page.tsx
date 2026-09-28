"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Server,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/lib/api";


interface Monitor {
  id: string;
  name: string;
  description: string | null;
  url: string;
  method: string;
  status: "UP" | "DOWN" | "DEGRADED" | "UNKNOWN";
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
}

interface HistoryItem {
  _id: string;
  monitorId: string;
  url: string;
  method: string;
  success: boolean;
  statusCode: number | null;
  responseTime: number;
  errorMessage: string | null;
  checkedAt: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  errorMessage: string | null;
  statusCode: number | null;
  responseTime: number | null;
  startedAt: string;
  resolvedAt: string | null;
}

function statusLabel(status: Monitor["status"]) {
  switch (status) {
    case "UP":
      return "Operational";
    case "DOWN":
      return "Down";
    case "DEGRADED":
      return "Degraded";
    default:
      return "Unknown";
  }
}

function statusClass(status: Monitor["status"]) {
  switch (status) {
    case "UP":
      return "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400";
    case "DOWN":
      return "border-red-500/20 bg-red-500/[0.08] text-red-400";
    case "DEGRADED":
      return "border-amber-500/20 bg-amber-500/[0.08] text-amber-400";
    default:
      return "border-zinc-500/20 bg-zinc-500/[0.08] text-zinc-400";
  }
}

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelative(value: string | null) {
  if (!value) return "Never";

  const diff = Date.now() - new Date(value).getTime();

  if (diff < 60_000) return "Just now";

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

export default function MonitorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonitor = useCallback(async () => {
    const { id } = await params;

    try {
      setError(null);

      const [monitorResponse, historyResponse, dashboardResponse] =
        await Promise.all([
          api.get(`/monitors/${id}`),
          api.get(`/monitors/${id}/history`),
          api.get("/dashboard"),
        ]);

      if (monitorResponse.data?.success && monitorResponse.data.monitor) {
        setMonitor(monitorResponse.data.monitor);
      } else {
        throw new Error("Monitor not found");
      }

      if (historyResponse.data?.success) {
        setHistory(historyResponse.data.history ?? []);
      }

      if (dashboardResponse.data?.success) {
        const recentIncidents =
          dashboardResponse.data.dashboard?.recentIncidents ?? [];

        const monitorIncidents = recentIncidents.filter(
          (incident: Incident & { monitorId?: string }) =>
            incident.monitorId === id,
        );

        setIncidents(monitorIncidents);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load monitor details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadMonitor();
    }, 0);

    const interval = window.setInterval(() => {
      setRefreshing(true);
      void loadMonitor();
    }, 10_000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadMonitor]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse">
            <div className="h-5 w-24 rounded bg-white/[0.05]" />
            <div className="mt-8 h-8 w-72 rounded bg-white/[0.06]" />
            <div className="mt-3 h-4 w-96 rounded bg-white/[0.04]" />

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-28 rounded-2xl bg-white/[0.025]" />
              ))}
            </div>

            <div className="mt-6 h-80 rounded-2xl bg-white/[0.025]" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !monitor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="text-center">
          <XCircle size={40} className="mx-auto text-red-400" />

          <h1 className="mt-4 text-lg font-semibold">Monitor unavailable</h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error ?? "Monitor not found."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
          >
            <ArrowLeft size={15} />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const uptime =
    monitor.totalChecks > 0
      ? (monitor.successfulChecks / monitor.totalChecks) * 100
      : 100;

  const averageResponseTime =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + item.responseTime, 0) /
            history.length,
        )
      : 0;

  const chartData = [...history].reverse().map((item) => ({
    time: new Date(item.checkedAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    responseTime: item.responseTime,
  }));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/[0.06] pb-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to dashboard
          </Link>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadMonitor();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <section className="mt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  <Activity
                    size={18}
                    className={
                      monitor.status === "UP"
                        ? "text-emerald-400"
                        : monitor.status === "DOWN"
                          ? "text-red-400"
                          : "text-amber-400"
                    }
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {monitor.name}
                  </h1>

                  <p className="mt-1 max-w-2xl truncate text-xs text-zinc-600">
                    {monitor.url}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusClass(
                monitor.status,
              )}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusLabel(monitor.status)}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-zinc-500">Uptime</p>

            <p className="mt-3 text-2xl font-semibold text-white">
              {uptime.toFixed(2)}%
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {monitor.successfulChecks} successful checks
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-zinc-500">Total checks</p>

            <p className="mt-3 text-2xl font-semibold text-white">
              {monitor.totalChecks.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {monitor.failedChecks} failed
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-zinc-500">Avg. response</p>

            <p className="mt-3 text-2xl font-semibold text-white">
              {averageResponseTime} ms
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Last {history.length} checks
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-zinc-500">Last check</p>

            <p className="mt-3 text-lg font-semibold text-white">
              {formatRelative(monitor.lastCheckedAt)}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {formatDate(monitor.lastCheckedAt)}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Response time
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Recent monitoring performance
                </p>
              </div>

              <Clock3 size={17} className="text-zinc-600" />
            </div>

            <div className="mt-6 h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="time"
                      tick={{
                        fill: "#52525b",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#52525b",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#0b0b0b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        fontSize: 11,
                      }}
                      labelStyle={{
                        color: "#a1a1aa",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                  No check history yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Configuration
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Current monitor settings
                </p>
              </div>

              <Server size={17} className="text-zinc-600" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-zinc-600">Method</span>
                <span className="text-xs font-medium text-zinc-300">
                  {monitor.method}
                </span>
              </div>

              <div className="flex justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-zinc-600">Expected status</span>
                <span className="text-xs font-medium text-zinc-300">
                  {monitor.expectedStatusCode}
                </span>
              </div>

              <div className="flex justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-zinc-600">Interval</span>
                <span className="text-xs font-medium text-zinc-300">
                  {monitor.intervalSeconds}s
                </span>
              </div>

              <div className="flex justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-zinc-600">Timeout</span>
                <span className="text-xs font-medium text-zinc-300">
                  {monitor.timeoutMs}ms
                </span>
              </div>

              <div className="flex justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-zinc-600">Monitoring</span>
                <span
                  className={
                    monitor.enabled
                      ? "text-xs text-emerald-400"
                      : "text-xs text-zinc-500"
                  }
                >
                  {monitor.enabled ? "Enabled" : "Paused"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-5">
            <h2 className="text-sm font-semibold text-white">Recent checks</h2>

            <p className="mt-1 text-xs text-zinc-600">
              Latest monitoring results from MongoDB
            </p>
          </div>

          <div>
            {history.length === 0 ? (
              <div className="px-5 py-14 text-center text-xs text-zinc-600">
                No check history yet.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4 last:border-b-0"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      item.success
                        ? "bg-emerald-500/[0.08] text-emerald-400"
                        : "bg-red-500/[0.08] text-red-400"
                    }`}
                  >
                    {item.success ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <XCircle size={15} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-300">
                      HTTP {item.statusCode ?? "ERR"}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-zinc-600">
                      {item.errorMessage ?? "Request completed successfully"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-zinc-300">
                      {item.responseTime} ms
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-600">
                      {formatRelative(item.checkedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Incidents</h2>

                <p className="mt-1 text-xs text-zinc-600">Monitor incidents</p>
              </div>

              <AlertTriangle size={16} className="text-zinc-600" />
            </div>
          </div>

          {incidents.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <CheckCircle2 size={28} className="mx-auto text-emerald-400" />

              <p className="mt-3 text-sm text-zinc-400">
                No incidents recorded
              </p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div
                key={incident.id}
                className="border-b border-white/[0.05] px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-zinc-200">
                    {incident.title}
                  </p>

                  <span
                    className={`text-[10px] font-medium uppercase ${
                      incident.status === "RESOLVED"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {incident.status}
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  {incident.errorMessage ??
                    incident.description ??
                    "Monitor incident"}
                </p>

                <p className="mt-2 text-[10px] text-zinc-700">
                  Started {formatDate(incident.startedAt)}
                </p>
              </div>
            ))
          )}
        </section>

        <footer className="border-t border-white/[0.06] py-8 text-[10px] text-zinc-700">
          API Monitoring System • Monitor Details
        </footer>
      </div>
    </main>
  );
}
