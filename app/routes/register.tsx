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

import type { Route } from './+types/register';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Регистрация — CyberTracker' }];
}

export default function RegisterRoute() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [loginVal, setLoginVal] = useState('');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [nickname, setNickname] = useState('');

	const reg = $api.useMutation('post', '/api/auth/register', {
		onSuccess: async (data) => {
			if (!data) return;
			setTokens({
				accessToken: data.access_token,
				refreshToken: data.refresh_token
			});
			await queryClient.invalidateQueries();
			toast.success('Аккаунт создан');
			navigate('/');
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Не удалось зарегистрироваться');
		}
	});

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		reg.mutate({
			body: {
				login: loginVal,
				password,
				first_name: firstName,
				last_name: lastName,
				nickname
			}
		});
	}

	return (
		<div className="mx-auto max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>Регистрация</CardTitle>
					<CardDescription>
						Уже есть аккаунт?{' '}
						<Link
							to="/login"
							className="text-primary underline-offset-4 hover:underline"
						>
							Вход
						</Link>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="reg-login">Логин</FieldLabel>
								<Input
									id="reg-login"
									value={loginVal}
									onChange={(e) => setLoginVal(e.target.value)}
									required
									minLength={3}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="reg-password">Пароль</FieldLabel>
								<Input
									id="reg-password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={6}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="first_name">Имя</FieldLabel>
								<Input
									id="first_name"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									required
									minLength={1}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="last_name">Фамилия</FieldLabel>
								<Input
									id="last_name"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									required
									minLength={1}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="nickname">Ник</FieldLabel>
								<Input
									id="nickname"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
									required
									minLength={1}
								/>
							</Field>
							<Button type="submit" className="w-full" disabled={reg.isPending}>
								{reg.isPending ? 'Создание…' : 'Создать аккаунт'}
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
