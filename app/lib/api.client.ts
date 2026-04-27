import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';

import {
	clearTokens,
	getAccessToken,
	getRefreshToken,
	setTokens
} from '~/store/auth.store';

import type { paths } from './api.schema';

const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_BASE_URL;

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return null;

	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const res = await fetch(new URL('/api/auth/refresh', apiBaseUrl), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: refreshToken })
			});

			if (!res.ok) {
				clearTokens();
				return null;
			}

			const data = (await res.json()) as {
				access_token: string;
				refresh_token: string;
			};

			setTokens({
				accessToken: data.access_token,
				refreshToken: data.refresh_token
			});
			return data.access_token;
		} catch {
			return null;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

const fetchClient = createFetchClient<paths>({
	baseUrl: apiBaseUrl,
	fetch: async (request) => {
		const token = getAccessToken();
		const headers = new Headers(request.headers);

		if (token && !headers.has('Authorization')) {
			headers.set('Authorization', `Bearer ${token}`);
		}

		const res = await fetch(new Request(request, { headers }));

		if (res.status !== 401) return res;

		const newAccessToken = await refreshAccessToken();
		if (!newAccessToken) return res;

		const retryHeaders = new Headers(request.headers);
		retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

		return fetch(new Request(request, { headers: retryHeaders }));
	}
});

const $api = createClient(fetchClient);

export const apiFetch = fetchClient;

export default $api;
