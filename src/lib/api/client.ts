import { ApiError, type ApiErrorBody } from "./types";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
}

type ApiInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export async function apiClient<T>(
  path: string,
  init: ApiInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
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
    credentials: "include",
    ...init,
    headers,
    body,
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
