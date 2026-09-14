import type { Env } from "./types";

/** Constant-time string compare to avoid timing side-channels on the bearer token check. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAuthorized(request: Request, env: Env): boolean {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;
  if (!env.API_AUTH_TOKEN) return false;
  return timingSafeEqual(token, env.API_AUTH_TOKEN);
}
