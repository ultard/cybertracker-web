import {
	BarcodeFormat,
	BrowserMultiFormatReader,
	DecodeHintType,
	NotFoundException
} from '@zxing/library';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '~/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select';

type QrVideoScannerProps = {
	/** Вызывается при успешном чтении QR (сырая строка). */
	onResult: (text: string) => void;
	className?: string;
};

const readerHints = new Map<DecodeHintType, unknown>([
	[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
	[DecodeHintType.TRY_HARDER, true]
]);

export function QrVideoScanner({ onResult, className }: QrVideoScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const readerRef = useRef<BrowserMultiFormatReader | null>(null);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [deviceId, setDeviceId] = useState<string>('');
	const [scanning, setScanning] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);

	useEffect(() => {
		readerRef.current = new BrowserMultiFormatReader(readerHints, 300);
		return () => {
			readerRef.current?.reset();
			readerRef.current = null;
		};
	}, []);

	useEffect(() => {
		const reader = readerRef.current;
		if (!reader) return;

		void reader
			.listVideoInputDevices()
			.then((list) => {
				setDevices(list);
				setDeviceId((prev) => prev || list[0]?.deviceId || '');
			})
			.catch(() => {
				setCameraError('Не удалось получить список камер');
			});
	}, []);

	const stop = useCallback(() => {
		readerRef.current?.reset();
		setScanning(false);
	}, []);

	const start = useCallback(() => {
		const reader = readerRef.current;
		const video = videoRef.current;
		if (!reader || !video) return;

		setCameraError(null);
		setScanning(true);

		void reader
			.decodeFromVideoDevice(deviceId || null, video, (result, err) => {
				if (err) {
					if (err instanceof NotFoundException) return;
					setCameraError(err.message ?? 'Ошибка сканирования');
					return;
				}
				if (result) {
					onResult(result.getText());
					readerRef.current?.reset();
					setScanning(false);
				}
			})
			.catch((e: unknown) => {
				setScanning(false);
				setCameraError(
					e instanceof Error ? e.message : 'Не удалось открыть камеру'
				);
			});
	}, [deviceId, onResult]);

	return (
		<div className={className}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				{devices.length > 1 ? (
					<div className="min-w-0 flex-1">
						<p className="text-muted-foreground mb-1 text-xs">Камера</p>
						<Select value={deviceId} onValueChange={setDeviceId}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Камера" />
							</SelectTrigger>
							<SelectContent>
								{devices.map((d) => (
									<SelectItem key={d.deviceId} value={d.deviceId}>
										{d.label || `Камера ${d.deviceId.slice(0, 8)}…`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : null}
				<div className="flex flex-wrap gap-2">
					{!scanning ? (
						<Button type="button" onClick={start}>
							Включить камеру
						</Button>
					) : (
						<Button type="button" variant="secondary" onClick={stop}>
							Остановить
						</Button>
					)}
				</div>
			</div>
			<video
				ref={videoRef}
				className="mt-3 aspect-video w-full max-w-md rounded-md border border-border bg-black object-cover"
				muted
				playsInline
			/>
			{cameraError ? (
				<p className="text-destructive mt-2 text-sm">{cameraError}</p>
			) : (
				<p className="text-muted-foreground mt-2 text-xs">
					Наведите камеру на QR участника. Код будет подставлен в поле ниже.
				</p>
			)}
		</div>
	);
}
