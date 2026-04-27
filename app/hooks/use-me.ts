import $api from '~/lib/api.client';

import { useAuthStore } from '~/store/auth.store';

export function useMe() {
	const accessToken = useAuthStore((s) => s.accessToken);
	return $api.useQuery(
		'get',
		'/api/auth/me',
		{},
		{ enabled: Boolean(accessToken) }
	);
}
