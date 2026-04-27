import { useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import type { components } from '~/lib/api.schema';
import type { TournamentStatus, TournamentType } from '~/lib/api.types';
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

const DISCIPLINES_LIMIT = 200;

type TournamentRead = components['schemas']['TournamentRead'];
type DisciplineRead = components['schemas']['DisciplineRead'];

function toLocalDatetimeValue(iso: string | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formStateFromTournament(t: TournamentRead) {
	return {
		name: t.name,
		disciplineId: String(t.discipline_id),
		tournamentType: t.tournament_type as TournamentType,
		startAt: toLocalDatetimeValue(t.start_at),
		endAt: toLocalDatetimeValue(t.end_at),
		prizePool: String(t.prize_pool),
		maxParticipants: String(t.max_participants),
		status: t.status as TournamentStatus
	};
}

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Редактирование турнира — CyberTracker' }];
}

type OrgTournamentEditFormProps = {
	tournament: TournamentRead;
	disciplineOptions: DisciplineRead[];
	tournamentId: number;
};

function OrgTournamentEditForm({
	tournament,
	disciplineOptions,
	tournamentId
}: OrgTournamentEditFormProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState(() => tournament.name);
	const [disciplineId, setDisciplineId] = useState(() =>
		String(tournament.discipline_id)
	);
	const [tournamentType, setTournamentType] = useState(
		() => tournament.tournament_type as TournamentType
	);
	const [startAt, setStartAt] = useState(() =>
		toLocalDatetimeValue(tournament.start_at)
	);
	const [endAt, setEndAt] = useState(() =>
		toLocalDatetimeValue(tournament.end_at)
	);
	const [prizePool, setPrizePool] = useState(() =>
		String(tournament.prize_pool)
	);
	const [maxParticipants, setMaxParticipants] = useState(() =>
		String(tournament.max_participants)
	);
	const [status, setStatus] = useState(
		() => tournament.status as TournamentStatus
	);

	useLayoutEffect(() => {
		const s = formStateFromTournament(tournament);
		setName(s.name);
		setDisciplineId(s.disciplineId);
		setTournamentType(s.tournamentType);
		setStartAt(s.startAt);
		setEndAt(s.endAt);
		setPrizePool(s.prizePool);
		setMaxParticipants(s.maxParticipants);
		setStatus(s.status);
	}, [tournament]);

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

	function submit(e: React.FormEvent) {
		e.preventDefault();
		const did = Number(disciplineId);
		const start = startAt ? new Date(startAt).toISOString() : null;
		const end = endAt ? new Date(endAt).toISOString() : null;
		patch.mutate({
			params: { path: { tournament_id: tournamentId } },
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
				<Link to={`/tournaments/${tournamentId}`}>← Турнир</Link>
			</Button>
			<Card>
				<CardHeader>
					<CardTitle>Редактировать турнир</CardTitle>
					<CardDescription>{tournament.name}</CardDescription>
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
								<FieldLabel>Дисциплина</FieldLabel>
								{disciplineOptions.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Нет дисциплин в каталоге.{' '}
										<Link to="/disciplines" className="text-primary underline">
											Открыть список
										</Link>
									</p>
								) : (
									<Select
										value={disciplineId || undefined}
										onValueChange={setDisciplineId}
										required
									>
										<SelectTrigger>
											<SelectValue placeholder="Выберите дисциплину" />
										</SelectTrigger>
										<SelectContent>
											{disciplineOptions.map((d) => (
												<SelectItem key={d.id} value={String(d.id)}>
													{d.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</Field>
							<Field>
								<FieldLabel>Тип</FieldLabel>
								<Select
									value={tournamentType}
									onValueChange={(v) => setTournamentType(v as TournamentType)}
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
									onValueChange={(v) => setStatus(v as TournamentStatus)}
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
							<Button
								type="submit"
								disabled={
									patch.isPending ||
									disciplineOptions.length === 0 ||
									!disciplineId
								}
							>
								Сохранить
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default function OrgTournamentEditRoute() {
	const { tournamentId } = useParams();
	const id = Number(tournamentId);
	const location = useLocation();
	const { data: me, isLoading: meLoad } = useMe();

	const { data: t, isLoading: tLoad } = $api.useQuery(
		'get',
		'/api/tournaments/{tournament_id}',
		{ params: { path: { tournament_id: id } } },
		{ enabled: Number.isFinite(id) }
	);

	const { data: disciplinesPage, isLoading: disciplinesLoad } = $api.useQuery(
		'get',
		'/api/disciplines',
		{
			params: {
				query: { skip: 0, limit: DISCIPLINES_LIMIT, name: null }
			}
		},
		{ enabled: !meLoad && me != null && canOrganize(me.role) }
	);

	const disciplineOptions = useMemo((): DisciplineRead[] => {
		const items = disciplinesPage?.items ?? [];
		if (!t) return items;
		const ids = new Set(items.map((d) => d.id));
		if (ids.has(t.discipline_id)) return items;
		const label = t.discipline_name?.trim() || `Дисциплина #${t.discipline_id}`;
		return [
			{
				id: t.discipline_id,
				name: label,
				description: null
			},
			...items
		];
	}, [disciplinesPage?.items, t]);

	if (!Number.isFinite(id)) {
		return <p className="text-destructive">Некорректный ID</p>;
	}

	if (meLoad || tLoad || disciplinesLoad) {
		return <Skeleton className="h-64 w-full max-w-lg" />;
	}

	if (!canOrganize(me?.role)) {
		return <Navigate to="/" replace />;
	}

	if (!t) {
		return <p className="text-destructive">Турнир не найден</p>;
	}

	return (
		<OrgTournamentEditForm
			key={location.key}
			tournament={t}
			disciplineOptions={disciplineOptions}
			tournamentId={id}
		/>
	);
}
