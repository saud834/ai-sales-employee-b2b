import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import type { ChatMessage } from "@/lib/types";

interface ChatRow {
  id: string;
  project_id: string;
  role: string;
  content: string;
  created_at: string;
}

function rowToMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    role: row.role as "user" | "assistant",
    content: row.content,
    createdAt: row.created_at,
  };
}

export function addChatMessage(
  projectId: string,
  role: "user" | "assistant",
  content: string
): ChatMessage {
  const message: ChatMessage = {
    id: nanoid(12),
    projectId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO chat_messages (id, project_id, role, content, created_at)
       VALUES (@id, @projectId, @role, @content, @createdAt)`
    )
    .run(message);
  return message;
}

export function listChatMessages(projectId: string): ChatMessage[] {
  const rows = getDb()
    .prepare("SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC")
    .all(projectId) as ChatRow[];
  return rows.map(rowToMessage);
}
