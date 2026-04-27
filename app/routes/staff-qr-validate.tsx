import { useCallback, useState } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';

import $api from '~/lib/api.client';
import { readApiErrorMessage } from '~/lib/api-errors';
import { canValidateQr } from '~/lib/roles';

import { QrVideoScanner } from '~/components/qr-video-scanner';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';

import { useMe } from '~/hooks/use-me';

import type { Route } from './+types/staff-qr-validate';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Проверка QR — CyberTracker' }];
}

export default function StaffQrValidateRoute() {
	const { data: me, isLoading: meLoad } = useMe();
	const [token, setToken] = useState('');
	const [result, setResult] = useState<{
		ok: boolean;
		message?: string;
		participant_id?: number;
	} | null>(null);

	const onScan = useCallback((text: string) => {
		setToken(text.trim());
		setResult(null);
		toast.message('QR считан', {
			description: 'Проверьте поле и отправьте форму'
		});
	}, []);

	const validate = $api.useMutation('post', '/api/qr/validate', {
		onSuccess: (data) => {
			setResult({
				ok: Boolean(data?.ok),
				message: data?.message,
				participant_id: data?.participant_id ?? undefined
			});
			if (data?.ok) toast.success('Отмечено посещение');
			else toast.message(data?.message ?? 'Отклонено');
		},
		onError: async (err) => {
			const res = (err as { response?: Response })?.response;
			if (res) toast.error(await readApiErrorMessage(res));
			else toast.error('Ошибка');
		}
	});

	if (meLoad) {
		return <Skeleton className="h-48 w-full max-w-lg" />;
	}

	if (!canValidateQr(me?.role)) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="mx-auto max-w-lg">
			<h1 className="mb-6 text-2xl font-semibold">Проверка QR</h1>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Токен посетителя</CardTitle>
					<CardDescription>
						Отсканируйте камерой или вставьте строку из QR участника
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="camera" className="mb-4">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="camera">Камера</TabsTrigger>
							<TabsTrigger value="manual">Вручную</TabsTrigger>
						</TabsList>
						<TabsContent value="camera" className="mt-4">
							<QrVideoScanner onResult={onScan} />
						</TabsContent>
						<TabsContent value="manual" className="mt-4">
							<p className="text-muted-foreground text-sm">
								Вставьте значение, если сканер недоступен (например, скриншот в
								буфере).
							</p>
						</TabsContent>
					</Tabs>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setResult(null);
							validate.mutate({ body: { token: token.trim() } });
						}}
					>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="qr-token">Токен</FieldLabel>
								<Textarea
									id="qr-token"
									value={token}
									onChange={(e) => setToken(e.target.value)}
									rows={4}
									className="font-mono text-xs"
									required
								/>
							</Field>
							<Button type="submit" disabled={validate.isPending}>
								Проверить и отметить
							</Button>
						</FieldGroup>
					</form>
					{result ? (
						<Alert
							className="mt-4"
							variant={result.ok ? 'default' : 'destructive'}
						>
							<AlertTitle>{result.ok ? 'Успех' : 'Отказ'}</AlertTitle>
							<AlertDescription>
								{result.message}
								{result.participant_id != null
									? ` · Участник #${result.participant_id}`
									: ''}
							</AlertDescription>
						</Alert>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
