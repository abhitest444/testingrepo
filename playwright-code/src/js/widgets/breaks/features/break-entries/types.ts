import { BreakEntry } from '../../types';

export interface BreakEntryFormState extends BreakEntry {
  isLocked?: boolean;
}

export interface BreakEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: BreakEntry) => void;
  initialData?: Partial<BreakEntry>;
  assigneeId: string;
}
