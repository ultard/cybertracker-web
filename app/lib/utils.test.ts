import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
	it('merges tailwind classes with last winning', () => {
		expect(cn('px-2', 'px-4')).toBe('px-4');
	});

	it('handles conditional classes', () => {
		expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
	});

	it('returns empty string for no inputs', () => {
		expect(cn()).toBe('');
	});
});
