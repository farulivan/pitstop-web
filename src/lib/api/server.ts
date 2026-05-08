import "server-only";
import { cookies } from "next/headers";
import { ApiError, type ApiErrorBody } from "./types";

const SESSION_COOKIE = "pitstop_session";

function getBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:8080";
}

type ApiInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  next?: NextFetchRequestConfig;
};

export async function apiServer<T>(
  path: string,
  init: ApiInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const body =
    init.body &&
    !(init.body instanceof FormData) &&
    typeof init.body !== "string"
      ? JSON.stringify(init.body)
      : (init.body as BodyInit | null | undefined);

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
    body,
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    const errorBody = await safeJson<ApiErrorBody>(response);
    throw new ApiError(
      response.status,
      errorBody?.message ?? response.statusText,
      errorBody,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function safeJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}
