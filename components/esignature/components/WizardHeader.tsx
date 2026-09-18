import React from 'react';
import { ArrowLeft, ArrowRight, Send, X } from 'lucide-react';
import { Recipient } from '../constants/esignatureConstants';

interface WizardHeaderProps {
  step: 1 | 2;
  setStep: (step: 1 | 2) => void;
  primaryColor: string;
  mergedBlobUrl: string | null;
  recipients: Recipient[]; // Added recipients prop to validate emails
  handleFinishAndSend: () => void;
  onClose?: () => void;
}

export function WizardHeader({
  step,
  setStep,
  primaryColor,
  mergedBlobUrl,
  recipients,
  handleFinishAndSend,
  onClose,
}: WizardHeaderProps) {
  const handleContinueClick = () => {
    // 1. Check if document is attached / processed
    if (!mergedBlobUrl) {
      alert('Please upload at least one document to proceed.');
      return;
    }

    // 2. Check if recipients array has elements
    if (!recipients || recipients.length === 0) {
      alert('Please add at least one recipient.');
      return;
    }

    // 3. Strict Email Validation Loop
// 3. Strict Email & Name Validation Loop
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i].signer_email ? recipients[i].signer_email.trim() : '';
      const name = recipients[i].signer_name ? recipients[i].signer_name.trim() : '';
      
      // 👉 NEW: Check for missing name
      if (!name) {
        alert(`Recipient #${i + 1} is missing a name.`);
        return;
      }

      if (!email) {
        alert(`Recipient #${i + 1} is missing an email address.`);
        return;
      }
      
      if (!emailRegex.test(email)) {
        alert(`Recipient #${i + 1} has an invalid email address format (${email}).`);
        return;
      }
    }

    // 4. All checks passed, move to step 2
    setStep(2);
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {step === 1 ? 'New Signing Request: Details & Recipients' : 'Place Signature & Form Fields'}
        </h2>
        <p className="text-sm text-gray-500">
          {step === 1
            ? 'Upload your document and configure recipients & routing order.'
            : 'Drag fields onto the canvas and assign them to specific signers.'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {step === 1 ? (
          <button
            onClick={handleContinueClick}
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white hover:opacity-90 rounded-lg transition shadow-xs"
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleFinishAndSend}
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white hover:opacity-90 rounded-lg transition shadow-xs"
          >
            <Send size={16} /> Send Envelope
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}