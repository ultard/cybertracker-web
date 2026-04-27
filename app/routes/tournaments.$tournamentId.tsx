import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import type { components } from '~/lib/api.schema';
import { readApiErrorMessage } from '~/lib/api-errors';
import {
	canJudgeMatches,
	canManageParticipantRoster,
	canOrganize,
	canPredict
} from '~/lib/roles';

import { PaginationControls } from '~/components/pagination-controls';
import { QrCode } from '~/components/qr-code';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '~/components/ui/dialog';
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';

import { useMe } from '~/hooks/use-me';
import { useAuthStore } from '~/store/auth.store';

import type { Route } from './+types/tournaments.$tournamentId';

type ParticipantRole = components['schemas']['ParticipantRole'];
type ParticipantStatus = components['schemas']['ParticipantStatus'];

const P_ROLES: ParticipantRole[] = ['player', 'spectator'];
const P_STATUSES: ParticipantStatus[] = [
	'pending',
	'confirmed',
	'disqualified',
	'banned',
	'cancelled'
];

const PART_PAGE = 30;
const MATCH_PAGE = 30;

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Турнир — CyberTracker' }];
}

export default function TournamentDetailRoute() {
	const { tournamentId } = useParams();
	const id = Number(tournamentId);
	const queryClient = useQueryClient();
	const accessToken = useAuthStore((s) => s.accessToken);
	const { data: me } = useMe();
	const role = me?.role;

	const { data: t, isLoading: tLoad } = $api.useQuery(
		'get',
		'/api/tournaments/{tournament_id}',
		{ params: { path: { tournament_id: id } } },
		{ enabled: Number.isFinite(id) }
	);

	const [partSkip, setPartSkip] = useState(0);
	const { data: participants, isLoading: pLoad } = $api.useQuery(
		'get',
		'/api/participants',
		{
			params: {
				query: {
					tournament_id: id,
					skip: partSkip,
					limit: PART_PAGE
				}
			}
		},
		{ enabled: Number.isFinite(id) }
	);

	const [matchSkip, setMatchSkip] = useState(0);
	const { data: matches, isLoading: mLoad } = $api.useQuery(
		'get',
		'/api/matches',
		{
			params: {
				query: {
					tournament_id: id,
					skip: matchSkip,
					limit: MATCH_PAGE
				}
			}
		},
		{ enabled: Number.isFinite(id) }
	);

	const [regRole, setRegRole] = useState<ParticipantRole>('player');
	const registerMut = $api.useMutation('post', '/api/participants/register', {
		onSuccess: async () => {
			toast.success('Заявка отправлена');
			await queryClient.invalidateQueries();
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Не удалось записаться');
		}
	});

	const activateMut = $api.useMutation(
		'post',
		'/api/tournaments/{tournament_id}/activate',
		{
			onSuccess: async () => {
				toast.success('Турнир активирован');
				await queryClient.invalidateQueries();
			},
			onError: async (err) => {
				const res = (err as { response?: Response })?.response;
				if (res) toast.error(await readApiErrorMessage(res));
				else toast.error('Ошибка');
			}
		}
	);

	const qrMut = $api.useMutation('post', '/api/qr/generate', {
		onSuccess: (data) => {
			if (data?.token) {
				toast.success('Токен сгенерирован');
			}
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Не удалось выдать QR');
		}
	});

	const predictMut = $api.useMutation(
		'post',
		'/api/predict/tournament/{tournament_id}',
		{
			onSuccess: (data) => {
				toast.message(`Прогноз: ${data?.predicted_attendance ?? '—'}`, {
					description: data?.recommendations?.length
						? data.recommendations.join('; ')
						: undefined
				});
			},
			onError: async (err) => {
				const res = (err as { response?: Response })?.response;
				if (res) toast.error(await readApiErrorMessage(res));
				else toast.error('Прогноз недоступен');
			}
		}
	);

	const [qrToken, setQrToken] = useState<string | null>(null);
	const [qrExp, setQrExp] = useState<string | null>(null);

	useEffect(() => {
		if (t?.status !== 'recruiting') {
			setQrToken(null);
			setQrExp(null);
		}
	}, [t?.status]);

	if (!Number.isFinite(id)) {
		return <p className="text-destructive">Некорректный ID</p>;
	}

	if (tLoad || !t) {
		return <Skeleton className="h-64 w-full max-w-4xl" />;
	}

	const canOrg = canOrganize(role);
	const canRoster = canManageParticipantRoster(role);
	const canMatch = canJudgeMatches(role);
	const canRunPredict = canPredict(role);
	const showParticipantActions = canRoster || canOrg;
	const recruiting = t.status === 'recruiting';

	return (
		<div className="flex max-w-5xl flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
				<div>
					<Button variant="ghost" size="sm" asChild className="mb-2 w-fit">
						<Link to="/tournaments">← Турниры</Link>
					</Button>
					<h1 className="text-2xl font-semibold">{t.name}</h1>
					<p className="text-muted-foreground text-sm">
						{t.discipline_name ?? `Дисциплина #${t.discipline_id}`}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Badge>{t.status}</Badge>
					<Badge variant="outline">{t.tournament_type}</Badge>
					{canOrg ? (
						<>
							<Button size="sm" variant="outline" asChild>
								<Link to={`/org/tournaments/${id}/edit`}>Редактировать</Link>
							</Button>
							{t.status === 'draft' ? (
								<Button
									size="sm"
									disabled={activateMut.isPending}
									onClick={() =>
										activateMut.mutate({
											params: { path: { tournament_id: id } }
										})
									}
								>
									Активировать (recruiting)
								</Button>
							) : null}
						</>
					) : null}
					{canRunPredict ? (
						<Button
							size="sm"
							variant="secondary"
							disabled={predictMut.isPending}
							onClick={() =>
								predictMut.mutate({
									params: { path: { tournament_id: id } }
								})
							}
						>
							Прогноз посещаемости
						</Button>
					) : null}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Параметры</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
					<p>
						Начало:{' '}
						{t.start_at ? new Date(t.start_at as string).toLocaleString() : '—'}
					</p>
					<p>
						Конец:{' '}
						{t.end_at ? new Date(t.end_at as string).toLocaleString() : '—'}
					</p>
					<p>Призовой фонд: {String(t.prize_pool)}</p>
					<p>Макс. участников: {t.max_participants}</p>
				</CardContent>
			</Card>

			{accessToken && recruiting ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Запись на турнир</CardTitle>
						<CardDescription>Статус турнира: recruiting</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
						<Field className="flex-1">
							<FieldLabel>Роль участия</FieldLabel>
							<Select
								value={regRole}
								onValueChange={(v) => setRegRole(v as ParticipantRole)}
							>
								<SelectTrigger className="w-full sm:max-w-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{P_ROLES.map((r) => (
										<SelectItem key={r} value={r}>
											{r}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Button
							disabled={registerMut.isPending}
							onClick={() =>
								registerMut.mutate({
									body: { tournament_id: id, participant_role: regRole }
								})
							}
						>
							Подать заявку
						</Button>
					</CardContent>
				</Card>
			) : null}

			{accessToken && recruiting ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">QR для прохода</CardTitle>
						<CardDescription>
							Только на этапе набора (recruiting), если вы участник турнира
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<Button
							variant="outline"
							disabled={qrMut.isPending}
							onClick={() => {
								qrMut.mutate(
									{ params: { query: { tournament_id: id } } },
									{
										onSuccess: (data) => {
											if (data) {
												setQrToken(data.token);
												setQrExp(
													data.expires_at
														? new Date(
																data.expires_at as string
															).toLocaleString()
														: null
												);
											}
										}
									}
								);
							}}
						>
							Сгенерировать токен
						</Button>
						{qrToken ? (
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
								<div className="rounded-lg border bg-white p-3 shadow-sm">
									<QrCode value={qrToken} size={200} className="block" />
								</div>
								<div className="min-w-0 flex-1 space-y-2">
									{qrExp ? (
										<p className="text-muted-foreground text-sm">
											Действителен до {qrExp}
										</p>
									) : null}
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											void navigator.clipboard
												.writeText(qrToken)
												.then(() => toast.success('Токен скопирован'))
												.catch(() => toast.error('Не удалось скопировать'));
										}}
									>
										Скопировать токен
									</Button>
									<Alert>
										<AlertTitle className="text-xs">Текст токена</AlertTitle>
										<AlertDescription className="break-all font-mono text-xs">
											{qrToken}
										</AlertDescription>
									</Alert>
								</div>
							</div>
						) : null}
					</CardContent>
				</Card>
			) : null}

			<Tabs defaultValue="participants">
				<TabsList>
					<TabsTrigger value="participants">Участники</TabsTrigger>
					<TabsTrigger value="matches">Матчи</TabsTrigger>
				</TabsList>
				<TabsContent value="participants" className="mt-4">
					{pLoad ? (
						<Skeleton className="h-40 w-full" />
					) : (
						<>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Ник</TableHead>
											<TableHead>Роль</TableHead>
											<TableHead>Статус</TableHead>
											{showParticipantActions ? <TableHead /> : null}
										</TableRow>
									</TableHeader>
									<TableBody>
										{participants?.items.map((p) => (
											<TableRow key={p.id}>
												<TableCell>{p.id}</TableCell>
												<TableCell>{p.nickname ?? p.user_id}</TableCell>
												<TableCell>{p.participant_role}</TableCell>
												<TableCell>{p.status}</TableCell>
												{showParticipantActions ? (
													<TableCell>
														<div className="flex flex-wrap gap-2">
															{canRoster ? (
																<ParticipantEditDialog
																	participantId={p.id}
																	initialStatus={p.status as ParticipantStatus}
																	initialRole={p.participant_role}
																	onSaved={() =>
																		queryClient.invalidateQueries()
																	}
																/>
															) : null}
															{canOrg ? (
																<ParticipantDeleteDialog
																	participantId={p.id}
																	onDeleted={() =>
																		queryClient.invalidateQueries()
																	}
																/>
															) : null}
														</div>
													</TableCell>
												) : null}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							{participants ? (
								<div className="mt-4">
									<PaginationControls
										page={{
											skip: participants.skip,
											limit: participants.limit,
											total: participants.total
										}}
										onPageChange={setPartSkip}
									/>
								</div>
							) : null}
						</>
					)}
				</TabsContent>
				<TabsContent value="matches" className="mt-4">
					{mLoad ? (
						<Skeleton className="h-40 w-full" />
					) : (
						<>
							{canMatch ? (
								<MatchCreateDialog
									tournamentId={id}
									onCreated={() => queryClient.invalidateQueries()}
								/>
							) : null}
							<div className="mt-4 rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Время</TableHead>
											<TableHead>Счёт</TableHead>
											<TableHead>A</TableHead>
											<TableHead>B</TableHead>
											<TableHead>Победитель</TableHead>
											{canMatch ? <TableHead /> : null}
										</TableRow>
									</TableHeader>
									<TableBody>
										{matches?.items.map((m) => (
											<TableRow key={m.id}>
												<TableCell>{m.id}</TableCell>
												<TableCell>
													{m.played_at
														? new Date(m.played_at as string).toLocaleString()
														: '—'}
												</TableCell>
												<TableCell>{m.score ?? '—'}</TableCell>
												<TableCell>{m.participant_a_id ?? '—'}</TableCell>
												<TableCell>{m.participant_b_id ?? '—'}</TableCell>
												<TableCell>{m.winner_participant_id ?? '—'}</TableCell>
												{canMatch ? (
													<TableCell>
														<MatchEditDialog
															match={m}
															onSaved={() => queryClient.invalidateQueries()}
														/>
													</TableCell>
												) : null}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							{matches ? (
								<div className="mt-4">
									<PaginationControls
										page={{
											skip: matches.skip,
											limit: matches.limit,
											total: matches.total
										}}
										onPageChange={setMatchSkip}
									/>
								</div>
							) : null}
						</>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ParticipantEditDialog({
	participantId,
	initialStatus,
	initialRole,
	onSaved
}: {
	participantId: number;
	initialStatus: ParticipantStatus;
	initialRole: ParticipantRole;
	onSaved: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState<ParticipantStatus>(initialStatus);
	const [pRole, setPRole] = useState<ParticipantRole>(initialRole);

	useEffect(() => {
		if (open) {
			setStatus(initialStatus);
			setPRole(initialRole);
		}
	}, [open, initialStatus, initialRole]);

	const patch = $api.useMutation(
		'patch',
		'/api/participants/{participant_id}',
		{
			onSuccess: async () => {
				toast.success('Участник обновлён');
				onSaved();
				setOpen(false);
			},
			onError: async (err) => {
				const res = (err as { response?: Response })?.response;
				if (res) toast.error(await readApiErrorMessage(res));
				else toast.error('Ошибка');
			}
		}
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					Изменить
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Участник #{participantId}</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Статус</FieldLabel>
						<Select
							value={status}
							onValueChange={(v) => setStatus(v as ParticipantStatus)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{P_STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<Field>
						<FieldLabel>Роль</FieldLabel>
						<Select
							value={pRole}
							onValueChange={(v) => setPRole(v as ParticipantRole)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{P_ROLES.map((r) => (
									<SelectItem key={r} value={r}>
										{r}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>
				<DialogFooter>
					<Button
						disabled={patch.isPending}
						onClick={() =>
							patch.mutate({
								params: { path: { participant_id: participantId } },
								body: { status, participant_role: pRole }
							})
						}
					>
						Сохранить
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ParticipantDeleteDialog({
	participantId,
	onDeleted
}: {
	participantId: number;
	onDeleted: () => void;
}) {
	const [open, setOpen] = useState(false);

	const del = $api.useMutation('delete', '/api/participants/{participant_id}', {
		onSuccess: async () => {
			toast.success('Участник удалён');
			onDeleted();
			setOpen(false);
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="destructive">
					Удалить
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Удалить участника #{participantId}?</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					Запись будет удалена из турнира. Связанные QR и отметки посещения тоже
					удалятся. Ссылки на этого участника в матчах будут сброшены.
				</p>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Отмена
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={del.isPending}
						onClick={() =>
							del.mutate({
								params: { path: { participant_id: participantId } }
							})
						}
					>
						Удалить
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function MatchCreateDialog({
	tournamentId,
	onCreated
}: {
	tournamentId: number;
	onCreated: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [a, setA] = useState('');
	const [b, setB] = useState('');
	const [winner, setWinner] = useState('');
	const [score, setScore] = useState('');
	const [comment, setComment] = useState('');

	const create = $api.useMutation('post', '/api/matches', {
		onSuccess: async () => {
			toast.success('Матч создан');
			onCreated();
			setOpen(false);
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">Новый матч</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Создать матч</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Участник A (ID)</FieldLabel>
						<Input value={a} onChange={(e) => setA(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Участник B (ID)</FieldLabel>
						<Input value={b} onChange={(e) => setB(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Победитель (ID, опционально)</FieldLabel>
						<Input value={winner} onChange={(e) => setWinner(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Счёт</FieldLabel>
						<Input value={score} onChange={(e) => setScore(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Комментарий</FieldLabel>
						<Textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
						/>
					</Field>
				</FieldGroup>
				<DialogFooter>
					<Button
						disabled={create.isPending}
						onClick={() => {
							const pa = a ? Number(a) : undefined;
							const pb = b ? Number(b) : undefined;
							const w = winner ? Number(winner) : undefined;
							create.mutate({
								body: {
									tournament_id: tournamentId,
									participant_a_id: pa,
									participant_b_id: pb,
									winner_participant_id: w,
									score: score || undefined,
									comment: comment || undefined
								}
							});
						}}
					>
						Создать
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

type MatchRead = components['schemas']['MatchRead'];

function MatchEditDialog({
	match,
	onSaved
}: {
	match: MatchRead;
	onSaved: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [score, setScore] = useState(match.score ?? '');
	const [comment, setComment] = useState(match.comment ?? '');
	const [winner, setWinner] = useState(
		match.winner_participant_id != null
			? String(match.winner_participant_id)
			: ''
	);

	const patch = $api.useMutation('patch', '/api/matches/{match_id}', {
		onSuccess: async () => {
			toast.success('Матч обновлён');
			onSaved();
			setOpen(false);
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					Правка
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Матч #{match.id}</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Победитель (ID)</FieldLabel>
						<Input value={winner} onChange={(e) => setWinner(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Счёт</FieldLabel>
						<Input value={score} onChange={(e) => setScore(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Комментарий</FieldLabel>
						<Textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
						/>
					</Field>
				</FieldGroup>
				<DialogFooter>
					<Button
						disabled={patch.isPending}
						onClick={() =>
							patch.mutate({
								params: { path: { match_id: match.id } },
								body: {
									winner_participant_id: winner ? Number(winner) : null,
									score: score || null,
									comment: comment || null
								}
							})
						}
					>
						Сохранить
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
