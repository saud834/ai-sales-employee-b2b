import type { Env } from "../types";

const API_BASE = "https://api.github.com";

function headers(env: Env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ai-file-gateway-worker",
  };
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < arr.length; i += chunkSize) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Stores raw file bytes at `<GITHUB_STORAGE_DIR>/<path>` in the storage repo. Returns the blob sha. */
export async function putFile(
  env: Env,
  path: string,
  bytes: ArrayBuffer,
  message: string
): Promise<string> {
  const fullPath = `${env.GITHUB_STORAGE_DIR}/${path}`;
  const url = `${API_BASE}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${fullPath}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers(env), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: bytesToBase64(bytes),
      branch: env.GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub storage write failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { content: { sha: string } };
  return json.content.sha;
}

export async function getFile(env: Env, path: string): Promise<ArrayBuffer> {
  const fullPath = `${env.GITHUB_STORAGE_DIR}/${path}`;
  const url = `${API_BASE}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${fullPath}?ref=${env.GITHUB_BRANCH}`;

  const res = await fetch(url, { headers: headers(env) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub storage read failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { content: string; encoding: string };
  return base64ToBytes(json.content.replace(/\n/g, ""));
}

export async function deleteFile(env: Env, path: string, sha: string, message: string): Promise<void> {
  const fullPath = `${env.GITHUB_STORAGE_DIR}/${path}`;
  const url = `${API_BASE}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${fullPath}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...headers(env), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: env.GITHUB_BRANCH }),
  });

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`GitHub storage delete failed (${res.status}): ${body}`);
  }
}
