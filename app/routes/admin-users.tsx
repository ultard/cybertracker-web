import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import type { components } from '~/lib/api.schema';
import { readApiErrorMessage } from '~/lib/api-errors';
import { canManageUsers } from '~/lib/roles';

import { PaginationControls } from '~/components/pagination-controls';
import { Badge } from '~/components/ui/badge';
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

import { useMe } from '~/hooks/use-me';

import type { Route } from './+types/admin-users';

const PAGE = 20;

type UserRead = components['schemas']['UserRead'];
type UserRole = components['schemas']['UserRole'];

const ROLES: UserRole[] = ['admin', 'organizer', 'manager', 'judge', 'user'];

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Пользователи (админ) — CyberTracker' }];
}

export default function AdminUsersRoute() {
	const { data: me, isLoading: meLoad } = useMe();
	const queryClient = useQueryClient();
	const [skip, setSkip] = useState(0);
	const [loginFilter, setLoginFilter] = useState('');
	const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
	const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>(
		'all'
	);
	const [applied, setApplied] = useState<{
		login?: string;
		role?: UserRole;
		is_active?: boolean;
	}>({});

	const { data, isLoading } = $api.useQuery('get', '/api/users', {
		params: {
			query: {
				skip,
				limit: PAGE,
				login: applied.login ?? null,
				role: applied.role ?? null,
				is_active: applied.is_active ?? null
			}
		}
	});

	function applyFilters(e: React.FormEvent) {
		e.preventDefault();
		setSkip(0);
		setApplied({
			login: loginFilter.trim() || undefined,
			role: roleFilter === 'all' ? undefined : roleFilter,
			is_active: activeFilter === 'all' ? undefined : activeFilter === 'true'
		});
	}

	if (meLoad) {
		return <Skeleton className="h-40 w-full" />;
	}

	if (!canManageUsers(me?.role)) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="flex flex-col gap-8">
			<h1 className="text-2xl font-semibold">Пользователи</h1>
			<form onSubmit={applyFilters} className="flex flex-col gap-4">
				<FieldGroup className="grid gap-4 sm:grid-cols-3">
					<Field>
						<FieldLabel>Логин</FieldLabel>
						<Input
							value={loginFilter}
							onChange={(e) => setLoginFilter(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel>Роль</FieldLabel>
						<Select
							value={roleFilter}
							onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все</SelectItem>
								{ROLES.map((r) => (
									<SelectItem key={r} value={r}>
										{r}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<Field>
						<FieldLabel>Активен</FieldLabel>
						<Select
							value={activeFilter}
							onValueChange={(v) =>
								setActiveFilter(v as 'all' | 'true' | 'false')
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все</SelectItem>
								<SelectItem value="true">Да</SelectItem>
								<SelectItem value="false">Нет</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>
				<Button type="submit" className="w-fit">
					Применить
				</Button>
			</form>
			{isLoading ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Логин</TableHead>
									<TableHead>Ник</TableHead>
									<TableHead>Роль</TableHead>
									<TableHead>Активен</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((u) => (
									<TableRow key={u.id}>
										<TableCell>{u.id}</TableCell>
										<TableCell>{u.login}</TableCell>
										<TableCell>{u.nickname ?? '—'}</TableCell>
										<TableCell>
											<Badge variant="secondary">{u.role}</Badge>
										</TableCell>
										<TableCell>{u.is_active ? 'да' : 'нет'}</TableCell>
										<TableCell>
											<UserEditDialog
												user={u}
												onSaved={() => queryClient.invalidateQueries()}
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

function UserEditDialog({
	user,
	onSaved
}: {
	user: UserRead;
	onSaved: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [login, setLogin] = useState(user.login);
	const [nickname, setNickname] = useState(user.nickname ?? '');
	const [firstName, setFirstName] = useState(user.first_name ?? '');
	const [lastName, setLastName] = useState(user.last_name ?? '');
	const [role, setRole] = useState<UserRole>(user.role);
	const [isActive, setIsActive] = useState(user.is_active);

	const patch = $api.useMutation('patch', '/api/users/{user_id}', {
		onSuccess: async () => {
			toast.success('Пользователь обновлён');
			onSaved();
			setOpen(false);
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	const del = $api.useMutation('delete', '/api/users/{user_id}', {
		onSuccess: async () => {
			toast.success('Пользователь удалён');
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
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Пользователь #{user.id}</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Логин</FieldLabel>
						<Input value={login} onChange={(e) => setLogin(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>Ник</FieldLabel>
						<Input
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel>Имя</FieldLabel>
						<Input
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel>Фамилия</FieldLabel>
						<Input
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel>Роль</FieldLabel>
						<Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ROLES.map((r) => (
									<SelectItem key={r} value={r}>
										{r}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<Field>
						<FieldLabel>Активен</FieldLabel>
						<Select
							value={isActive ? 'true' : 'false'}
							onValueChange={(v) => setIsActive(v === 'true')}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="true">Да</SelectItem>
								<SelectItem value="false">Нет</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>
				<DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
					<Button
						variant="destructive"
						disabled={del.isPending}
						onClick={() => {
							if (confirm(`Удалить пользователя ${user.login}?`)) {
								del.mutate({ params: { path: { user_id: user.id } } });
							}
						}}
					>
						Удалить
					</Button>
					<Button
						disabled={patch.isPending}
						onClick={() =>
							patch.mutate({
								params: { path: { user_id: user.id } },
								body: {
									login,
									nickname: nickname || null,
									first_name: firstName || null,
									last_name: lastName || null,
									role,
									is_active: isActive
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
