import type { Env } from "../types";
import { tools } from "./tools";
import { ValidationError } from "../lib/pipeline";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

/**
 * Minimal MCP server over the Streamable HTTP transport: stateless (no session id / SSE), a single
 * JSON response per JSON-RPC request. Supports initialize, tools/list, and tools/call — enough for
 * any MCP client to discover and invoke the file-gateway tools.
 */
export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(rpcError(null, -32700, "Parse error"), { status: 400 });
  }

  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return Response.json(rpcError(body.id ?? null, -32600, "Invalid Request"), { status: 400 });
  }

  try {
    switch (body.method) {
      case "initialize":
        return Response.json(
          rpcResult(body.id, {
            protocolVersion: "2024-11-05",
            serverInfo: { name: "ai-file-gateway", version: "1.0.0" },
            capabilities: { tools: {} },
          })
        );

      case "notifications/initialized":
        return new Response(null, { status: 202 });

      case "tools/list":
        return Response.json(
          rpcResult(
            body.id,
            {
              tools: tools.map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
              })),
            }
          )
        );

      case "tools/call": {
        const name = String(body.params?.name ?? "");
        const args = (body.params?.arguments as Record<string, unknown>) ?? {};
        const tool = tools.find((t) => t.name === name);
        if (!tool) return Response.json(rpcError(body.id, -32602, `Unknown tool "${name}"`));

        try {
          const result = await tool.handler(env, args);
          return Response.json(
            rpcResult(body.id, {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            })
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const isValidation = err instanceof ValidationError;
          return Response.json(
            rpcResult(body.id, {
              content: [{ type: "text", text: `Error: ${message}` }],
              isError: true,
            }),
            { status: isValidation ? 200 : 200 }
          );
        }
      }

      default:
        return Response.json(rpcError(body.id, -32601, `Method not found: ${body.method}`));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(rpcError(body.id, -32603, message), { status: 500 });
  }
}
