import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaginationControls } from './pagination-controls';

describe('PaginationControls', () => {
	it('shows empty state when total is zero', () => {
		render(
			<PaginationControls page={{ skip: 0, limit: 10, total: 0 }} onPageChange={vi.fn()} />
		);
		expect(screen.getByText('Нет записей')).toBeInTheDocument();
	});

	it('shows range for current page', () => {
		render(
			<PaginationControls page={{ skip: 10, limit: 10, total: 35 }} onPageChange={vi.fn()} />
		);
		expect(screen.getByText('11–20 из 35')).toBeInTheDocument();
	});

	it('disables back on first page', () => {
		const { container } = render(
			<PaginationControls page={{ skip: 0, limit: 10, total: 30 }} onPageChange={vi.fn()} />
		);
		const [back, forward] = container.querySelectorAll('button');
		expect(back).toBeDisabled();
		expect(forward).toBeEnabled();
	});

	it('calls onPageChange when next clicked', async () => {
		const user = userEvent.setup();
		const onPageChange = vi.fn();
		const { container } = render(
			<PaginationControls page={{ skip: 0, limit: 10, total: 30 }} onPageChange={onPageChange} />
		);
		const forward = container.querySelectorAll('button')[1];
		expect(forward).toBeTruthy();
		await user.click(forward as HTMLButtonElement);
		expect(onPageChange).toHaveBeenCalledWith(10);
	});
});
