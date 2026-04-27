import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { readApiErrorMessage } from '~/lib/api-errors';

import { Badge } from '~/components/ui/badge';
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

import { useAuthStore } from '~/store/auth.store';

import type { Route } from './+types/profile';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Профиль — CyberTracker' }];
}

export default function ProfileRoute() {
	const accessToken = useAuthStore((s) => s.accessToken);
	const queryClient = useQueryClient();

	const { data: user, isLoading } = $api.useQuery(
		'get',
		'/api/users/me',
		{},
		{ enabled: Boolean(accessToken) }
	);

	const [nickname, setNickname] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');

	useEffect(() => {
		if (user) {
			setNickname(user.nickname ?? '');
			setFirstName(user.first_name ?? '');
			setLastName(user.last_name ?? '');
		}
	}, [user]);

	const patch = $api.useMutation('patch', '/api/users/me', {
		onSuccess: async () => {
			toast.success('Профиль сохранён');
			await queryClient.invalidateQueries();
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка сохранения');
		}
	});

	if (!accessToken) {
		return <Navigate to="/login" replace />;
	}

	if (isLoading || !user) {
		return <Skeleton className="h-64 max-w-lg" />;
	}

	return (
		<div className="mx-auto flex max-w-lg flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold">Профиль</h1>
				<p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
					<span>{user.login}</span>
					<Badge variant="secondary">{user.role}</Badge>
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Данные</CardTitle>
					<CardDescription>Имя и ник отображаются в турнирах</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							patch.mutate({
								body: {
									nickname: nickname || null,
									first_name: firstName || null,
									last_name: lastName || null
								}
							});
						}}
					>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="nick">Ник</FieldLabel>
								<Input
									id="nick"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="fn">Имя</FieldLabel>
								<Input
									id="fn"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="ln">Фамилия</FieldLabel>
								<Input
									id="ln"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
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
