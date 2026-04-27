import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
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

import type { Route } from './+types/org-tournament-new';

const DISCIPLINES_LIMIT = 200;

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Новый турнир — CyberTracker' }];
}

export default function OrgTournamentNewRoute() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: me, isLoading: meLoad } = useMe();

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

	const disciplineOptions = useMemo(
		() => disciplinesPage?.items ?? [],
		[disciplinesPage?.items]
	);

	const [name, setName] = useState('');
	const [disciplineId, setDisciplineId] = useState('');
	const [tournamentType, setTournamentType] =
		useState<TournamentType>('offline');
	const [startAt, setStartAt] = useState('');
	const [endAt, setEndAt] = useState('');
	const [prizePool, setPrizePool] = useState('0');
	const [maxParticipants, setMaxParticipants] = useState('32');
	const [status, setStatus] = useState<TournamentStatus>('draft');

	const create = $api.useMutation('post', '/api/tournaments', {
		onSuccess: async (data) => {
			toast.success('Турнир создан');
			await queryClient.invalidateQueries();
			if (data?.id) navigate(`/tournaments/${data.id}`);
			else navigate('/org/tournaments');
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	if (meLoad || disciplinesLoad) {
		return <Skeleton className="h-64 w-full max-w-lg" />;
	}

	if (!canOrganize(me?.role)) {
		return <Navigate to="/" replace />;
	}

	function submit(e: React.FormEvent) {
		e.preventDefault();
		const did = Number(disciplineId);
		if (!disciplineId || !Number.isFinite(did)) {
			toast.error('Выберите дисциплину');
			return;
		}
		const start = startAt ? new Date(startAt).toISOString() : '';
		const end = endAt ? new Date(endAt).toISOString() : '';
		create.mutate({
			body: {
				name,
				discipline_id: did,
				tournament_type: tournamentType,
				start_at: start,
				end_at: end,
				prize_pool: prizePool,
				max_participants: Number(maxParticipants) || 0,
				status
			}
		});
	}

	return (
		<div className="mx-auto max-w-lg">
			<Button variant="ghost" size="sm" asChild className="mb-4">
				<Link to="/org/tournaments">← Назад</Link>
			</Button>
			<Card>
				<CardHeader>
					<CardTitle>Новый турнир</CardTitle>
					<CardDescription>
						После сохранения можно активировать набор (recruiting)
					</CardDescription>
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
								<FieldLabel>Начало (локальное время)</FieldLabel>
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
									inputMode="numeric"
									value={maxParticipants}
									onChange={(e) => setMaxParticipants(e.target.value)}
									required
								/>
							</Field>
							<Button
								type="submit"
								disabled={
									create.isPending ||
									disciplineOptions.length === 0 ||
									!disciplineId
								}
							>
								Создать
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
