import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import $api from '~/lib/api.client';

import { clearTokens, getRefreshToken } from '~/store/auth.store';

export function useLogout() {
	const queryClient = useQueryClient();
	const mutation = $api.useMutation('post', '/api/auth/logout', {
		onSuccess: () => {
			clearTokens();
			queryClient.clear();
			toast.success('Вы вышли из аккаунта');
		},
		onError: () => {
			toast.error('Не удалось выйти');
		}
	});

	function logout() {
		const refresh_token = getRefreshToken();
		if (!refresh_token) {
			clearTokens();
			queryClient.clear();
			toast.success('Вы вышли из аккаунта');
			return;
		}
		mutation.mutate({ body: { refresh_token } });
	}

	return { logout, isPending: mutation.isPending };
}
