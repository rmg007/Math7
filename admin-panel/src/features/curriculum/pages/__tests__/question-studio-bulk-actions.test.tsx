/**
 * question-studio-bulk-actions.test.tsx
 *
 * Tests: Pure presentational toolbar — renders buttons, stats summary,
 *        conditional editedCount line, and callback wiring.
 *
 * Test IDs: AP-CURR-050 .. AP-CURR-056
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionStudioBulkActions } from '../question-studio-bulk-actions';

const defaultProps = {
  keptCount: 0,
  removedCount: 0,
  editedCount: 0,
  onKeepAll: vi.fn(),
  onRemoveAll: vi.fn(),
  onClear: vi.fn(),
};

describe('QuestionStudioBulkActions — AP-CURR-050..056', () => {
  it('AP-CURR-050: renders "Keep All", "Remove All", and "Clear" buttons', () => {
    render(<QuestionStudioBulkActions {...defaultProps} />);

    expect(screen.getByRole('button', { name: /keep all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('AP-CURR-051: displays "X kept · Y removed" summary string', () => {
    render(
      <QuestionStudioBulkActions {...defaultProps} keptCount={3} removedCount={7} editedCount={0} />
    );

    expect(screen.getByText(/3 kept · 7 removed/i)).toBeInTheDocument();
  });

  it('AP-CURR-052: editedCount line is NOT rendered when editedCount = 0', () => {
    render(
      <QuestionStudioBulkActions {...defaultProps} keptCount={1} removedCount={2} editedCount={0} />
    );

    expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
  });

  it('AP-CURR-053: editedCount line IS rendered when editedCount > 0', () => {
    render(
      <QuestionStudioBulkActions {...defaultProps} keptCount={1} removedCount={2} editedCount={5} />
    );

    expect(screen.getByText(/5 edited/i)).toBeInTheDocument();
  });

  it('AP-CURR-054: clicking "Keep All" calls onKeepAll exactly once', () => {
    const onKeepAll = vi.fn();
    render(<QuestionStudioBulkActions {...defaultProps} onKeepAll={onKeepAll} />);

    fireEvent.click(screen.getByRole('button', { name: /keep all/i }));

    expect(onKeepAll).toHaveBeenCalledTimes(1);
  });

  it('AP-CURR-055: clicking "Remove All" calls onRemoveAll exactly once', () => {
    const onRemoveAll = vi.fn();
    render(<QuestionStudioBulkActions {...defaultProps} onRemoveAll={onRemoveAll} />);

    fireEvent.click(screen.getByRole('button', { name: /remove all/i }));

    expect(onRemoveAll).toHaveBeenCalledTimes(1);
  });

  it('AP-CURR-056: clicking "Clear" calls onClear exactly once', () => {
    const onClear = vi.fn();
    render(<QuestionStudioBulkActions {...defaultProps} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
