import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { readApiErrorMessage } from '~/lib/api-errors';

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

import { setTokens } from '~/store/auth.store';

import type { Route } from './+types/login';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Вход — CyberTracker' }];
}

export default function LoginRoute() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');

	const loginMutation = $api.useMutation('post', '/api/auth/login', {
		onSuccess: async (data) => {
			if (!data) return;
			setTokens({
				accessToken: data.access_token,
				refreshToken: data.refresh_token
			});
			await queryClient.invalidateQueries();
			toast.success('Добро пожаловать!');
			navigate('/');
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка входа');
		}
	});

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		loginMutation.mutate({ body: { login, password } });
	}

	return (
		<div className="mx-auto max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>Вход</CardTitle>
					<CardDescription>
						Нет аккаунта?{' '}
						<Link
							to="/register"
							className="text-primary underline-offset-4 hover:underline"
						>
							Регистрация
						</Link>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="login">Логин</FieldLabel>
								<Input
									id="login"
									name="login"
									autoComplete="username"
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									required
									minLength={3}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Пароль</FieldLabel>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={4}
								/>
							</Field>
							<Button
								type="submit"
								className="w-full"
								disabled={loginMutation.isPending}
							>
								{loginMutation.isPending ? 'Вход…' : 'Войти'}
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
