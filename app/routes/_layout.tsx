import { Outlet } from 'react-router';

import { AppHeader } from '~/components/app-header';

export default function AppLayout() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<AppHeader />
			<main className="container mx-auto flex-1 px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}
