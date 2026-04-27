import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import type { components } from '~/lib/api.schema';
import { readApiErrorMessage } from '~/lib/api-errors';
import { canOrganize } from '~/lib/roles';

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';

import { useMe } from '~/hooks/use-me';

import type { Route } from './+types/org-tournament-edit';

type TT = components['schemas']['TournamentType'];
type TS = components['schemas']['TournamentStatus'];

function toLocalDatetimeValue(iso: string | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Редактирование турнира — CyberTracker' }];
}

export default function OrgTournamentEditRoute() {
	const { tournamentId } = useParams();
	const id = Number(tournamentId);
	const queryClient = useQueryClient();
	const { data: me, isLoading: meLoad } = useMe();

	const { data: t, isLoading: tLoad } = $api.useQuery(
		'get',
		'/api/tournaments/{tournament_id}',
		{ params: { path: { tournament_id: id } } },
		{ enabled: Number.isFinite(id) }
	);

	const [name, setName] = useState('');
	const [disciplineId, setDisciplineId] = useState('');
	const [tournamentType, setTournamentType] = useState<TT>('offline');
	const [startAt, setStartAt] = useState('');
	const [endAt, setEndAt] = useState('');
	const [prizePool, setPrizePool] = useState('');
	const [maxParticipants, setMaxParticipants] = useState('');
	const [status, setStatus] = useState<TS>('draft');

	useEffect(() => {
		if (t) {
			setName(t.name);
			setDisciplineId(String(t.discipline_id));
			setTournamentType(t.tournament_type as TT);
			setStartAt(toLocalDatetimeValue(t.start_at));
			setEndAt(toLocalDatetimeValue(t.end_at));
			setPrizePool(String(t.prize_pool));
			setMaxParticipants(String(t.max_participants));
			setStatus(t.status as TS);
		}
	}, [t]);

	const patch = $api.useMutation('patch', '/api/tournaments/{tournament_id}', {
		onSuccess: async () => {
			toast.success('Сохранено');
			await queryClient.invalidateQueries();
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	if (!Number.isFinite(id)) {
		return <p className="text-destructive">Некорректный ID</p>;
	}

	if (meLoad || tLoad) {
		return <Skeleton className="h-64 w-full max-w-lg" />;
	}

	if (!canOrganize(me?.role)) {
		return <Navigate to="/" replace />;
	}

	if (!t) {
		return <p className="text-destructive">Турнир не найден</p>;
	}

	function submit(e: React.FormEvent) {
		e.preventDefault();
		const did = Number(disciplineId);
		const start = startAt ? new Date(startAt).toISOString() : null;
		const end = endAt ? new Date(endAt).toISOString() : null;
		patch.mutate({
			params: { path: { tournament_id: id } },
			body: {
				name,
				discipline_id: Number.isFinite(did) ? did : null,
				tournament_type: tournamentType,
				start_at: start,
				end_at: end,
				prize_pool: prizePool,
				max_participants: Number(maxParticipants) || null,
				status
			}
		});
	}

	return (
		<div className="mx-auto max-w-lg">
			<Button variant="ghost" size="sm" asChild className="mb-4">
				<Link to={`/tournaments/${id}`}>← Турнир</Link>
			</Button>
			<Card>
				<CardHeader>
					<CardTitle>Редактировать турнир</CardTitle>
					<CardDescription>{t.name}</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={submit}>
						<FieldGroup>
							<Field>
								<FieldLabel>Название</FieldLabel>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel>ID дисциплины</FieldLabel>
								<Input
									value={disciplineId}
									onChange={(e) => setDisciplineId(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel>Тип</FieldLabel>
								<Select
									value={tournamentType}
									onValueChange={(v) => setTournamentType(v as TT)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="offline">offline</SelectItem>
										<SelectItem value="online">online</SelectItem>
									</SelectContent>
								</Select>
							</Field>
							<Field>
								<FieldLabel>Статус</FieldLabel>
								<Select
									value={status}
									onValueChange={(v) => setStatus(v as TS)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="draft">draft</SelectItem>
										<SelectItem value="recruiting">recruiting</SelectItem>
										<SelectItem value="in_progress">in_progress</SelectItem>
										<SelectItem value="completed">completed</SelectItem>
										<SelectItem value="cancelled">cancelled</SelectItem>
										<SelectItem value="archived">archived</SelectItem>
									</SelectContent>
								</Select>
							</Field>
							<Field>
								<FieldLabel>Начало</FieldLabel>
								<Input
									type="datetime-local"
									value={startAt}
									onChange={(e) => setStartAt(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel>Конец</FieldLabel>
								<Input
									type="datetime-local"
									value={endAt}
									onChange={(e) => setEndAt(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel>Призовой фонд</FieldLabel>
								<Input
									value={prizePool}
									onChange={(e) => setPrizePool(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel>Макс. участников</FieldLabel>
								<Input
									value={maxParticipants}
									onChange={(e) => setMaxParticipants(e.target.value)}
									required
								/>
							</Field>
							<Button type="submit" disabled={patch.isPending}>
								Сохранить
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
