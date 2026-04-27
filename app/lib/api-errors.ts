type ErrorEnvelope = {
	error?: {
		code?: string;
		message?: string;
		details?: unknown;
	};
};

export async function readApiErrorMessage(res: Response): Promise<string> {
	try {
		const json = (await res.json()) as ErrorEnvelope;
		if (json?.error?.message) return json.error.message;
	} catch {
		// ignore
	}
	return res.statusText || `HTTP ${res.status}`;
}

export function errorMessageFromUnknown(e: unknown): string {
	if (e instanceof Error) return e.message;
	if (typeof e === 'object' && e !== null && 'message' in e) {
		const m = (e as { message?: unknown }).message;
		if (typeof m === 'string') return m;
	}
	return 'Something went wrong';
}
