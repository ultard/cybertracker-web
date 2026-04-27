import { useState } from 'react';
import { Link } from 'react-router';

import $api from '~/lib/api.client';

import { PaginationControls } from '~/components/pagination-controls';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';

import type { Route } from './+types/disciplines';

const PAGE = 20;

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Дисциплины — CyberTracker' }];
}

export default function DisciplinesRoute() {
	const [skip, setSkip] = useState(0);
	const [nameFilter, setNameFilter] = useState('');
	const [appliedName, setAppliedName] = useState<string | undefined>(undefined);

	const { data, isLoading } = $api.useQuery('get', '/api/disciplines', {
		params: {
			query: {
				skip,
				limit: PAGE,
				name: appliedName ?? null
			}
		}
	});

	function applyFilter(e: React.FormEvent) {
		e.preventDefault();
		setSkip(0);
		setAppliedName(nameFilter.trim() || undefined);
	}

	return (
		<div className="flex flex-col gap-8">
			<h1 className="text-2xl font-semibold">Дисциплины</h1>
			<form onSubmit={applyFilter} className="max-w-md">
				<FieldGroup className="flex flex-col gap-4 sm:flex-row sm:items-end">
					<Field className="flex-1">
						<FieldLabel htmlFor="disc-name">Название</FieldLabel>
						<Input
							id="disc-name"
							value={nameFilter}
							onChange={(e) => setNameFilter(e.target.value)}
							placeholder="Фильтр по имени"
						/>
					</Field>
					<Button type="submit">Искать</Button>
				</FieldGroup>
			</form>
			{isLoading ? (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			) : (
				<>
					<ul className="grid gap-4 sm:grid-cols-2">
						{data?.items.map((d) => (
							<li key={d.id}>
								<Link to={`/disciplines/${d.id}`}>
									<Card className="transition-colors hover:bg-muted/40">
										<CardHeader>
											<CardTitle className="text-base">{d.name}</CardTitle>
											<CardDescription className="line-clamp-2">
												{d.description || '—'}
											</CardDescription>
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
