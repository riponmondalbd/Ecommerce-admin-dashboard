import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { cva } from 'class-variance-authority';

const selectTriggerVariants = cva('flex items-center justify-between rounded-md border border-input bg-background text-sm shadow-sm transition-colors hover:bg-opacity-80 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-accent data-[state=open]:text-primary');

export const Select = SelectPrimitive.Root;

export const SelectTrigger = SelectPrimitive.Trigger;

export const SelectContent = SelectPrimitive.Content;

export const SelectItem = SelectPrimitive.Item;

export const SelectValue = SelectPrimitive.Value;

// Default export for convenience when doing "import Select from './select'"
export default Select;
