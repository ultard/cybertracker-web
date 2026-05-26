/** Допустимый горизонт дат проведения турнира (в годах от текущего момента). */
export const TOURNAMENT_SCHEDULE_MAX_YEARS = 2;

export function toLocalDatetimeValue(iso: string | Date | undefined): string {
	if (!iso) return '';
	const d = iso instanceof Date ? iso : new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getTournamentDatetimeBounds(): { min: string; max: string } {
	const now = new Date();
	now.setSeconds(0, 0);
	const max = new Date(now);
	max.setFullYear(max.getFullYear() + TOURNAMENT_SCHEDULE_MAX_YEARS);
	return {
		min: toLocalDatetimeValue(now),
		max: toLocalDatetimeValue(max)
	};
}

/** min для input: если текущее значение в прошлом — оставить его (редактирование без смены дат). */
export function effectiveDatetimeMin(
	current: string,
	boundsMin: string
): string {
	if (current && current < boundsMin) return current;
	return boundsMin;
}

export function validateTournamentSchedule(
	startAt: string,
	endAt: string,
	opts?: { boundsMin?: string; boundsMax?: string }
): string | null {
	const { min, max } = getTournamentDatetimeBounds();
	const boundsMin = opts?.boundsMin ?? min;
	const boundsMax = opts?.boundsMax ?? max;

	if (!startAt || !endAt) {
		return 'Укажите дату начала и окончания';
	}
	if (startAt < boundsMin || startAt > boundsMax) {
		return `Дата начала: от сегодня до ${TOURNAMENT_SCHEDULE_MAX_YEARS} лет вперёд`;
	}
	if (endAt < boundsMin || endAt > boundsMax) {
		return `Дата окончания: от сегодня до ${TOURNAMENT_SCHEDULE_MAX_YEARS} лет вперёд`;
	}
	if (endAt <= startAt) {
		return 'Окончание должно быть позже начала';
	}
	return null;
}
