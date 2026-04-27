import { useState } from 'react';
import { Navigate } from 'react-router';

import $api from '~/lib/api.client';
import { canViewAudit } from '~/lib/roles';

import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';

import { useMe } from '~/hooks/use-me';

import type { Route } from './+types/staff-audit';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Аудит — CyberTracker' }];
}

export default function StaffAuditRoute() {
	const { data: me, isLoading: meLoad } = useMe();
	const [skip, setSkip] = useState(0);
	const limit = 50;
	const [entity, setEntity] = useState('');
	const [userId, setUserId] = useState('');
	const [applied, setApplied] = useState<{
		entity?: string;
		user_id?: number;
	}>({});

	const { data, isLoading, refetch } = $api.useQuery('get', '/api/audit', {
		params: {
			query: {
				skip,
				limit,
				entity: applied.entity ?? null,
				user_id: applied.user_id ?? null
			}
		}
	});

	function apply(e: React.FormEvent) {
		e.preventDefault();
		setSkip(0);
		const uid = userId.trim() ? Number(userId) : undefined;
		setApplied({
			entity: entity.trim() || undefined,
			user_id: Number.isFinite(uid) ? uid : undefined
		});
	}

	if (meLoad) {
		return <Skeleton className="h-48 w-full" />;
	}

	if (!canViewAudit(me?.role)) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col gap-8">
			<h1 className="text-2xl font-semibold">Журнал аудита</h1>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Фильтры</CardTitle>
					<CardDescription>
						skip/limit и фильтр по сущности и пользователю
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={apply}>
						<FieldGroup className="grid gap-4 sm:grid-cols-3">
							<Field>
								<FieldLabel>Сущность</FieldLabel>
								<Input
									value={entity}
									onChange={(e) => setEntity(e.target.value)}
									placeholder="Tournament"
								/>
							</Field>
							<Field>
								<FieldLabel>User ID</FieldLabel>
								<Input
									inputMode="numeric"
									value={userId}
									onChange={(e) => setUserId(e.target.value)}
								/>
							</Field>
							<div className="flex items-end gap-2">
								<Button type="submit">Применить</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => refetch()}
								>
									Обновить
								</Button>
							</div>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
			<div className="flex flex-wrap items-center gap-4">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={skip < limit}
					onClick={() => setSkip(Math.max(0, skip - limit))}
				>
					Назад
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={!data || data.length < limit}
					onClick={() => setSkip(skip + limit)}
				>
					Вперёд
				</Button>
				<span className="text-muted-foreground text-sm">skip={skip}</span>
			</div>
			{isLoading ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Действие</TableHead>
								<TableHead>Сущность</TableHead>
								<TableHead>Entity ID</TableHead>
								<TableHead>Время</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.map((row) => (
								<TableRow key={row.id}>
									<TableCell>{row.id}</TableCell>
									<TableCell>{row.user_id ?? '—'}</TableCell>
									<TableCell>{row.action}</TableCell>
									<TableCell>{row.entity}</TableCell>
									<TableCell>{row.entity_id ?? '—'}</TableCell>
									<TableCell className="whitespace-nowrap text-xs">
										{row.created_at ? String(row.created_at) : '—'}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
