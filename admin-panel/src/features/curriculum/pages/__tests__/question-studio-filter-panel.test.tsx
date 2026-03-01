/**
 * question-studio-filter-panel.test.tsx
 *
 * Tests: Pure presentational filter sidebar — domain picker, topic input,
 *        quantity presets, difficulty mixer, type toggles, generate button.
 *
 * Test IDs: AP-CURR-070 .. AP-CURR-082
 */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionStudioFilterPanel } from '../question-studio-filter-panel';
import type { DifficultyMix, Domain, QuestionType } from '@/hooks/use-studio-generator';

const defaultDiffMix: DifficultyMix = { easy: 3, medium: 4, hard: 3 };
const defaultTypes: QuestionType[] = ['mcq', 'boolean'];

function buildProps(overrides: Partial<Parameters<typeof QuestionStudioFilterPanel>[0]> = {}) {
  return {
    selectedDomain: null as Domain | null,
    setSelectedDomain: vi.fn(),
    topic: '',
    setTopic: vi.fn(),
    count: 10,
    setCount: vi.fn(),
    customCount: false,
    setCustomCount: vi.fn(),
    diffMix: defaultDiffMix,
    setDiffMix: vi.fn(),
    selectedTypes: defaultTypes,
    setSelectedTypes: vi.fn(),
    customInstructions: '',
    setCustomInstructions: vi.fn(),
    showAdvanced: false,
    setShowAdvanced: vi.fn(),
    isGenerating: false,
    canGenerate: true,
    onGenerate: vi.fn(),
    ...overrides,
  };
}

describe('QuestionStudioFilterPanel — AP-CURR-070..082', () => {
  it('AP-CURR-070: renders all six domain buttons', () => {
    render(<QuestionStudioFilterPanel {...buildProps()} />);

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English Language')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('General Knowledge')).toBeInTheDocument();
  });

  it('AP-CURR-071: clicking a domain button calls setSelectedDomain with that domain', () => {
    const setSelectedDomain = vi.fn();
    const setTopic = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ setSelectedDomain, setTopic })} />);

    fireEvent.click(screen.getByText('Mathematics'));

    expect(setSelectedDomain).toHaveBeenCalledWith('Mathematics');
  });

  it('AP-CURR-072: clicking a domain button resets topic to empty string', () => {
    const setTopic = vi.fn();
    render(
      <QuestionStudioFilterPanel
        {...buildProps({ selectedDomain: null, topic: 'Algebra', setTopic })}
      />
    );

    fireEvent.click(screen.getByText('Science'));

    expect(setTopic).toHaveBeenCalledWith('');
  });

  it('AP-CURR-073: topic section is NOT rendered when selectedDomain is null', () => {
    render(<QuestionStudioFilterPanel {...buildProps({ selectedDomain: null })} />);

    expect(screen.queryByPlaceholderText(/e\.g\./i)).not.toBeInTheDocument();
  });

  it('AP-CURR-074: topic input and chips render when a domain is selected', () => {
    render(
      <QuestionStudioFilterPanel
        {...buildProps({ selectedDomain: 'Mathematics' as Domain, topic: '' })}
      />
    );

    expect(screen.getByPlaceholderText(/integer operations/i)).toBeInTheDocument();
    expect(screen.getByText('Algebra')).toBeInTheDocument();
  });

  it('AP-CURR-075: clicking a topic chip calls setTopic with that chip label', () => {
    const setTopic = vi.fn();
    render(
      <QuestionStudioFilterPanel
        {...buildProps({ selectedDomain: 'Mathematics' as Domain, topic: '', setTopic })}
      />
    );

    fireEvent.click(screen.getByText('Algebra'));

    expect(setTopic).toHaveBeenCalledWith('Algebra');
  });

  it('AP-CURR-076: quantity preset button fires setCount and setCustomCount(false)', () => {
    const setCount = vi.fn();
    const setDiffMix = vi.fn();
    const setCustomCount = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ setCount, setDiffMix, setCustomCount })} />);

    fireEvent.click(screen.getByRole('button', { name: '20' }));

    expect(setCustomCount).toHaveBeenCalledWith(false);
    expect(setDiffMix).toHaveBeenCalled();
  });

  it('AP-CURR-077: "Custom" quantity button calls setCustomCount(true)', () => {
    const setCustomCount = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ setCustomCount })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

    expect(setCustomCount).toHaveBeenCalledWith(true);
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

  it('AP-CURR-083: renders all 5 question type chips', () => {
    render(<QuestionStudioFilterPanel {...buildProps()} />);

    expect(screen.getByText('MCQ')).toBeInTheDocument();
    expect(screen.getByText('MCQ Multi')).toBeInTheDocument();
    expect(screen.getByText('True / False')).toBeInTheDocument();
    expect(screen.getByText('Short Answer')).toBeInTheDocument();
    expect(screen.getByText('Reorder')).toBeInTheDocument();
  });

  it('AP-CURR-084: clicking a question type chip calls setSelectedTypes', () => {
    const setSelectedTypes = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ setSelectedTypes })} />);

    fireEvent.click(screen.getByText('MCQ Multi'));

    expect(setSelectedTypes).toHaveBeenCalledTimes(1);
  });

  it('AP-CURR-085: "Balanced" preset calls setDiffMix with correct values for count=10', () => {
    const setDiffMix = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ count: 10, setDiffMix })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Balanced' }));

    // floor(10/3)=3 easy, floor(10/3)=3 medium, 10-3-3=4 hard
    expect(setDiffMix).toHaveBeenCalledWith({ easy: 3, medium: 3, hard: 4 });
  });

  it('AP-CURR-086: "Beginner" preset calls setDiffMix with correct values for count=10', () => {
    const setDiffMix = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ count: 10, setDiffMix })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));

    // round(0.7*10)=7 easy, round(0.2*10)=2 medium, 10-7-2=1 hard
    expect(setDiffMix).toHaveBeenCalledWith({ easy: 7, medium: 2, hard: 1 });
  });

  it('AP-CURR-087: "Challenge" preset calls setDiffMix with correct values for count=10', () => {
    const setDiffMix = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ count: 10, setDiffMix })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Challenge' }));

    // round(0.1*10)=1 easy, round(0.3*10)=3 medium, 10-1-3=6 hard
    expect(setDiffMix).toHaveBeenCalledWith({ easy: 1, medium: 3, hard: 6 });
  });

  it('AP-CURR-088: "Exam Prep" preset calls setDiffMix with correct values for count=10', () => {
    const setDiffMix = vi.fn();
    render(<QuestionStudioFilterPanel {...buildProps({ count: 10, setDiffMix })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Exam Prep' }));

    // round(0.2*10)=2 easy, round(0.4*10)=4 medium, 10-2-4=4 hard
    expect(setDiffMix).toHaveBeenCalledWith({ easy: 2, medium: 4, hard: 4 });
  });

  it('AP-CURR-089: clicking "+ Add Custom Instructions" reveals the textarea', () => {
    function Controlled() {
      const [showAdv, setShowAdv] = React.useState(false);
      return (
        <QuestionStudioFilterPanel
          {...buildProps({ showAdvanced: showAdv, setShowAdvanced: setShowAdv })}
        />
      );
    }
    render(<Controlled />);

    expect(
      screen.queryByPlaceholderText(/Avoid questions involving fractions/i)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/\+ Add Custom Instructions/));

    expect(screen.getByPlaceholderText(/Avoid questions involving fractions/i)).toBeInTheDocument();
  });
});
