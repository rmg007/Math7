import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';

interface ColumnToggleProps {
  columns: { key: string; header: string; alwaysVisible?: boolean }[];
  visibleColumns: Set<string>;
  onToggle: (key: string) => void;
}

export function ColumnToggle({ columns, visibleColumns, onToggle }: ColumnToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white/95 backdrop-blur-xl border-gray-200"
      >
        <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            className="text-xs focus:bg-teal-50 focus:text-teal-900"
            checked={visibleColumns.has(column.key)}
            onCheckedChange={() => onToggle(column.key)}
            disabled={column.alwaysVisible}
          >
            {column.header}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
