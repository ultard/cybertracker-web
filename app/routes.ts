import {
	index,
	layout,
	type RouteConfig,
	route
} from '@react-router/dev/routes';

export default [
	layout('routes/_layout.tsx', [
		index('routes/home.tsx'),
		route('login', 'routes/login.tsx'),
		route('register', 'routes/register.tsx'),
		route('disciplines', 'routes/disciplines.tsx'),
		route('disciplines/:disciplineId', 'routes/disciplines.$disciplineId.tsx'),
		route('tournaments', 'routes/tournaments.tsx'),
		route('tournaments/:tournamentId', 'routes/tournaments.$tournamentId.tsx'),
		route('profile', 'routes/profile.tsx'),
		route('org/tournaments', 'routes/org-tournaments.tsx'),
		route('org/tournaments/new', 'routes/org-tournament-new.tsx'),
		route(
			'org/tournaments/:tournamentId/edit',
			'routes/org-tournament-edit.tsx'
		),
		route('admin/disciplines', 'routes/admin-disciplines.tsx'),
		route('admin/users', 'routes/admin-users.tsx'),
		route('staff/qr-validate', 'routes/staff-qr-validate.tsx'),
		route('staff/audit', 'routes/staff-audit.tsx')
	])
] satisfies RouteConfig;
