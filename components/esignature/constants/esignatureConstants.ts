import { 
  FileText, 
  Calendar, 
  Mail, 
  User, 
  FileSignature, 
  CheckSquare, 
  Stamp, 
  Building2, 
  Briefcase, 
  ChevronDown, 
  CircleDot, 
  CreditCard, 
  Paperclip, 
  Calculator 
} from 'lucide-react';

export interface Recipient {
  id: string;
  signer_email: string;
  signer_name: string;
  action_type: string;
  signing_order: number;
}

export interface PlacedField {
  temp_id: number;
  recipient_id: string;
  field_type: string;
  label: string;
  page_number: number;
  x_coord: number;
  y_coord: number;
  width: number;
  height: number;
  is_required: boolean;
}

export interface DocumentSignSetupWizardProps {
  existingDocuments?: any[];
  onSaveSuccess?: () => void;
  onClose?: () => void;
}

export const STANDARD_FIELDS = [
  // Core signature elements
  { type: 'signature', label: 'Signature', icon: FileSignature },
  { type: 'initial', label: 'Initial', icon: FileSignature },
  { type: 'stamp', label: 'Stamp', icon: Stamp },
  { type: 'image', label: 'Image', icon: FileText },
  
  // Signer data fields
  { type: 'company', label: 'Company', icon: Building2 },
  { type: 'full_name', label: 'Full name', icon: User },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'job_title', label: 'Job title', icon: Briefcase },
  
  // Date fields
  { type: 'sign_date', label: 'Sign date', icon: Calendar },
  { type: 'date', label: 'Date', icon: Calendar },
  
  // Text input elements
  { type: 'text', label: 'Text', icon: FileText },
  { type: 'split_text', label: 'Split text', icon: FileText },
  
  // Selection and interactive elements
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'radio', label: 'Radio', icon: CircleDot },
  { type: 'checkbox_group', label: 'Checkbox group', icon: CheckSquare },
  
  // Advanced elements
  { type: 'payment', label: 'Payment', icon: CreditCard },
  { type: 'attachment', label: 'Attachment', icon: Paperclip },
  { type: 'formula', label: 'Formula', icon: Calculator },
];

export const RECIPIENT_COLORS = [
  { border: '#2563eb', bg: '#dbeafe', badge: '#1d4ed8', text: '#1e40af' }, // Blue
  { border: '#059669', bg: '#d1fae5', badge: '#047857', text: '#065f46' }, // Emerald
  { border: '#d97706', bg: '#fef3c7', badge: '#b45309', text: '#92400e' }, // Amber
  { border: '#7c3aed', bg: '#ede9fe', badge: '#6d28d9', text: '#5b21b6' }, // Violet
  { border: '#db2777', bg: '#fce7f3', badge: '#be185d', text: '#9d174d' }, // Pink
  { border: '#0891b2', bg: '#cffaff', badge: '#0e7490', text: '#155e75' }, // Cyan
];

export const BASE_WIDTH = 800;