import { useState } from 'react';
import { Link, Navigate } from 'react-router';

import $api from '~/lib/api.client';
import { canOrganize } from '~/lib/roles';

import { PaginationControls } from '~/components/pagination-controls';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

import { useMe } from '~/hooks/use-me';

import type { Route } from './+types/org-tournaments';

const PAGE = 20;

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Кабинет организатора — CyberTracker' }];
}

export default function OrgTournamentsRoute() {
	const { data: me, isLoading: meLoad } = useMe();
	const [skip, setSkip] = useState(0);

	const { data, isLoading } = $api.useQuery('get', '/api/tournaments', {
		params: { query: { skip, limit: PAGE } }
	});

	if (meLoad) {
		return <Skeleton className="h-40 w-full" />;
	}

	if (!canOrganize(me?.role)) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold">Турниры (организатор)</h1>
				<Button asChild>
					<Link to="/org/tournaments/new">Новый турнир</Link>
				</Button>
			</div>
			{isLoading ? (
				<Skeleton className="h-48 w-full" />
			) : (
				<>
					<ul className="grid gap-3">
						{data?.items.map((t) => (
							<li key={t.id}>
								<Card>
									<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
										<div>
											<CardTitle className="text-base">
												<Link
													to={`/tournaments/${t.id}`}
													className="hover:underline"
												>
													{t.name}
												</Link>
											</CardTitle>
											<CardDescription>
												{t.discipline_name ?? `#${t.discipline_id}`}
											</CardDescription>
										</div>
										<div className="flex flex-wrap gap-2">
											<Badge>{t.status}</Badge>
											<Button size="sm" variant="outline" asChild>
												<Link to={`/org/tournaments/${t.id}/edit`}>
													Редактировать
												</Link>
											</Button>
										</div>
									</CardHeader>
								</Card>
							</li>
						))}
					</ul>
					{data ? (
						<PaginationControls
							page={{ skip: data.skip, limit: data.limit, total: data.total }}
							onPageChange={setSkip}
						/>
					) : null}
				</>
			)}
		</div>
	);
}
