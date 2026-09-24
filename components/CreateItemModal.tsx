'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Check, Lock, X, User } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, isEmployee?: boolean) => Promise<void>;
  creatingType: 'sub_company' | 'cabinet' | 'folder' | null;
  parentName?: string;
  parentId?: string;
  parentFolderType?: string;
  primaryColor?: string;
}

export default function CreateItemModal({
  isOpen,
  onClose,
  onSubmit,
  creatingType,
  parentName = '',
  parentId = '',
  parentFolderType = '',
  primaryColor = '#2D1B4E',
}: CreateItemModalProps) {
  const [name, setName] = useState('');
  const [folderType, setFolderType] = useState<'generic' | 'department' | 'employee' | 'client'>('generic');
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employee-specific fields matching exact Django Employee model fields
  const [staffNo, setStaffNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contractType, setContractType] = useState('Contract');
  const [dateJoined, setDateJoined] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [nssfNo, setNssfNo] = useState('');
  const [nhifNo, setNhifNo] = useState('');
  const [salary, setSalary] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');

  // List of valid HR departments fetched from the backend via apiCall
  const [departments, setDepartments] = useState<any[]>([]);

  // Fetch HR departments when modal opens in employee mode using apiCall
  useEffect(() => {
    if (isOpen && creatingType === 'folder' && folderType === 'employee') {
      const fetchDepartments = async () => {
        try {
          if (parentId) {
            try {
              const scopedData = await apiCall(`/v1/hr/departments/${parentId}/company_departments/`, { 
                requiresAuth: true 
              });
              const scopedList = Array.isArray(scopedData) ? scopedData : scopedData.results || [];
              
              if (scopedList.length > 0) {
                setDepartments(scopedList);
                return;
              }
            } catch (err) {
              // Fall through to global departments if scoped endpoint fails or returns empty
            }
          }

          // Fallback: Fetch all global departments
          const fallbackData = await apiCall('/v1/hr/departments/', { 
            requiresAuth: true 
          });
          const fallbackList = Array.isArray(fallbackData) ? fallbackData : fallbackData.results || [];
          setDepartments(fallbackList);
        } catch (err) {
          setDepartments([]);
        }
      };

      fetchDepartments();
    }
  }, [isOpen, creatingType, folderType, parentId]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (creatingType) {
      case 'sub_company':
        return 'Create Sub-Company';
      case 'cabinet':
        return 'Create Cabinet';
      case 'folder':
        return 'Create Folder';
      default:
        return 'Create Item';
    }
  };

  const handleFolderTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as any;
    setFolderType(val);
    if (val === 'employee' && !staffNo) {
      setStaffNo(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const resetForm = () => {
    setName('');
    setFolderType('generic');
    setIsLocked(false);
    setStaffNo('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setNationalId('');
    setKraPin('');
    setEmail('');
    setPhone('');
    setContractType('Contract');
    setDateJoined(new Date().toISOString().split('T')[0]);
    setLocation('');
    setBankName('');
    setBankAccount('');
    setNssfNo('');
    setNhifNo('');
    setSalary('');
    setSelectedDepartmentId('');
    setSelectedPositionId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmployeeMode = creatingType === 'folder' && folderType === 'employee';

    const effectiveName = name.trim() || (isEmployeeMode ? `${firstName} ${lastName}`.trim() : '');

    if (!isEmployeeMode && !effectiveName) return;
    if (isSubmitting) return;

    if (isEmployeeMode) {
      if (!firstName || !lastName || !staffNo || !nationalId || !email || !phone || !dateJoined) {
        alert('Please fill in all required employee fields.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (isEmployeeMode) {
        const finalDepartment = selectedDepartmentId || null;

        await onSubmit({
          name: effectiveName || 'Employee Profile',
          folderType: 'employee',
          isLocked: isLocked,
          tenant_id: parentId || undefined, // Ensures tenant association if parent represents context
          employeeData: {
            staff_no: staffNo,
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            national_id: nationalId,
            kra_pin: kraPin || null,
            email: email,
            phone: phone,
            contract_type: contractType,
            date_joined: dateJoined,
            location: location || null,
            bank_name: bankName || null,
            bank_account: bankAccount || null,
            nssf_no: nssfNo || null,
            nhif_no: nhifNo || null,
            salary: salary ? Number(salary) : null,
            department: finalDepartment,
            position: selectedPositionId || null,
          }
        }, true);
      
      } else {
        await onSubmit({
          name: effectiveName,
          folderType,
          isLocked,
        }, false);
      }
      
      resetForm();
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmployeeMode = creatingType === 'folder' && folderType === 'employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className={`bg-white rounded-lg shadow-xl border w-full ${isEmployeeMode ? 'max-w-lg' : 'max-w-sm'} p-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between mb-3 border-b pb-2 flex-shrink-0">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
              {getTitle()} {isEmployeeMode && '(Employee Registry)'}
            </h3>
            {parentName && (
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                Inside: <span className="font-medium text-gray-700">{parentName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto pr-1">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              {isEmployeeMode ? 'Folder / Group Identifier Name (Optional)' : 'Name'} {!isEmployeeMode && <span className="text-red-500">*</span>}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEmployeeMode ? 'e.g. Engineering Team' : `Enter ${creatingType?.replace('_', ' ')} name...`}
              className="w-full text-xs px-2.5 py-1.5 border rounded outline-none bg-white shadow-sm focus:ring-1"
              style={{ borderColor: primaryColor }}
              required={!isEmployeeMode}
            />
          </div>

          {creatingType === 'folder' && (
            <div className="flex flex-col gap-2.5 bg-gray-50 p-3 rounded border">
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">
                  Folder Category
                </label>
                <select
                  value={folderType}
                  onChange={handleFolderTypeChange}
                  className="text-xs border rounded p-1.5 bg-white outline-none w-full"
                >
                  <option value="generic">Generic Folder</option>
                  <option value="department">Department</option>
                  <option value="employee">Employee</option>
                  <option value="client">Client</option>
                </select>
              </div>

              {folderType === 'employee' && (
                <div className="mt-2 pt-2 border-t border-gray-200 flex flex-col gap-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-purple-700 mb-0.5">
                    <User size={12} /> Employee Registry Details
                  </div>

                  {/* Department Assignment Dropdown */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600">Assign to HR Department</label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full text-xs px-2 py-1 border rounded bg-white"
                    >
                      <option value="">-- None / Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id || dept.pk} value={dept.id || dept.pk}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">First Name *</label>
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Middle Name</label>
                      <input
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Kibet"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Last Name *</label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Staff No & National ID */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Staff No *</label>
                      <input
                        value={staffNo}
                        onChange={(e) => setStaffNo(e.target.value)}
                        placeholder="EMP001"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">National ID *</label>
                      <input
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="12345678"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Phone *</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+2547..."
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* KRA PIN & Contract Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">KRA PIN</label>
                      <input
                        value={kraPin}
                        onChange={(e) => setKraPin(e.target.value)}
                        placeholder="A001234567X"
                        className="w-full text-xs px-2 py-1 border rounded bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Contract Type</label>
                      <select
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                        <option value="Consultant">Consultant</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Joined & Location */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Date Joined *</label>
                      <input
                        type="date"
                        value={dateJoined}
                        onChange={(e) => setDateJoined(e.target.value)}
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Location</label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Nairobi Office"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Bank Name</label>
                      <input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Equity Bank"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Bank Account</label>
                      <input
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="0123456789"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                  </div>

                  {/* Statutory Nos & Salary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">NSSF No</label>
                      <input
                        value={nssfNo}
                        onChange={(e) => setNssfNo(e.target.value)}
                        placeholder="NSSF..."
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">NHIF / SHIF No</label>
                      <input
                        value={nhifNo}
                        onChange={(e) => setNhifNo(e.target.value)}
                        placeholder="NHIF..."
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600">Salary</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="50000"
                        className="w-full text-xs px-2 py-1 border rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <Lock size={12} className={isLocked ? 'text-rose-500' : 'text-gray-400'} />
                  <span>Lock Folder</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || 
                (!isEmployeeMode && !name.trim()) || 
                (isEmployeeMode && (!firstName.trim() || !lastName.trim()))
              }
              className="px-3.5 py-1.5 rounded text-white flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}