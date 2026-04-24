/**
 * Extracts a human-readable error message from an axios response error.
 *
 * Handles the three message shapes produced by the backend:
 *   1. `details` array (Fastify schema-validation errors): joins each detail's message.
 *   2. `message` array (password-rule errors): joins the array items.
 *   3. `message` string (domain / auth errors): returns as-is.
 */
export function extractApiError(e: unknown): string {
    if (!e || typeof e !== 'object') return 'An unexpected error occurred';
    const err = e as any;
    const data = err?.response?.data;
    if (!data) return err?.message || 'An unexpected error occurred';

    if (Array.isArray(data.details) && data.details.length > 0) {
        return data.details
            .map((d: any) => d.message as string)
            .filter(Boolean)
            .join('; ');
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
        return (data.message as string[]).join('; ');
    }
    if (typeof data.message === 'string' && data.message) {
        return data.message;
    }
    return err?.message || 'An unexpected error occurred';
}
