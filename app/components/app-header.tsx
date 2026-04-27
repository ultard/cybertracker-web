import { Link } from 'react-router';

import {
	canManageDisciplines,
	canManageUsers,
	canOrganize,
	canValidateQr,
	canViewAudit
} from '~/lib/roles';

import { cn } from '~/lib/utils';

import { Button } from '~/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';

import { useAuthStore } from '~/store/auth.store';

import { useMe } from '~/hooks/use-me';
import { useLogout } from '~/hooks/use-logout';

function NavLink({
	to,
	children,
	className
}: {
	to: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Link
			to={to}
			className={cn(
				'text-sm font-medium text-muted-foreground hover:text-foreground',
				className
			)}
		>
			{children}
		</Link>
	);
}

export function AppHeader() {
	const accessToken = useAuthStore((s) => s.accessToken);
	const { data: me } = useMe();
	const { logout, isPending: logoutPending } = useLogout();

	const role = me?.role;

	return (
		<header className="border-b border-border">
			<div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3">
				<div className="flex flex-wrap items-center gap-6">
					<Link to="/" className="text-lg font-semibold tracking-tight">
						CyberTracker
					</Link>
					<nav className="flex flex-wrap items-center gap-4">
						<NavLink to="/tournaments">Турниры</NavLink>
						<NavLink to="/disciplines">Дисциплины</NavLink>
						{accessToken ? <NavLink to="/profile">Профиль</NavLink> : null}
						{canOrganize(role) ? (
							<NavLink to="/org/tournaments">Кабинет орг.</NavLink>
						) : null}
						{canManageDisciplines(role) ? (
							<NavLink to="/admin/disciplines">Дисциплины (админ)</NavLink>
						) : null}
						{canManageUsers(role) ? (
							<NavLink to="/admin/users">Пользователи</NavLink>
						) : null}
						{canValidateQr(role) ? (
							<NavLink to="/staff/qr-validate">Проверка QR</NavLink>
						) : null}
						{canViewAudit(role) ? (
							<NavLink to="/staff/audit">Аудит</NavLink>
						) : null}
					</nav>
				</div>
				<div className="flex items-center gap-2">
					{accessToken && me ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" disabled={logoutPending}>
									{me.nickname || me.login}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem asChild>
									<Link to="/profile">Профиль</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									variant="destructive"
									onClick={() => logout()}
								>
									Выйти
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" asChild>
								<Link to="/login">Вход</Link>
							</Button>
							<Button size="sm" asChild>
								<Link to="/register">Регистрация</Link>
							</Button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
