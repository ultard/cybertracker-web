import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import $api from '~/lib/api.client';
import type { TournamentStatus } from '~/lib/api.types';

import { PaginationControls } from '~/components/pagination-controls';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';

import type { Route } from './+types/tournaments';

const PAGE = 20;

const STATUSES: TournamentStatus[] = [
	'draft',
	'recruiting',
	'in_progress',
	'completed',
	'cancelled',
	'archived'
];

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Турниры — CyberTracker' }];
}

export default function TournamentsRoute() {
	const [skip, setSkip] = useState(0);
	const [nameFilter, setNameFilter] = useState('');
	const [disciplineIdStr, setDisciplineIdStr] = useState('');
	const [status, setStatus] = useState<TournamentStatus | 'all'>('all');
	const [applied, setApplied] = useState<{
		name?: string;
		discipline_id?: number;
		status?: TournamentStatus;
	}>({});

	const disciplineId = useMemo(() => {
		const n = Number(disciplineIdStr);
		return Number.isFinite(n) && disciplineIdStr !== '' ? n : undefined;
	}, [disciplineIdStr]);

	const { data, isLoading } = $api.useQuery('get', '/api/tournaments', {
		params: {
			query: {
				skip,
				limit: PAGE,
				name: applied.name ?? null,
				discipline_id: applied.discipline_id ?? null,
				status: applied.status ?? null
			}
		}
	});

	function applyFilter(e: React.FormEvent) {
		e.preventDefault();
		setSkip(0);
		setApplied({
			name: nameFilter.trim() || undefined,
			discipline_id: disciplineId,
			status: status === 'all' ? undefined : status
		});
	}

	return (
		<div className="flex flex-col gap-8">
			<h1 className="text-2xl font-semibold">Турниры</h1>
			<form onSubmit={applyFilter} className="flex flex-col gap-4">
				<FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Field>
						<FieldLabel htmlFor="t-name">Название</FieldLabel>
						<Input
							id="t-name"
							value={nameFilter}
							onChange={(e) => setNameFilter(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="t-disc">ID дисциплины</FieldLabel>
						<Input
							id="t-disc"
							inputMode="numeric"
							value={disciplineIdStr}
							onChange={(e) => setDisciplineIdStr(e.target.value)}
							placeholder="необязательно"
						/>
					</Field>
					<Field>
						<FieldLabel>Статус</FieldLabel>
						<Select
							value={status}
							onValueChange={(v) => setStatus(v as TournamentStatus | 'all')}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Все" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все</SelectItem>
								{STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<div className="flex items-end">
						<Button type="submit" className="w-full sm:w-auto">
							Применить
						</Button>
					</div>
				</FieldGroup>
			</form>
			{isLoading ? (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			) : (
				<>
					<ul className="grid gap-4">
						{data?.items.map((t) => (
							<li key={t.id}>
								<Link to={`/tournaments/${t.id}`}>
									<Card className="transition-colors hover:bg-muted/40">
										<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
											<div>
												<CardTitle className="text-base">{t.name}</CardTitle>
												<CardDescription>
													{t.discipline_name ??
														`Дисциплина #${t.discipline_id}`}
													{t.start_at
														? ` · ${new Date(t.start_at as string).toLocaleString()}`
														: ''}
												</CardDescription>
											</div>
											<Badge variant="secondary">{t.status}</Badge>
										</CardHeader>
									</Card>
								</Link>
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
