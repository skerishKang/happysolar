export interface FormField {
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'file';
  placeholder?: string;
  options?: string[];
  required: boolean;
} 