import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';

import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: 'CyberTracker' },
		{ name: 'description', content: 'Киберспортивные турниры и арена' }
	];
}

export default function Home() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-semibold tracking-tight">CyberTracker</h1>
				<p className="text-muted-foreground text-lg">
					Просматривайте турниры, дисциплины и управляйте соревнованиями.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Турниры</CardTitle>
						<CardDescription>Каталог и расписание</CardDescription>
					</CardHeader>
					<div className="px-6 pb-6">
						<Button asChild>
							<Link to="/tournaments">Открыть турниры</Link>
						</Button>
					</div>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Дисциплины</CardTitle>
						<CardDescription>Игры и направления</CardDescription>
					</CardHeader>
					<div className="px-6 pb-6">
						<Button asChild variant="outline">
							<Link to="/disciplines">Список дисциплин</Link>
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
