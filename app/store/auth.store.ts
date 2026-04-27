import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
	accessToken: string | null;
	refreshToken: string | null;
	setTokens: (tokens: {
		accessToken: string;
		refreshToken?: string | null;
	}) => void;
	clearTokens: () => void;
};

const storage =
	typeof window === 'undefined'
		? undefined
		: createJSONStorage(() => window.localStorage);

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			accessToken: null,
			refreshToken: null,
			setTokens: ({ accessToken, refreshToken }) =>
				set({ accessToken, refreshToken }),
			clearTokens: () => set({ accessToken: null, refreshToken: null })
		}),
		{
			name: 'auth',
			storage,
			partialize: (s) => ({
				accessToken: s.accessToken,
				refreshToken: s.refreshToken
			})
		}
	)
);

export function getAccessToken(): string | null {
	return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
	return useAuthStore.getState().refreshToken;
}

export function setTokens(tokens: {
	accessToken: string;
	refreshToken?: string | null;
}) {
	return useAuthStore.getState().setTokens(tokens);
}

export function clearTokens() {
	return useAuthStore.getState().clearTokens();
}
