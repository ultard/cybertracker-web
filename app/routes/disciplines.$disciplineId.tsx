import { Link, useParams } from 'react-router';

import $api from '~/lib/api.client';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

import type { Route } from './+types/disciplines.$disciplineId';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Дисциплина — CyberTracker' }];
}

export default function DisciplineDetailRoute() {
	const { disciplineId } = useParams();
	const id = Number(disciplineId);

	const { data, isLoading, isError } = $api.useQuery(
		'get',
		'/api/disciplines/{discipline_id}',
		{
			params: { path: { discipline_id: id } }
		},
		{ enabled: Number.isFinite(id) }
	);

	if (!Number.isFinite(id)) {
		return <p className="text-destructive">Некорректный ID</p>;
	}

	if (isLoading) {
		return <Skeleton className="h-40 w-full max-w-lg" />;
	}

	if (isError || !data) {
		return <p className="text-destructive">Дисциплина не найдена</p>;
	}

	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<Button variant="ghost" size="sm" asChild className="w-fit">
				<Link to="/disciplines">← К списку</Link>
			</Button>
			<Card>
				<CardHeader>
					<CardTitle>{data.name}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground whitespace-pre-wrap">
						{data.description || 'Описание не указано.'}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
