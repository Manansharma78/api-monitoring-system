"use client";

import { FormEvent, useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import axios from "axios";
import { api } from "../../lib/api";

interface CreateMonitorModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const selectClass =
  "w-full rounded-xl border border-white/[0.08] bg-[#151515] px-4 py-3 text-sm text-white outline-none transition focus:border-white/[0.18]";

const optionClass = "bg-[#151515] text-white";

export default function CreateMonitorModal({
  open,
  onClose,
  onCreated,
}: CreateMonitorModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [enabled, setEnabled] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError("Monitor name is required.");
      return;
    }

    if (!url.trim()) {
      setError("URL is required.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/monitors", {
        name: name.trim(),
        url: url.trim(),
        method,
        intervalSeconds,
        timeoutMs,
        expectedStatusCode,
        enabled,
      });

      setName("");
      setUrl("");
      setMethod("GET");
      setIntervalSeconds(60);
      setTimeoutMs(10000);
      setExpectedStatusCode(200);
      setEnabled(true);

      onCreated();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to create monitor:", err);

      if (axios.isAxiosError(err)) {
        const message =
          typeof err.response?.data?.message === "string"
            ? err.response.data.message
            : "Failed to create monitor.";

        setError(message);
      } else {
        setError("Failed to create monitor.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0b] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              Create monitor
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Configure a new API health check.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Monitor name */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Monitor name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Production API"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-white/[0.18]"
            />
          </div>

          {/* URL */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Endpoint URL
            </label>

            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://api.example.com/health"
              type="url"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-white/[0.18]"
            />
          </div>

          {/* Method + Expected status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                HTTP method
              </label>

              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className={selectClass}
                style={{
                  colorScheme: "dark",
                }}
              >
                <option value="GET" className={optionClass}>
                  GET
                </option>

                <option value="POST" className={optionClass}>
                  POST
                </option>

                <option value="PUT" className={optionClass}>
                  PUT
                </option>

                <option value="PATCH" className={optionClass}>
                  PATCH
                </option>

                <option value="DELETE" className={optionClass}>
                  DELETE
                </option>

                <option value="HEAD" className={optionClass}>
                  HEAD
                </option>

                <option value="OPTIONS" className={optionClass}>
                  OPTIONS
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Expected status
              </label>

              <input
                type="number"
                min={100}
                max={599}
                value={expectedStatusCode}
                onChange={(event) =>
                  setExpectedStatusCode(Number(event.target.value))
                }
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* Interval + Timeout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Check interval
              </label>

              <select
                value={intervalSeconds}
                onChange={(event) =>
                  setIntervalSeconds(Number(event.target.value))
                }
                className={selectClass}
                style={{
                  colorScheme: "dark",
                }}
              >
                <option value={10} className={optionClass}>
                  Every 10 seconds
                </option>

                <option value={30} className={optionClass}>
                  Every 30 seconds
                </option>

                <option value={60} className={optionClass}>
                  Every 1 minute
                </option>

                <option value={300} className={optionClass}>
                  Every 5 minutes
                </option>

                <option value={600} className={optionClass}>
                  Every 10 minutes
                </option>

                <option value={1800} className={optionClass}>
                  Every 30 minutes
                </option>

                <option value={3600} className={optionClass}>
                  Every hour
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Timeout
              </label>

              <select
                value={timeoutMs}
                onChange={(event) => setTimeoutMs(Number(event.target.value))}
                className={selectClass}
                style={{
                  colorScheme: "dark",
                }}
              >
                <option value={5000} className={optionClass}>
                  5 seconds
                </option>

                <option value={10000} className={optionClass}>
                  10 seconds
                </option>

                <option value={30000} className={optionClass}>
                  30 seconds
                </option>

                <option value={60000} className={optionClass}>
                  60 seconds
                </option>
              </select>
            </div>
          </div>

          {/* Enable monitoring */}
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
            <div>
              <p className="text-sm text-white">Enable monitoring</p>

              <p className="mt-0.5 text-xs text-zinc-600">
                Start checking this API automatically.
              </p>
            </div>

            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={15} />
                  Create monitor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
