import { describe, expect, it } from 'vitest';

import {
	canJudgeMatches,
	canManageDisciplines,
	canManageParticipantRoster,
	canManageUsers,
	canOrganize,
	canPredict,
	canValidateQr,
	canViewAudit,
	isAdmin
} from './roles';

describe('roles helpers', () => {
	it('isAdmin only for admin', () => {
		expect(isAdmin('admin')).toBe(true);
		expect(isAdmin('organizer')).toBe(false);
		expect(isAdmin(undefined)).toBe(false);
	});

	it('canManageDisciplines only for admin', () => {
		expect(canManageDisciplines('admin')).toBe(true);
		expect(canManageDisciplines('manager')).toBe(false);
	});

	it('canManageUsers only for admin', () => {
		expect(canManageUsers('admin')).toBe(true);
		expect(canManageUsers('user')).toBe(false);
	});

	it('canOrganize for admin and organizer', () => {
		expect(canOrganize('admin')).toBe(true);
		expect(canOrganize('organizer')).toBe(true);
		expect(canOrganize('judge')).toBe(false);
	});

	it('canManageParticipantRoster includes judge', () => {
		expect(canManageParticipantRoster('judge')).toBe(true);
		expect(canManageParticipantRoster('user')).toBe(false);
	});

	it('canJudgeMatches for admin, organizer, judge', () => {
		expect(canJudgeMatches('judge')).toBe(true);
		expect(canJudgeMatches('manager')).toBe(false);
	});

	it('canViewAudit for admin and manager', () => {
		expect(canViewAudit('manager')).toBe(true);
		expect(canViewAudit('organizer')).toBe(false);
	});

	it('canPredict for admin, organizer, manager', () => {
		expect(canPredict('manager')).toBe(true);
		expect(canPredict('judge')).toBe(false);
	});

	it('canValidateQr for admin and organizer', () => {
		expect(canValidateQr('organizer')).toBe(true);
		expect(canValidateQr('manager')).toBe(false);
	});
});
