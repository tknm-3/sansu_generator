import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MakeTenFrame } from '../../src/components/MakeTenFrame';

describe('MakeTenFrame', () => {
  it('renders 10 cells total', () => {
    render(<MakeTenFrame filled={3} />);
    expect(screen.getAllByTestId('cell')).toHaveLength(10);
  });
  it('renders the given number of filled cells', () => {
    render(<MakeTenFrame filled={3} />);
    expect(screen.getAllByTestId('cell-filled')).toHaveLength(3);
  });
  it('renders flash prop without crashing', () => {
    render(<MakeTenFrame filled={10} flash />);
    expect(screen.getAllByTestId('cell-filled')).toHaveLength(10);
  });
  it('clamps filled above 10', () => {
    render(<MakeTenFrame filled={12} />);
    expect(screen.getAllByTestId('cell-filled')).toHaveLength(10);
  });
});
