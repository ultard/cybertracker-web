import { beforeEach, describe, expect, it } from 'vitest';

import {
	clearTokens,
	getAccessToken,
	getRefreshToken,
	setTokens,
	useAuthStore
} from './auth.store';

describe('auth store', () => {
	beforeEach(() => {
		localStorage.clear();
		useAuthStore.setState({ accessToken: null, refreshToken: null });
	});

	it('starts with null tokens', () => {
		expect(getAccessToken()).toBeNull();
		expect(getRefreshToken()).toBeNull();
	});

	it('setTokens stores access and refresh', () => {
		setTokens({ accessToken: 'access-abc', refreshToken: 'refresh-xyz' });
		expect(getAccessToken()).toBe('access-abc');
		expect(getRefreshToken()).toBe('refresh-xyz');
	});

	it('setTokens without refresh clears refresh token', () => {
		setTokens({ accessToken: 'a1', refreshToken: 'r1' });
		setTokens({ accessToken: 'a2' });
		expect(getAccessToken()).toBe('a2');
		expect(getRefreshToken()).toBeFalsy();
	});

	it('clearTokens resets state', () => {
		setTokens({ accessToken: 'a', refreshToken: 'r' });
		clearTokens();
		expect(getAccessToken()).toBeNull();
		expect(getRefreshToken()).toBeNull();
	});
});
