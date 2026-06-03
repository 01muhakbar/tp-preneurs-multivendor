export type Seller2026MutationResult<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: Seller2026MutationError };

export type Seller2026MutationError = {
  message: string;
  code: string | null;
  status: number | null;
};

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function normalizeSeller2026Error(error: unknown): Seller2026MutationError {
  const source = readRecord(error);
  const response = readRecord(source.response);
  const data = readRecord(response.data);
  const status = Number(response.status);

  return {
    message:
      String(data.message || source.message || "Action failed. Please try again.").trim() ||
      "Action failed. Please try again.",
    code: data.code ? String(data.code) : null,
    status: Number.isFinite(status) && status > 0 ? status : null,
  };
}

export async function runSeller2026Mutation<T>(
  action: () => Promise<T>
): Promise<Seller2026MutationResult<T>> {
  try {
    const result = await action();
    return { ok: true, data: result, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: normalizeSeller2026Error(error),
    };
  }
}
