import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import type { components } from '~/lib/api.schema';
import { readApiErrorMessage } from '~/lib/api-errors';
import { canManageDisciplines } from '~/lib/roles';

import { PaginationControls } from '~/components/pagination-controls';
import { Button } from '~/components/ui/button';
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
import { Skeleton } from '~/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';
import { Textarea } from '~/components/ui/textarea';

import { useMe } from '~/hooks/use-me';

import type { Route } from './+types/admin-disciplines';

const PAGE = 20;

type DisciplineRead = components['schemas']['DisciplineRead'];

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Дисциплины (админ) — CyberTracker' }];
}

export default function AdminDisciplinesRoute() {
	const { data: me, isLoading: meLoad } = useMe();
	const queryClient = useQueryClient();
	const [skip, setSkip] = useState(0);

	const { data, isLoading } = $api.useQuery('get', '/api/disciplines', {
		params: { query: { skip, limit: PAGE } }
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDesc, setNewDesc] = useState('');

	const create = $api.useMutation('post', '/api/disciplines', {
		onSuccess: async () => {
			toast.success('Дисциплина создана');
			setCreateOpen(false);
			setNewName('');
			setNewDesc('');
			await queryClient.invalidateQueries();
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	if (meLoad) {
		return <Skeleton className="h-40 w-full" />;
	}

	if (!canManageDisciplines(me?.role)) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold">Дисциплины (админ)</h1>
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button>Создать</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Новая дисциплина</DialogTitle>
						</DialogHeader>
						<FieldGroup>
							<Field>
								<FieldLabel>Название</FieldLabel>
								<Input
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel>Описание</FieldLabel>
								<Textarea
									value={newDesc}
									onChange={(e) => setNewDesc(e.target.value)}
								/>
							</Field>
						</FieldGroup>
						<DialogFooter>
							<Button
								disabled={create.isPending || !newName.trim()}
								onClick={() =>
									create.mutate({
										body: {
											name: newName.trim(),
											description: newDesc.trim() || null
										}
									})
								}
							>
								Создать
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
			{isLoading ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Название</TableHead>
									<TableHead>Описание</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((d) => (
									<TableRow key={d.id}>
										<TableCell>{d.id}</TableCell>
										<TableCell>
											<Link
												to={`/disciplines/${d.id}`}
												className="text-primary hover:underline"
											>
												{d.name}
											</Link>
										</TableCell>
										<TableCell className="max-w-xs truncate">
											{d.description ?? '—'}
										</TableCell>
										<TableCell className="flex flex-wrap gap-2">
											<DisciplineEditDialog
												discipline={d}
												onSaved={() => queryClient.invalidateQueries()}
											/>
											<DisciplineDeleteButton
												id={d.id}
												name={d.name}
												onDone={() => queryClient.invalidateQueries()}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
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

function DisciplineEditDialog({
	discipline,
	onSaved
}: {
	discipline: DisciplineRead;
	onSaved: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(discipline.name);
	const [description, setDescription] = useState(discipline.description ?? '');

	const patch = $api.useMutation('patch', '/api/disciplines/{discipline_id}', {
		onSuccess: async () => {
			toast.success('Обновлено');
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
					<DialogTitle>Дисциплина #{discipline.id}</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Название</FieldLabel>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Описание</FieldLabel>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</Field>
				</FieldGroup>
				<DialogFooter>
					<Button
						disabled={patch.isPending}
						onClick={() =>
							patch.mutate({
								params: { path: { discipline_id: discipline.id } },
								body: {
									name: name || null,
									description: description || null
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

function DisciplineDeleteButton({
	id,
	name,
	onDone
}: {
	id: number;
	name: string;
	onDone: () => void;
}) {
	const del = $api.useMutation('delete', '/api/disciplines/{discipline_id}', {
		onSuccess: async () => {
			toast.success('Удалено');
			onDone();
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	return (
		<Button
			size="sm"
			variant="destructive"
			disabled={del.isPending}
			onClick={() => {
				if (confirm(`Удалить дисциплину «${name}»?`)) {
					del.mutate({ params: { path: { discipline_id: id } } });
				}
			}}
		>
			Удалить
		</Button>
	);
}
