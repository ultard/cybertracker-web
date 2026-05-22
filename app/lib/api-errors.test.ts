import { describe, expect, it } from 'vitest';

import { errorMessageFromUnknown, readApiErrorMessage } from './api-errors';

describe('readApiErrorMessage', () => {
	it('reads message from error envelope', async () => {
		const res = new Response(
			JSON.stringify({ error: { message: 'Invalid credentials' } }),
			{ status: 401, statusText: 'Unauthorized' }
		);
		await expect(readApiErrorMessage(res)).resolves.toBe('Invalid credentials');
	});

	it('falls back to statusText when body is not JSON', async () => {
		const res = new Response('not json', {
			status: 500,
			statusText: 'Internal Server Error'
		});
		await expect(readApiErrorMessage(res)).resolves.toBe('Internal Server Error');
	});

	it('falls back to HTTP code when statusText empty', async () => {
		const res = new Response('bad', { status: 418, statusText: '' });
		await expect(readApiErrorMessage(res)).resolves.toBe('HTTP 418');
	});
});

describe('errorMessageFromUnknown', () => {
	it('returns Error.message', () => {
		expect(errorMessageFromUnknown(new Error('boom'))).toBe('boom');
	});

	it('returns message field from object', () => {
		expect(errorMessageFromUnknown({ message: 'from object' })).toBe('from object');
	});

	it('returns default for unknown values', () => {
		expect(errorMessageFromUnknown(42)).toBe('Something went wrong');
	});
});
