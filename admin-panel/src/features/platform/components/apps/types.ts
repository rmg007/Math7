import type { CompiledApp } from '../../hooks/use-apps';

export interface AppRowProps {
  app: CompiledApp;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (app: CompiledApp) => void;
  onDelete: (id: string) => void;
  visibleColumns: Set<string>;
}
