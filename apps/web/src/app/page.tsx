"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

import { motion } from "framer-motion";

import { getDashboard } from "../lib/api";

import type {
  DashboardData,
  IncidentSummary,
  MonitorSummary,
} from "@/types/dashboard";

import CreateMonitorModal from "@/components/dashboard/CreateMonitorModal";

function formatDate(date: string | null) {
  if (!date) return "Never";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelativeTime(date: string | null) {
  if (!date) return "Never";

  const diff = Date.now() - new Date(date).getTime();

  if (diff < 60_000) return "Just now";

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

function StatusBadge({ status }: { status: MonitorSummary["status"] }) {
  const config = {
    UP: {
      label: "Operational",
      className: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
      dot: "bg-emerald-400",
    },

    DOWN: {
      label: "Down",
      className: "border-red-500/20 bg-red-500/[0.08] text-red-400",
      dot: "bg-red-400",
    },

    DEGRADED: {
      label: "Degraded",
      className: "border-amber-500/20 bg-amber-500/[0.08] text-amber-400",
      dot: "bg-amber-400",
    },

    UNKNOWN: {
      label: "Unknown",
      className: "border-zinc-500/20 bg-zinc-500/[0.08] text-zinc-400",
      dot: "bg-zinc-400",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      {config.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.035]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-zinc-600">{subtitle}</p>
        </div>

        <div
          className={`rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5 ${
            accent ?? "text-zinc-400"
          }`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

/*
 * Monitor rows are clickable.
 *
 * Clicking a monitor navigates to:
 *
 * /monitors/<monitor-id>
 *
 * Example:
 *
 * /monitors/cmujibsgv0001mokkbcf5v552
 */
function MonitorRow({ monitor }: { monitor: MonitorSummary }) {
  return (
    <Link
      href={`/monitors/${monitor.id}`}
      className="block"
      aria-label={`Open details for ${monitor.name}`}
    >
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="group flex cursor-pointer items-center gap-4 border-b border-white/[0.05] px-5 py-4 last:border-b-0 transition-colors hover:bg-white/[0.035]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] transition group-hover:border-white/[0.12] group-hover:bg-white/[0.05]">
            <Activity
              size={16}
              className={
                monitor.status === "UP"
                  ? "text-emerald-400"
                  : monitor.status === "DOWN"
                    ? "text-red-400"
                    : "text-amber-400"
              }
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white">
                {monitor.name}
              </p>

              {!monitor.enabled && (
                <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
                  PAUSED
                </span>
              )}
            </div>

            <p className="mt-0.5 max-w-[400px] truncate text-xs text-zinc-600">
              {monitor.url}
            </p>
          </div>
        </div>

        <div className="hidden w-24 text-right md:block">
          <p className="text-xs font-medium text-zinc-300">
            {monitor.uptime.toFixed(2)}%
          </p>

          <p className="mt-1 text-[10px] text-zinc-600">uptime</p>
        </div>

        <div className="hidden w-28 text-right lg:block">
          <p className="text-xs text-zinc-300">
            {monitor.totalChecks.toLocaleString()}
          </p>

          <p className="mt-1 text-[10px] text-zinc-600">checks</p>
        </div>

        <div className="hidden w-28 text-right xl:block">
          <p className="text-xs text-zinc-400">
            {formatRelativeTime(monitor.lastCheckedAt)}
          </p>

          <p className="mt-1 text-[10px] text-zinc-600">last check</p>
        </div>

        <div className="w-28 text-right">
          <StatusBadge status={monitor.status} />
        </div>
      </motion.div>
    </Link>
  );
}

function IncidentRow({ incident }: { incident: IncidentSummary }) {
  const isResolved = incident.status === "RESOLVED";

  return (
    <div className="flex gap-3 border-b border-white/[0.05] px-5 py-4 last:border-b-0">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isResolved
            ? "bg-emerald-500/[0.08] text-emerald-400"
            : "bg-red-500/[0.08] text-red-400"
        }`}
      >
        {isResolved ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium text-zinc-200">
            {incident.title}
          </p>

          <span
            className={`shrink-0 text-[10px] font-medium uppercase ${
              isResolved ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {incident.status}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-zinc-600">
          {incident.monitor?.name ?? "Unknown monitor"}
        </p>

        <p className="mt-1 text-[10px] text-zinc-700">
          {formatDate(incident.startedAt)}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [createMonitorOpen, setCreateMonitorOpen] = useState(false);

  const loadDashboard = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await getDashboard();

      if (response?.success && response.dashboard) {
        setDashboard(response.dashboard);
      } else {
        throw new Error("Invalid dashboard response");
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);

      setError("Unable to connect to the monitoring API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * Start the initial dashboard request asynchronously.
   *
   * The timeout prevents the React ESLint
   * set-state-in-effect warning.
   */
  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    const interval = window.setInterval(() => {
      void loadDashboard();
    }, 10_000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  if (loading && !dashboard) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse">
            <div className="h-7 w-64 rounded-lg bg-white/[0.06]" />

            <div className="mt-3 h-4 w-96 rounded bg-white/[0.04]" />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 rounded-2xl bg-white/[0.025]" />
              ))}
            </div>

            <div className="mt-6 h-96 rounded-2xl bg-white/[0.025]" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-8 text-center">
          <XCircle size={36} className="mx-auto text-red-400" />

          <h1 className="mt-4 text-lg font-semibold">Dashboard unavailable</h1>

          <p className="mt-2 text-sm text-zinc-500">{error}</p>

          <button
            onClick={() => void loadDashboard(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { overview, checks, monitors, recentIncidents } = dashboard;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Zap size={17} />
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  API Monitoring
                </h1>

                <p className="text-xs text-zinc-600">
                  Real-time observability platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateMonitorOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200"
            >
              <Plus size={15} />
              Add monitor
            </button>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            <div>
              <p className="text-sm font-medium text-zinc-200">
                Monitoring system operational
              </p>

              <p className="mt-0.5 text-xs text-zinc-600">
                Automatically refreshing every 10 seconds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Clock3 size={13} />
            Live monitoring
          </div>
        </motion.div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total monitors"
            value={overview.totalMonitors}
            subtitle={`${overview.upMonitors} currently operational`}
            icon={<Server size={17} />}
            accent="text-blue-400"
          />

          <StatCard
            title="Uptime"
            value={`${checks.uptime.toFixed(2)}%`}
            subtitle={`${checks.successful.toLocaleString()} successful checks`}
            icon={<TrendingUp size={17} />}
            accent="text-emerald-400"
          />

          <StatCard
            title="Active incidents"
            value={overview.activeIncidents}
            subtitle={`${overview.downMonitors} monitors currently down`}
            icon={<AlertTriangle size={17} />}
            accent="text-amber-400"
          />

          <StatCard
            title="Total checks"
            value={checks.total.toLocaleString()}
            subtitle={`${checks.failed.toLocaleString()} failed checks`}
            icon={<Database size={17} />}
            accent="text-purple-400"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">System health</p>

                <p className="mt-1 text-xs text-zinc-600">
                  Current monitor distribution
                </p>
              </div>

              <ShieldCheck size={18} className="text-emerald-400" />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-500">Operational</span>

                  <span className="text-emerald-400">
                    {overview.upMonitors}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{
                      width: `${
                        overview.totalMonitors
                          ? (overview.upMonitors / overview.totalMonitors) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-500">Down</span>

                  <span className="text-red-400">{overview.downMonitors}</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{
                      width: `${
                        overview.totalMonitors
                          ? (overview.downMonitors / overview.totalMonitors) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-500">Degraded</span>

                  <span className="text-amber-400">
                    {overview.degradedMonitors}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${
                        overview.totalMonitors
                          ? (overview.degradedMonitors /
                              overview.totalMonitors) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Check statistics
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Monitoring activity
                </p>
              </div>

              <Activity size={18} className="text-blue-400" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Total
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {checks.total.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Successful
                </p>

                <p className="mt-2 text-xl font-semibold text-emerald-400">
                  {checks.successful.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Failed
                </p>

                <p className="mt-2 text-xl font-semibold text-red-400">
                  {checks.failed.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Success rate
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {checks.uptime.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Incident overview
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Current platform state
                </p>
              </div>

              <AlertTriangle
                size={18}
                className={
                  overview.activeIncidents > 0
                    ? "text-red-400"
                    : "text-emerald-400"
                }
              />
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-white">
                    {overview.activeIncidents}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">active incidents</p>
                </div>

                {overview.activeIncidents === 0 ? (
                  <div className="rounded-full bg-emerald-500/[0.08] px-3 py-1.5 text-xs text-emerald-400">
                    All clear
                  </div>
                ) : (
                  <div className="rounded-full bg-red-500/[0.08] px-3 py-1.5 text-xs text-red-400">
                    Attention required
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <div className="flex-1 rounded-xl bg-red-500/[0.06] p-3">
                  <p className="text-[10px] text-zinc-600">Down</p>

                  <p className="mt-1 text-lg font-semibold text-red-400">
                    {overview.downMonitors}
                  </p>
                </div>

                <div className="flex-1 rounded-xl bg-amber-500/[0.06] p-3">
                  <p className="text-[10px] text-zinc-600">Degraded</p>

                  <p className="mt-1 text-lg font-semibold text-amber-400">
                    {overview.degradedMonitors}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Monitors</h2>

              <p className="mt-1 text-xs text-zinc-600">
                Live API health and performance
              </p>
            </div>

            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-500">
              {monitors.length} total
            </span>
          </div>

          {monitors.length > 0 ? (
            <div>
              {monitors.map((monitor) => (
                <MonitorRow key={monitor.id} monitor={monitor} />
              ))}
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <Server size={28} className="mx-auto text-zinc-700" />

              <p className="mt-3 text-sm text-zinc-400">No monitors yet</p>

              <p className="mt-1 text-xs text-zinc-700">
                Create your first monitor to start tracking an API.
              </p>

              <button
                type="button"
                onClick={() => setCreateMonitorOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black"
              >
                <Plus size={14} />
                Create monitor
              </button>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Recent incidents
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Latest monitor events
                </p>
              </div>

              <AlertTriangle size={16} className="text-zinc-600" />
            </div>

            {recentIncidents.length > 0 ? (
              recentIncidents
                .slice(0, 6)
                .map((incident) => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))
            ) : (
              <div className="px-5 py-14 text-center">
                <CheckCircle2 size={28} className="mx-auto text-emerald-400" />

                <p className="mt-3 text-sm text-zinc-400">
                  No incidents recorded
                </p>

                <p className="mt-1 text-xs text-zinc-700">
                  Your monitored APIs are currently healthy.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Monitoring infrastructure
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Current platform components
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {[
                {
                  name: "PostgreSQL",
                  description: "Application database",
                  status: "Connected",
                },
                {
                  name: "MongoDB",
                  description: "Monitoring history",
                  status: "Connected",
                },
                {
                  name: "RabbitMQ",
                  description: "Monitoring job queue",
                  status: "Connected",
                },
                {
                  name: "Redis",
                  description: "Cache & distributed state",
                  status: "Ready",
                },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />

                    <div>
                      <p className="text-xs font-medium text-zinc-300">
                        {service.name}
                      </p>

                      <p className="mt-0.5 text-[10px] text-zinc-700">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-400">
                    {service.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Clock3 size={14} className="text-zinc-600" />

                <p className="text-xs text-zinc-500">Monitoring cadence</p>
              </div>

              <p className="mt-2 text-sm text-zinc-300">
                Checks are scheduled automatically based on each monitor&apos;s
                configured interval.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/[0.06] py-8 text-[10px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>API Monitoring System</span>

          <span>Real-time observability • {monitors.length} monitors</span>
        </footer>
      </div>

      <CreateMonitorModal
        open={createMonitorOpen}
        onClose={() => setCreateMonitorOpen(false)}
        onCreated={() => {
          void loadDashboard(true);
        }}
      />
    </main>
  );
}
