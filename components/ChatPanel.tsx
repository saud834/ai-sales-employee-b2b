"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Project } from "@/lib/types";

const SUGGESTIONS = [
  "Make the navbar sticky",
  "Make it feel more luxurious",
  "Add a customer reviews section",
  "Change the primary color to #000000",
  "Add a contact page",
];

export default function ChatPanel({
  projectId,
  initialMessages,
  onProjectUpdated,
}: {
  projectId: string;
  initialMessages: ChatMessage[];
  onProjectUpdated: (project: Project) => void;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    const tempId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, projectId, role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    try {
      const res = await fetch(`/api/projects/${projectId}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong");
      onProjectUpdated(body.project);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-a`,
          projectId,
          role: "assistant",
          content: body.summary,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-e`,
          projectId,
          role: "assistant",
          content: `I couldn't apply that: ${err instanceof Error ? err.message : "unknown error"}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Tell the AI what to change. It edits the live site directly &mdash; try one of the
            suggestions below.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-500">Thinking&hellip;</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Make the hero section more premium..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
