/** Shared API client — the only place raw fetch lives in the web app. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type TokenGetter = () => string | null;
type HouseholdGetter = () => string | null;
type QueryParams = Record<string, string | number | boolean | undefined | null>;

let getToken: TokenGetter = () => null;
let getHouseholdId: HouseholdGetter = () => null;

export function configureApiClient(options: {
  getToken: TokenGetter;
  getHouseholdId: HouseholdGetter;
}) {
  getToken = options.getToken;
  getHouseholdId = options.getHouseholdId;
}

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    params?: QueryParams;
    skipHousehold?: boolean;
    formData?: FormData;
  } = {}
): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${baseUrl}${path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!options.skipHousehold) {
    const householdId = getHouseholdId();
    if (householdId) headers["X-Household-Id"] = householdId;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), { method, headers, body });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String(
            Array.isArray((data as { message: unknown }).message)
              ? (data as { message: string[] }).message.join(", ")
              : (data as { message: string }).message
          )
        : null) || res.statusText;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  get: <T>(
    path: string,
    options?: {
      params?: QueryParams;
      skipHousehold?: boolean;
    }
  ) => request<T>("GET", path, options),

  post: <T>(
    path: string,
    body?: unknown,
    options?: { skipHousehold?: boolean; formData?: FormData }
  ) =>
    request<T>("POST", path, {
      body: options?.formData ? undefined : body,
      skipHousehold: options?.skipHousehold,
      formData: options?.formData,
    }),

  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }),

  delete: <T>(path: string) => request<T>("DELETE", path),
};
