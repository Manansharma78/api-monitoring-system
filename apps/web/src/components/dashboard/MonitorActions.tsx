"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Play, Pause, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";

interface Monitor {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  method: string;
  enabled: boolean;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;
}

interface MonitorActionsProps {
  monitor: Monitor;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function MonitorActions({
  monitor,
  onUpdated,
  onDeleted,
}: MonitorActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [name, setName] = useState(monitor.name);
  const [description, setDescription] = useState(monitor.description ?? "");
  const [url, setUrl] = useState(monitor.url);
  const [method, setMethod] = useState(monitor.method);
  const [intervalSeconds, setIntervalSeconds] = useState(
    String(monitor.intervalSeconds),
  );
  const [timeoutMs, setTimeoutMs] = useState(String(monitor.timeoutMs));
  const [expectedStatusCode, setExpectedStatusCode] = useState(
    String(monitor.expectedStatusCode),
  );

  async function handleSave() {
    try {
      setSaving(true);

      await api.patch(`/monitors/${monitor.id}`, {
        name: name.trim(),
        description: description.trim() || null,
        url: url.trim(),
        method,
        intervalSeconds: Number(intervalSeconds),
        timeoutMs: Number(timeoutMs),
        expectedStatusCode: Number(expectedStatusCode),
        enabled: monitor.enabled,
      });

      setEditOpen(false);
      onUpdated();
    } catch (error) {
      console.error("Failed to update monitor:", error);
      alert("Failed to update monitor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    try {
      setToggling(true);

      await api.patch(`/monitors/${monitor.id}`, {
        enabled: !monitor.enabled,
      });

      onUpdated();
    } catch (error) {
      console.error("Failed to change monitor state:", error);
      alert("Failed to change monitoring state.");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);

      await api.delete(`/monitors/${monitor.id}`);

      setDeleteOpen(false);
      onDeleted();
    } catch (error) {
      console.error("Failed to delete monitor:", error);
      alert("Failed to delete monitor.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
        >
          <Pencil size={13} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={toggling}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            monitor.enabled
              ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-400 hover:bg-amber-500/[0.1]"
              : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/[0.1]"
          }`}
        >
          {toggling ? (
            <Loader2 size={13} className="animate-spin" />
          ) : monitor.enabled ? (
            <Pause size={13} />
          ) : (
            <Play size={13} />
          )}

          {monitor.enabled ? "Pause" : "Resume"}
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3.5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/[0.09]"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0b0b0b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Edit monitor
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Update monitoring configuration
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500">Monitor name</label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-white/[0.18]"
                    placeholder="My API"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500">Description</label>

                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-white/[0.18]"
                    placeholder="What does this monitor check?"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500">URL</label>

                  <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-white/[0.18]"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-zinc-500">HTTP method</label>

                    <select
                      value={method}
                      onChange={(event) => setMethod(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#111] px-3.5 py-3 text-sm text-white outline-none focus:border-white/[0.18]"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                      <option value="HEAD">HEAD</option>
                      <option value="OPTIONS">OPTIONS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500">
                      Expected status
                    </label>

                    <input
                      type="number"
                      value={expectedStatusCode}
                      onChange={(event) =>
                        setExpectedStatusCode(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none focus:border-white/[0.18]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-zinc-500">
                      Check interval (seconds)
                    </label>

                    <input
                      type="number"
                      min="5"
                      value={intervalSeconds}
                      onChange={(event) =>
                        setIntervalSeconds(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none focus:border-white/[0.18]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500">
                      Timeout (milliseconds)
                    </label>

                    <input
                      type="number"
                      min="1000"
                      value={timeoutMs}
                      onChange={(event) => setTimeoutMs(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none focus:border-white/[0.18]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0b0b0b] p-6 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/[0.08] text-red-400">
              <Trash2 size={18} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-white">
              Delete monitor?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This will permanently delete{" "}
              <span className="font-medium text-zinc-300">{monitor.name}</span>{" "}
              and its PostgreSQL monitor record.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Delete monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
