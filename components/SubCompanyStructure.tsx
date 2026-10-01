'use client';
import { useState, useEffect, useMemo, useRef, MouseEvent } from 'react';
import { 
  Building2, Users, ChevronRight, Layers, Loader2, 
  Folder, FileText, Eye, Download, Trash2, AlertCircle, X, ExternalLink, Minus, Plus, Search, Pin, Edit, Check, Building 
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { fetchDepartments, Department } from '@/lib/departments';
import { fetchAllEmployees, Employee } from '@/lib/employees';
import { usePermissions } from '@/hooks/usePermissions';

interface SubCompany {
  id: string;
  name: string;
  type?: string;
  parent?: any;
}

interface SubCompanyStructureProps {
  themeColor: string;
}

export default function SubCompanyStructure({ themeColor: initialThemeColor }: SubCompanyStructureProps) {
  const { hasPermission } = usePermissions();
  
  const [subCompanies, setSubCompanies] = useState<SubCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<SubCompany | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);

  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Preview states with secure blob handling
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const [themeColor, setThemeColor] = useState<string>(initialThemeColor || '#4C1D95');

  const canDeleteDocuments = hasPermission('delete_document') || true;

  // Database Color Code resolution
  useEffect(() => {
    let color = initialThemeColor;
    if (!color) {
      const storedColor = typeof window !== 'undefined' ? localStorage.getItem('tenant_primary_color') : null;
      if (storedColor) {
        color = storedColor;
      } else {
        apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
          .then((data) => {
            if (!data) return;
            const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
            if (tenantObj?.effective_primary_color) {
              setThemeColor(tenantObj.effective_primary_color);
              localStorage.setItem('tenant_primary_color', tenantObj.effective_primary_color);
            }
          })
          .catch(() => {});
      }
    }
    if (color) {
      setThemeColor(color);
    }
  }, [initialThemeColor]);

  useEffect(() => {
    const fetchStructureData = async () => {
      try {
        setLoading(true);
        const [tenantNodesData, deptData, empData] = await Promise.all([
          apiCall('/v1/tenants/tenants/', { requiresAuth: true }).catch(() => null),
          fetchDepartments().catch(() => []),
          fetchAllEmployees().catch(() => [])
        ]);

        const tenantsArray = Array.isArray(tenantNodesData) ? tenantNodesData : tenantNodesData?.results || [];
        const subTenants = tenantsArray.filter((t: any) => t.type === 'sub_company' || (t.parent && t.parent !== t.id));
        const effectiveSubComps = subTenants.length > 0 ? subTenants : tenantsArray;

        setSubCompanies(effectiveSubComps);
        setAllDepartments(Array.isArray(deptData) ? deptData : deptData?.results || []);
        setAllEmployees(Array.isArray(empData) ? empData : empData?.results || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load enterprise structure.');
      } finally {
        setLoading(false);
      }
    };
    fetchStructureData();
  }, []);

  // Filtered lists for Global Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();

    const matchedCompanies = subCompanies.filter(c => c.name.toLowerCase().includes(query));
    const matchedDepartments = allDepartments.filter(d => d.name.toLowerCase().includes(query));
    const matchedEmployees = allEmployees.filter(e => {
      const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
      const email = String(e.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });

    return {
      companies: matchedCompanies,
      departments: matchedDepartments,
      employees: matchedEmployees
    };
  }, [searchQuery, subCompanies, allDepartments, allEmployees]);

  const handleSelectCompany = (company: SubCompany) => {
    setSelectedCompany(company);
    setSelectedDepartment(null);
    setSelectedEmployee(null);
    setSelectedFolder(null);
    setPreviewDoc(null);
    setPreviewUrl(null);
    setSearchQuery('');

    const tenantIdStr = String(company.id);
    const filteredDepts = allDepartments.filter((d: any) => {
      const dTenant = String(d.tenant_id ?? d.tenant?.id ?? d.tenant ?? '');
      return dTenant === tenantIdStr;
    });
    setDepartments(filteredDepts.length > 0 ? filteredDepts : allDepartments);
  };

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    setSelectedEmployee(null);
    setSelectedFolder(null);
    setPreviewDoc(null);
    setPreviewUrl(null);
    setSearchQuery('');

    const filteredEmps = allEmployees.filter((emp: any) => {
      const eDeptId = String(emp.department_id ?? emp.department?.id ?? emp.department ?? '');
      const eDeptName = String(emp.department_name ?? '').toLowerCase();
      return eDeptId === String(dept.id) || eDeptName === dept.name.toLowerCase();
    });
    setEmployees(filteredEmps);
  };

  const handleSelectEmployee = async (emp: any) => {
    setSelectedEmployee(emp);
    setDetailLoading(true);
    setSelectedFolder(null);
    setPreviewDoc(null);
    setPreviewUrl(null);
    setSearchQuery('');

    // If selected from global search, automatically scope its company and department context if available
    const empDeptId = String(emp.department_id ?? emp.department?.id ?? emp.department ?? '');
    const matchedDept = allDepartments.find(d => String(d.id) === empDeptId);
    if (matchedDept) {
      setSelectedDepartment(matchedDept);
      const dTenantStr = String(matchedDept.tenant_id ?? matchedDept.tenant?.id ?? matchedDept.tenant ?? '');
      const matchedComp = subCompanies.find(c => String(c.id) === dTenantStr);
      if (matchedComp) setSelectedCompany(matchedComp);
    }

    try {
      const detailedEmp = await apiCall(`/v1/hr/employees/${emp.id}/`, { requiresAuth: true });
      setSelectedEmployee(detailedEmp);
      if (detailedEmp?.folders && detailedEmp.folders.length > 0) {
        setSelectedFolder(detailedEmp.folders[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch employee document folders', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Robust URL resolver supporting root-level backend media storage
  const resolveFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const rootHost = apiBase.replace(/\/api\/?$/, ''); // strips '/api' from base URL
    return `${rootHost.replace(/\/$/, '')}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  };

  const handlePreview = async (doc: any) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const docData = await apiCall(`/v1/documents/${doc.id}/`, { method: 'GET', requiresAuth: true }).catch(() => doc);
      const rawFileUrl = docData?.current_version?.file || docData?.file || doc?.current_version?.file || doc?.file || '';
      if (!rawFileUrl) throw new Error('No valid file source found.');

      const targetUrl = resolveFileUrl(rawFileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('access') || localStorage.getItem('token')) : null;
      
      const res = await fetch(targetUrl, { 
        headers: token ? { 'Authorization': `Bearer ${token.trim()}` } : {} 
      });
      
      if (!res.ok) throw new Error('Failed to load preview stream');

      const blob = await res.blob();
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch (err: any) {
      console.error('Preview error:', err);
      const fallbackUrl = resolveFileUrl(doc?.current_version?.file || doc?.file || '');
      setPreviewUrl(fallbackUrl);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const docData = await apiCall(`/v1/documents/${doc.id}/`, { method: 'GET', requiresAuth: true }).catch(() => doc);
      const rawFileUrl = docData?.current_version?.file || docData?.file || doc?.current_version?.file || doc?.file || '';
      if (!rawFileUrl) throw new Error('Download URL not found.');

      const targetUrl = resolveFileUrl(rawFileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('access') || localStorage.getItem('token')) : null;
      
      const res = await fetch(targetUrl, { 
        headers: token ? { 'Authorization': `Bearer ${token.trim()}` } : {} 
      });
      
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Download failed.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!canDeleteDocuments) {
      alert('You do not have permission to delete documents.');
      return;
    }
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setActionLoading(docId);
      await apiCall(`/v1/documents/${docId}/`, { method: 'DELETE', requiresAuth: true });
      
      if (previewDoc?.id === docId) {
        setPreviewDoc(null);
        setPreviewUrl(null);
      }

      if (selectedEmployee?.id) {
        const updatedEmp = await apiCall(`/v1/hr/employees/${selectedEmployee.id}/`, { requiresAuth: true });
        setSelectedEmployee(updatedEmp);
        if (selectedFolder) {
          const updatedCurrentFolder = updatedEmp.folders?.find((f: any) => f.id === selectedFolder.id);
          setSelectedFolder(updatedCurrentFolder || updatedEmp.folders?.[0] || null);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-100 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full gap-2 text-xs text-gray-500">
          <Loader2 size={20} className="animate-spin" style={{ color: themeColor }} /> Loading corporate records...
        </div>
      ) : error ? (
        <div className="p-4 m-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMN 1: ORGANIZATION STRUCTURE & GLOBAL SEARCH */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Organization Structure</span>
              <div className="mt-2 relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company, dept, employee..." 
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2 space-y-1 text-xs">
              {/* GLOBAL SEARCH RESULTS VIEW */}
              {searchResults ? (
                <div className="space-y-3">
                  <div className="px-2 py-1 font-bold text-gray-500 text-[10px] uppercase">
                    Search Results ({searchResults.companies.length + searchResults.departments.length + searchResults.employees.length})
                  </div>

                  {/* Companies matches */}
                  {searchResults.companies.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-2 text-[10px] font-semibold text-purple-600">Sub-Companies</div>
                      {searchResults.companies.map(comp => (
                        <div
                          key={comp.id}
                          onClick={() => handleSelectCompany(comp)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer text-gray-800 font-medium"
                        >
                          <Building2 size={14} style={{ color: themeColor }} />
                          <span className="truncate">{comp.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Departments matches */}
                  {searchResults.departments.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-2 text-[10px] font-semibold text-purple-600">Departments</div>
                      {searchResults.departments.map(dept => (
                        <div
                          key={dept.id}
                          onClick={() => {
                            setSelectedDepartment(dept);
                            const dTenantStr = String(dept.tenant_id ?? dept.tenant?.id ?? dept.tenant ?? '');
                            const comp = subCompanies.find(c => String(c.id) === dTenantStr);
                            if (comp) setSelectedCompany(comp);
                            const filteredEmps = allEmployees.filter((emp: any) => {
                              const eDeptId = String(emp.department_id ?? emp.department?.id ?? emp.department ?? '');
                              return eDeptId === String(dept.id);
                            });
                            setEmployees(filteredEmps);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer text-gray-800 font-medium"
                        >
                          <Layers size={14} style={{ color: themeColor }} />
                          <span className="truncate">{dept.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Employees matches */}
                  {searchResults.employees.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-2 text-[10px] font-semibold text-purple-600">Employees</div>
                      {searchResults.employees.map(emp => {
                        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                        return (
                          <div
                            key={emp.id}
                            onClick={() => handleSelectEmployee(emp)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer text-gray-800 font-medium"
                          >
                            <Users size={14} className="text-purple-600" />
                            <span className="truncate">{fullName || 'Unnamed Employee'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {searchResults.companies.length === 0 && searchResults.departments.length === 0 && searchResults.employees.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      No matching records found.
                    </div>
                  )}
                </div>
              ) : !selectedCompany ? (
                /* DEFAULT TREE BROWSER */
                <div className="space-y-1">
                  <div className="px-2 py-1.5 font-bold text-gray-500 text-[10px] uppercase">Sub-Companies</div>
                  {subCompanies.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => handleSelectCompany(comp)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition text-gray-800 font-medium"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 size={15} style={{ color: themeColor }} />
                        <span className="truncate">{comp.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : !selectedDepartment ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="font-bold text-gray-500 text-[10px] uppercase">Departments in {selectedCompany.name}</span>
                    <button onClick={() => setSelectedCompany(null)} className="text-[11px] text-purple-600 hover:underline">Change</button>
                  </div>
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => handleSelectDepartment(dept)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition text-gray-800 font-medium"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers size={15} style={{ color: themeColor }} />
                        <span className="truncate">{dept.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : !selectedEmployee ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="font-bold text-gray-500 text-[10px] uppercase">Employees in {selectedDepartment.name}</span>
                    <button onClick={() => setSelectedDepartment(null)} className="text-[11px] text-purple-600 hover:underline">Change</button>
                  </div>
                  {employees.map((emp) => {
                    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition text-gray-800 font-medium"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Users size={15} className="text-purple-600" />
                          <span className="truncate">{fullName || 'Unnamed Employee'}</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="font-bold text-gray-500 text-[10px] uppercase">Employee Folders</span>
                    <button onClick={() => setSelectedEmployee(null)} className="text-[11px] text-purple-600 hover:underline">Back to Employees</button>
                  </div>
                  <div className="px-3 py-2 bg-purple-50 rounded-lg text-purple-900 font-bold mb-2">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </div>
                  {selectedEmployee.folders?.map((folder: any) => {
                    const isSelected = selectedFolder?.id === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${isSelected ? 'bg-purple-600 text-white font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder size={15} className={isSelected ? 'text-white' : 'text-amber-500'} />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                          {folder.documents?.length || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: MIDDLE FOLDER & FILE LIST */}
          <div className={`flex-1 bg-white border-r border-gray-200 flex flex-col overflow-y-auto ${previewDoc ? 'w-auto' : 'w-full'}`}>
            {detailLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-xs text-gray-500">
                <Loader2 size={20} className="animate-spin" style={{ color: themeColor }} /> Loading employee cabinets...
              </div>
            ) : selectedEmployee && selectedFolder ? (
              <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Folder size={18} className="text-amber-500" /> {selectedFolder.name}
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Employee: {selectedEmployee.first_name} {selectedEmployee.last_name} • {selectedFolder.path || 'Cabinet Directory'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase px-2 mb-2">Documents ({selectedFolder.documents?.length || 0})</div>
                  {selectedFolder.documents?.length > 0 ? (
                    selectedFolder.documents.map((doc: any) => {
                      const isSelectedPreview = previewDoc?.id === doc.id;
                      return (
                        <div 
                          key={doc.id} 
                          className={`flex items-center justify-between p-3 rounded-xl border transition text-xs ${isSelectedPreview ? 'bg-purple-50/70 border-purple-300 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <FileText size={18} className="text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{doc.name}</p>
                              <p className="text-[10px] text-gray-500">Ref: {doc.reference_no || 'N/A'} • Status: <span className="font-semibold text-purple-700">{doc.status || 'Draft'}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {doc.file_type || 'PDF'}
                            </span>

                            <button
                              onClick={() => handlePreview(doc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${isSelectedPreview ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'}`}
                            >
                              <Eye size={13} /> Preview
                            </button>

                            <button
                              onClick={() => handleDownload(doc)}
                              title="Download"
                              className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Download size={15} />
                            </button>

                            {canDeleteDocuments && (
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={actionLoading === doc.id}
                                title="Delete"
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                {actionLoading === doc.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-400 text-xs bg-white border border-gray-200 rounded-xl">
                      No documents found in this folder.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <Folder size={40} className="mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-600">Select an employee and folder from the Organization Structure</p>
                <p className="text-[11px] text-gray-400 mt-1">Browse sub-companies, departments, and staff records easily.</p>
              </div>
            )}
          </div>

          {/* COLUMN 3: RIGHT-SIDE DOCUMENT VIEWER PANE */}
          {previewDoc && (
            <div className="w-[45%] bg-white border-l border-gray-200 flex flex-col shadow-lg shrink-0">
              <div className="px-4 py-3 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText size={16} className="text-purple-400 shrink-0" />
                  <span className="text-xs font-bold truncate">{previewDoc.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg transition"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-300 px-4 py-1.5 flex items-center justify-between text-xs border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <button className="hover:text-white"><Minus size={14} /></button>
                  <span className="text-[11px] font-mono bg-gray-800 px-2 py-0.5 rounded">100%</span>
                  <button className="hover:text-white"><Plus size={14} /></button>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span>Page</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded text-white">1</span>
                  <span>of 1</span>
                </div>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Open <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div className="flex-1 bg-gray-200 relative flex items-center justify-center overflow-auto p-4">
                {previewLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Loader2 size={16} className="animate-spin text-purple-600" /> Loading secure preview...
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.name}
                    className="w-full h-full rounded shadow-md border border-gray-300 bg-white"
                  />
                ) : (
                  <div className="text-center text-gray-500 text-xs">
                    Preview file stream is unavailable.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}