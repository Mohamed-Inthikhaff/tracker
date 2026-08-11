/** Shared API client — only fetch site in the capture app. */
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
  body?: unknown
): Promise<T> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const householdId = getHouseholdId();
  if (householdId) headers["X-Household-Id"] = householdId;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message
          )
        : res.statusText;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
};
