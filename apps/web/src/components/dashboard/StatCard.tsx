"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Server } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  type: "monitors" | "up" | "uptime" | "incident";
  delay?: number;
}

const icons = {
  monitors: Server,
  up: CheckCircle2,
  uptime: Activity,
  incident: AlertTriangle,
};

export default function StatCard({
  title,
  value,
  description,
  type,
  delay = 0,
}: StatCardProps) {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        y: -3,
        transition: { duration: 0.2 },
      }}
      className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5">
          <Icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-white" />
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{description}</p>
    </motion.div>
  );
}
