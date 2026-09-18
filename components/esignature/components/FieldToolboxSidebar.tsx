import React from 'react';
import { STANDARD_FIELDS, Recipient, PlacedField } from '../constants/esignatureConstants';

interface SidebarProps {
  recipients: Recipient[];
  activeRecipientId: string;
  setActiveRecipientId: (id: string) => void;
  getRecipientColor: (id: string) => any;
  setDraggedFieldDef: (def: { type: string; label: string } | null) => void;
  activeField: PlacedField | undefined;
  setActiveFieldId: (id: any) => void;
  setPlacedFields: React.Dispatch<React.SetStateAction<PlacedField[]>>;
  placedFields: PlacedField[]; // 👉 Added placedFields prop
}

export function FieldToolboxSidebar({
  recipients,
  activeRecipientId,
  setActiveRecipientId,
  getRecipientColor,
  setDraggedFieldDef,
  activeField,
  setActiveFieldId,
  setPlacedFields,
  placedFields, // 👉 Destructured here
}: SidebarProps) {
  return (
    <div className="w-full lg:w-80 bg-white rounded-xl border border-gray-200 p-5 space-y-6 shadow-xs flex flex-col overflow-y-auto">
      <div>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Assign to Recipient</h4>
        <div className="space-y-2">
          {recipients.map((rec) => {
            const color = getRecipientColor(rec.id);
            const isActive = activeRecipientId === rec.id;
            
            // 👉 Calculate field count for this specific recipient
            const fieldCount = placedFields.filter((f) => f.recipient_id === rec.id).length;

            return (
              <div
                key={rec.id}
                onClick={() => setActiveRecipientId(rec.id)}
                style={{
                  borderColor: color.border,
                  backgroundColor: isActive ? color.bg : undefined,
                }}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                  isActive ? 'font-medium shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="truncate pr-2">
                  <span style={{ color: isActive ? color.text : undefined }} className="font-semibold block truncate">
                    {rec.signer_name || `Signer #${rec.signing_order}`}
                  </span>
                  <span className="text-gray-500 text-[11px] truncate block">{rec.signer_email || 'No email specified'}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 👉 Field count pill */}
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium" title={`${fieldCount} fields placed`}>
                    {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                  </span>
                  <span
                    style={{ backgroundColor: color.badge, color: '#ffffff' }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                  >
                    P{rec.signing_order}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Drag Fields onto Document</h4>
        <p className="text-[11px] text-gray-500 mb-3">Drag fields onto the active page for the selected recipient.</p>
        <div className="grid grid-cols-2 gap-2">
          {STANDARD_FIELDS.map((field) => {
            const Icon = field.icon;
            const activeColor = getRecipientColor(activeRecipientId);

            return (
              <div
                key={field.type}
                draggable
                onDragStart={() => setDraggedFieldDef({ type: field.type, label: field.label })}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing transition text-gray-700 text-xs font-medium"
              >
                <Icon size={14} style={{ color: activeColor.border }} />
                <span className="truncate">{field.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {activeField && (
        <div className="mt-auto pt-4 border-t border-gray-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-800">Selected Field Properties</span>
            <button onClick={() => setActiveFieldId(null)} className="text-xs text-gray-500 hover:underline">Close</button>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Field Label</label>
            <input
              type="text"
              value={activeField.label}
              onChange={(e) => {
                const val = e.target.value;
                setPlacedFields((prev) => prev.map((f) => f.temp_id === activeField.temp_id ? { ...f, label: val } : f));
              }}
              className="w-full text-xs px-2.5 py-1.5 text-gray-900 bg-white border border-gray-300 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Assigned Signer</label>
            <select
              value={activeField.recipient_id}
              onChange={(e) => {
                const newRecipientId = e.target.value;
                setPlacedFields((prev) => prev.map((f) => f.temp_id === activeField.temp_id ? { ...f, recipient_id: newRecipientId } : f));
              }}
              className="w-full text-xs px-2.5 py-1.5 text-gray-900 bg-white border border-gray-300 rounded outline-none"
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.signer_name || `Signer #${r.signing_order}`} ({r.signer_email || 'No email'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_required_checkbox"
              checked={!!activeField.is_required}
              onChange={(e) => {
                const checked = e.target.checked;
                setPlacedFields((prev) => 
                  prev.map((f) => f.temp_id === activeField.temp_id ? { ...f, is_required: checked } : f)
                );
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_required_checkbox" className="text-xs font-medium text-gray-700 cursor-pointer">
              Required field for signer
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlacedFields((prev) => prev.filter((f) => f.temp_id !== activeField.temp_id));
              setActiveFieldId(null);
            }}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 rounded text-xs transition mt-2"
          >
            Remove Field Element
          </button>
        </div>
      )}
    </div>
  );
}