"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock3, Globe2 } from "lucide-react";

interface MonitorSummary {
  id: string;
  name: string;
  url: string;
  status: "UP" | "DOWN" | "DEGRADED" | (string & {});
  responseTime: number | null;
  uptime: number;
}

interface MonitorTableProps {
  monitors: MonitorSummary[];
}

function getStatusStyle(status: MonitorSummary["status"]) {
  switch (status) {
    case "UP":
      return {
        dot: "bg-emerald-400",
        text: "text-emerald-400",
        label: "Operational",
      };

    case "DOWN":
      return {
        dot: "bg-red-400",
        text: "text-red-400",
        label: "Down",
      };

    case "DEGRADED":
      return {
        dot: "bg-amber-400",
        text: "text-amber-400",
        label: "Degraded",
      };

    default:
      return {
        dot: "bg-zinc-500",
        text: "text-zinc-400",
        label: "Unknown",
      };
  }
}

export default function MonitorTable({ monitors }: MonitorTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <h2 className="font-medium text-white">Monitors</h2>

          <p className="mt-1 text-xs text-zinc-500">Live API health</p>
        </div>

        <button
          type="button"
          className="rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {monitors.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No monitors yet.
          </div>
        ) : (
          monitors.map((monitor, index) => {
            const status = getStatusStyle(monitor.status);

            return (
              <motion.div
                key={monitor.id}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.04,
                }}
                className="group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${status.dot}`}
                    />

                    {monitor.status === "UP" && (
                      <span
                        className={`absolute inset-0 animate-ping rounded-full opacity-30 ${status.dot}`}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {monitor.name}
                      </p>

                      <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition group-hover:opacity-100" />
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                      <Globe2 className="h-3 w-3" />

                      <span className="truncate">{monitor.url}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock3 className="h-3.5 w-3.5" />

                    <span>
                      {monitor.responseTime ? `${monitor.responseTime}ms` : "—"}
                    </span>
                  </div>

                  <div className="w-20 text-right">
                    <p className="text-zinc-400">
                      {monitor.uptime.toFixed(2)}%
                    </p>

                    <p className={`mt-0.5 ${status.text}`}>{status.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
