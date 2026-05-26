import { describe, expect, it, vi } from 'vitest';

import {
	getTournamentDatetimeBounds,
	toLocalDatetimeValue,
	validateTournamentSchedule
} from './tournament-dates';

describe('tournament-dates', () => {
	it('validateTournamentSchedule rejects past start', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-26T12:00:00'));
		const { min, max } = getTournamentDatetimeBounds();
		expect(
			validateTournamentSchedule('2026-05-25T12:00', '2026-05-27T12:00', {
				boundsMin: min,
				boundsMax: max
			})
		).toMatch(/начала/);
		vi.useRealTimers();
	});

	it('validateTournamentSchedule rejects end before start', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-26T12:00:00'));
		const { min, max } = getTournamentDatetimeBounds();
		expect(
			validateTournamentSchedule('2026-06-01T12:00', '2026-06-01T10:00', {
				boundsMin: min,
				boundsMax: max
			})
		).toMatch(/позже/);
		vi.useRealTimers();
	});

	it('toLocalDatetimeValue formats local datetime-local string', () => {
		const s = toLocalDatetimeValue(new Date(2026, 4, 26, 9, 5));
		expect(s).toBe('2026-05-26T09:05');
	});
});
