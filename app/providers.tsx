import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import queryClient from '~/lib/query.client';

import { Toaster } from '~/components/ui/sonner';

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<Toaster richColors position="top-center" />
		</QueryClientProvider>
	);
}
