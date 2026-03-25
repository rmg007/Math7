/**
 * question-studio-filter-panel.test.tsx
 *
 * Tests: Pure presentational filter sidebar — domain dropdown, topic input,
 *        quantity dropdown, difficulty mixer, type toggles, generate button,
 *        prompt preview panel.
 *
 * Test IDs: AP-CURR-070 .. AP-CURR-089
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionStudioFilterPanel } from '../question-studio-filter-panel';
import type { DifficultyMix, QuestionType } from '@/hooks/use-studio-generator';

// Mock useDomains to avoid Supabase calls
vi.mock('@/features/curriculum/hooks/use-domains', () => ({
  useDomains: () => ({
    data: [
      { domain_id: '1', title: 'Mathematics' },
      { domain_id: '2', title: 'English Language' },
      { domain_id: '3', title: 'History' },
      { domain_id: '4', title: 'Science' },
      { domain_id: '5', title: 'Computer Science' },
      { domain_id: '6', title: 'General Knowledge' },
    ],
    isLoading: false,
  }),
}));

const defaultDiffMix: DifficultyMix = { easy: 3, medium: 4, hard: 3 };
const defaultTypes: QuestionType[] = ['mcq', 'boolean'];

type FilterPanelProps = Parameters<typeof QuestionStudioFilterPanel>[0];

function buildProps(overrides: Partial<FilterPanelProps> = {}): FilterPanelProps {
  return {
    selectedDomain: null,
    setSelectedDomain: vi.fn(),
    topics: [],
    setTopics: vi.fn(),
    count: 10,
    setCount: vi.fn(),
    diffMix: defaultDiffMix,
    setDiffMix: vi.fn(),
    diffPreset: 'Balanced',
    setDiffPreset: vi.fn(),
    selectedTypes: defaultTypes,
    setSelectedTypes: vi.fn(),
    customInstructions: '',
    setCustomInstructions: vi.fn(),
    isGenerating: false,
    canGenerate: true,
    onGenerate: vi.fn(),
    ...overrides,
  };
}

describe('QuestionStudioFilterPanel — AP-CURR-070..089', () => {
  it('AP-CURR-070: renders "Subject Domain" label', () => {
    render(<QuestionStudioFilterPanel {...buildProps()} />);
    expect(screen.getByText('Subject Domain')).toBeInTheDocument();
  });

  it('AP-CURR-073: topic input section always visible', () => {
    render(<QuestionStudioFilterPanel {...buildProps()} />);
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type a topic and press enter/i)).toBeInTheDocument();
  });

  it('AP-CURR-074: shows "Add at least one topic" hint when topics is empty', () => {
    render(<QuestionStudioFilterPanel {...buildProps({ topics: [] })} />);
    expect(screen.getByText(/add at least one topic/i)).toBeInTheDocument();
  });

  it('AP-CURR-075: renders topic tags when topics are provided', () => {
    render(<QuestionStudioFilterPanel {...buildProps({ topics: ['Algebra', 'Geometry'] })} />);
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
  });

  it('AP-CURR-078: warning "Select at least one type" shown when selectedTypes is empty', () => {
    render(<QuestionStudioFilterPanel {...buildProps({ selectedTypes: [] })} />);
    expect(screen.getByText(/select at least one type/i)).toBeInTheDocument();
  });

  it('AP-CURR-079: warning is absent when at least one type is selected', () => {
    render(<QuestionStudioFilterPanel {...buildProps({ selectedTypes: ['mcq'] })} />);
    expect(screen.queryByText(/select at least one type/i)).not.toBeInTheDocument();
  });

  it('AP-CURR-080: generate button is disabled when canGenerate is false', () => {
    render(<QuestionStudioFilterPanel {...buildProps({ canGenerate: false })} />);
    const btn = screen.getByRole('button', { name: /generate/i });
    expect(btn).toBeDisabled();
  });

  it('AP-CURR-081: generate button shows "Generating..." when isGenerating is true', () => {
    render(
      <QuestionStudioFilterPanel {...buildProps({ isGenerating: true, canGenerate: false })} />
    );
    expect(screen.getByText(/generating\.\.\./i)).toBeInTheDocument();
  });

  it('AP-CURR-082: clicking generate calls onGenerate once when enabled', () => {
    const onGenerate = vi.fn();
    render(
      <QuestionStudioFilterPanel
        {...buildProps({ canGenerate: true, isGenerating: false, onGenerate })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('AP-CURR-083: renders all 5 question type buttons', () => {
    render(<QuestionStudioFilterPanel {...buildProps()} />);
    expect(screen.getByText('MCQ')).toBeInTheDocument();
    expect(screen.getByText('MCQ Multi')).toBeInTheDocument();
    expect(screen.getByText('True / False')).toBeInTheDocument();
    expect(screen.getByText('Short Answer')).toBeInTheDocument();
    expect(screen.getByText('Reorder')).toBeInTheDocument();
  });

  it('AP-CURR-084: clicking a question type calls setSelectedTypes', () => {
    const setSelectedTypes = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ setSelectedTypes })} />);
    fireEvent.click(screen.getByText('MCQ Multi'));
    expect(setSelectedTypes).toHaveBeenCalledTimes(1);
  });

  it('AP-CURR-089: prompt preview toggle exists', () => {
    render(<QuestionStudioFilterPanel {...buildProps()} />);
    expect(screen.getByText(/view prompt preview/i)).toBeInTheDocument();
  });
});
