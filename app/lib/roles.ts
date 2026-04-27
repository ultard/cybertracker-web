export type AppRole = 'admin' | 'organizer' | 'manager' | 'judge' | 'user';

export function isAdmin(role: string | undefined): boolean {
	return role === 'admin';
}

export function canManageDisciplines(role: string | undefined): boolean {
	return role === 'admin';
}

export function canManageUsers(role: string | undefined): boolean {
	return role === 'admin';
}

export function canOrganize(role: string | undefined): boolean {
	return role === 'admin' || role === 'organizer';
}

/** Подтверждение заявок и правка роли/статуса участника на турнире. */
export function canManageParticipantRoster(role: string | undefined): boolean {
	return (
		role === 'admin' ||
		role === 'organizer' ||
		role === 'manager' ||
		role === 'judge'
	);
}

export function canJudgeMatches(role: string | undefined): boolean {
	return role === 'admin' || role === 'organizer' || role === 'judge';
}

export function canViewAudit(role: string | undefined): boolean {
	return role === 'admin' || role === 'manager';
}

export function canPredict(role: string | undefined): boolean {
	return role === 'admin' || role === 'organizer' || role === 'manager';
}

export function canValidateQr(role: string | undefined): boolean {
	return role === 'admin' || role === 'organizer';
}
