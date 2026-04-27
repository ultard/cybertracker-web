import { useEffect, useRef } from 'react';

import { BarcodeFormat, MultiFormatWriter } from '@zxing/library';

type QrCodeProps = {
	value: string;
	/** Логический размер модуля (квадрат), px */
	size?: number;
	className?: string;
};

/**
 * Рисует QR (MultiFormatWriter) на canvas.
 */
export function QrCode({ value, size = 220, className }: QrCodeProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !value) return;

		const writer = new MultiFormatWriter();
		const matrix = writer.encode(
			value,
			BarcodeFormat.QR_CODE,
			size,
			size,
			new Map()
		);

		const w = matrix.getWidth();
		const h = matrix.getHeight();
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
		canvas.width = Math.floor(w * dpr);
		canvas.height = Math.floor(h * dpr);
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#000000';
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				if (matrix.get(x, y)) {
					ctx.fillRect(x, y, 1, 1);
				}
			}
		}
	}, [value, size]);

	if (!value) return null;

	return (
		<canvas
			ref={canvasRef}
			className={className}
			role="img"
			aria-label="QR-код"
		/>
	);
}
