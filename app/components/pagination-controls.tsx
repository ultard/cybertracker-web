import { Button } from '~/components/ui/button';

type PageInfo = {
	skip: number;
	limit: number;
	total: number;
};

export function PaginationControls({
	page,
	onPageChange
}: {
	page: PageInfo;
	onPageChange: (nextSkip: number) => void;
}) {
	const { skip, limit, total } = page;
	const hasPrev = skip > 0;
	const hasNext = skip + limit < total;

	return (
		<div className="flex flex-wrap items-center gap-4">
			<p className="text-muted-foreground text-sm">
				{total === 0 ? 'Нет записей' : `${skip + 1}–${Math.min(skip + limit, total)} из ${total}`}
			</p>
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={!hasPrev}
					onClick={() => onPageChange(Math.max(0, skip - limit))}
				>
					Назад
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={!hasNext}
					onClick={() => onPageChange(skip + limit)}
				>
					Вперёд
				</Button>
			</div>
		</div>
	);
}
