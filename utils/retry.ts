/**
 * Runs an async operation, retrying on failure with a short back-off.
 *
 * Used for the throwaway-account setup in fixtures: DemoBlaze is a shared demo
 * host that occasionally stalls a request past its timeout, and a setup step
 * failing for that reason should not be reported as a test failure.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  {
    attempts = 3,
    delayMs = 1_000,
    label = 'operation',
  }: {
    attempts?: number;
    delayMs?: number;
    label?: string;
  } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new Error(
    `${label} failed after ${attempts} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
