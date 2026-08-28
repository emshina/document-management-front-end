// 'use client';
// import { useState, useEffect } from 'react';
// import { Upload, FileText, CheckCircle2, ChevronLeft, ChevronRight, User, X, Eye } from 'lucide-react';
// import { apiCall } from '@/lib/api';

// interface RequestItem {
//   id: string | number;
//   document_title_requested: string;
//   required: boolean;
//   type?: string;
//   is_uploaded?: boolean;
//   file_url?: string;
// }

// interface DocumentRequestData {
//   id: string | number;
//   subject: string;
//   message: string;
//   recipient_name: string;
//   recipient_email: string;
//   sender_email?: string;
//   completed: boolean;
//   items: RequestItem[];
// }

// interface PublicUploadPortalProps {
//   token: string;
// }

// export default function PublicUploadPortal({ token }: PublicUploadPortalProps) {
//   const [requestData, setRequestData] = useState<DocumentRequestData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
  
//   // Staged local files before final submission: { [itemId]: File }
//   const [stagedFiles, setStagedFiles] = useState<{ [key: string | number]: File }>({});
//   // Local preview URLs generated for staged files: { [itemId]: string }
//   const [stagedPreviews, setStagedPreviews] = useState<{ [key: string | number]: string }>({});

//   const [submittingFinal, setSubmittingFinal] = useState(false);
//   const [isCompleted, setIsCompleted] = useState(false);

//   useEffect(() => {
//     const fetchPortalData = async () => {
//       try {
//         const data = await apiCall(`/v1/document-requests/public/${token}/`, { requiresAuth: false });
//         setRequestData(data);
//         setIsCompleted(data?.completed || false);
//       } catch (error) {
//         console.error('Failed to load document request portal:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (token) {
//       fetchPortalData();
//     }
//   }, [token]);

//   // Handle local file attachment & preview generation
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0] && requestData) {
//       const file = e.target.files[0];
//       const currentItem = requestData.items[currentIndex];
//       const itemId = currentItem.id;

//       // Revoke previous object URL if replacing to avoid memory leaks
//       if (stagedPreviews[itemId]) {
//         URL.revokeObjectURL(stagedPreviews[itemId]);
//       }

//       const previewUrl = URL.createObjectURL(file);

//       setStagedFiles((prev) => ({ ...prev, [itemId]: file }));
//       setStagedPreviews((prev) => ({ ...prev, [itemId]: previewUrl }));
//     }
//   };

//   // Remove staged file attachment
//   const handleRemoveStagedFile = (itemId: string | number) => {
//     if (stagedPreviews[itemId]) {
//       URL.revokeObjectURL(stagedPreviews[itemId]);
//     }
//     setStagedFiles((prev) => {
//       const copy = { ...prev };
//       delete copy[itemId];
//       return copy;
//     });
//     setStagedPreviews((prev) => {
//       const copy = { ...prev };
//       delete copy[itemId];
//       return copy;
//     });
//   };

//   // Final submission: Upload all staged files one-by-one, then trigger submit endpoint
//   const handleFinishRequest = async () => {
//     if (!requestData) return;

//     // Check if required items are missing files or already uploaded
//     for (const item of requestData.items) {
//       const hasUploaded = item.is_uploaded;
//       const hasStaged = Boolean(stagedFiles[item.id]);
//       if (item.required && !hasUploaded && !hasStaged) {
//         alert(`Please attach a file for the required document: "${item.document_title_requested}"`);
//         return;
//       }
//     }

//     setSubmittingFinal(true);
//     try {
//       // 1. Upload all staged local files sequentially
//       for (const [itemId, fileObj] of Object.entries(stagedFiles)) {
//         const formData = new FormData();
//         formData.append('file', fileObj);
//         formData.append('item_id', String(itemId));

//         await apiCall(`/v1/document-requests/public/${token}/upload/`, {
//           requiresAuth: false,
//           method: 'POST',
//           body: formData,
//         });
//       }

//       // 2. Finalize the request status
//       await apiCall(`/v1/document-requests/public/${token}/submit/`, {
//         requiresAuth: false,
//         method: 'POST',
//       });

//       setIsCompleted(true);
//     } catch (error) {
//       console.error('Final submission failed:', error);
//       alert('Failed to upload files and finalize submission. Please try again.');
//     } finally {
//       setSubmittingFinal(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
//         Loading document portal...
//       </div>
//     );
//   }

//   if (!requestData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 text-sm">
//         Invalid or expired request link.
//       </div>
//     );
//   }

//   if (isCompleted) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
//           <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
//             <CheckCircle2 size={28} />
//           </div>
//           <h2 className="text-xl font-bold text-gray-900">Submission Complete!</h2>
//           <p className="text-sm text-gray-600">
//             Thank you. All your requested onboarding documents have been successfully submitted to the admin team.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const activeItem = requestData.items[currentIndex];
//   const activeStagedFile = stagedFiles[activeItem?.id];
//   const activePreviewUrl = stagedPreviews[activeItem?.id] || activeItem?.file_url;

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
//       {/* Top Sender Bar */}
//       <div className="max-w-7xl mx-auto w-full mb-4 flex items-center justify-between text-xs text-gray-600">
//         <div className="flex items-center gap-1.5 font-medium text-[#7C3AED]">
//           <User size={14} /> {requestData.sender_email || 'ict@cdl.africa'}
//         </div>
//       </div>

//       {/* Main Split Layout Container */}
//       <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        
//         {/* Left Pane: Email details & Upload Dropzone with Preview */}
//         <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
//           <div className="space-y-4">
//             <h1 className="text-xl font-bold text-[#7C3AED]">{requestData.subject}</h1>
//             <div className="text-sm text-gray-700 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line">
//               <p>Dear {requestData.recipient_name},</p>
//               <p>{requestData.message}</p>
//               <p className="pt-2">Regards,<br />Admin Team</p>
//             </div>
//           </div>

//           {/* Active Upload Dropzone Box */}
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <h3 className="text-sm font-semibold text-gray-800">Requested Documents:</h3>
//               <span className="text-xs text-gray-500">Document {currentIndex + 1} of {requestData.items.length}</span>
//             </div>

//             <div className="border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[260px] relative">
//               <span className="absolute top-4 text-sm font-semibold text-purple-900">
//                 {activeItem?.document_title_requested} {activeItem?.required && <span className="text-red-500">*</span>}
//               </span>

//               {activeItem?.is_uploaded || activeStagedFile ? (
//                 <div className="space-y-3 flex flex-col items-center mt-6 w-full max-w-xs">
//                   <div className="p-3 bg-green-100 text-green-600 rounded-full">
//                     <CheckCircle2 size={24} />
//                   </div>
//                   <p className="text-xs text-green-700 font-medium truncate w-full">
//                     {activeStagedFile ? activeStagedFile.name : 'Attached & Ready for Submission'}
//                   </p>

//                   <div className="flex items-center gap-2 w-full justify-center">
//                     {activePreviewUrl && (
//                       <a
//                         href={activePreviewUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs"
//                       >
//                         <Eye size={13} /> Preview
//                       </a>
//                     )}
//                     {!activeItem?.is_uploaded && (
//                       <button
//                         onClick={() => handleRemoveStagedFile(activeItem.id)}
//                         className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 transition"
//                       >
//                         <X size={13} /> Remove
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <label className="cursor-pointer flex flex-col items-center space-y-3 mt-6">
//                   <div className="p-3 bg-white text-[#7C3AED] rounded-full shadow-sm">
//                     <Upload size={28} />
//                   </div>
//                   <span className="text-xs text-gray-500">
//                     Click here or drag file to attach
//                   </span>
//                   <input type="file" className="hidden" onChange={handleFileChange} />
//                 </label>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right Sidebar Checklist Pane */}
//         <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 flex flex-col justify-between">
//           <div>
//             <h3 className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-3 mb-3 flex items-center gap-2">
//               <FileText size={16} className="text-[#7C3AED]" /> Checklist ({requestData.items.length})
//             </h3>

//             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
//               {requestData.items.map((item, idx) => {
//                 const isStaged = Boolean(stagedFiles[item.id]);
//                 const isDone = item.is_uploaded || isStaged;

//                 return (
//                   <div
//                     key={item.id}
//                     onClick={() => setCurrentIndex(idx)}
//                     className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
//                       currentIndex === idx
//                         ? 'bg-purple-50 border-[#7C3AED] text-purple-900 shadow-xs'
//                         : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
//                     }`}
//                   >
//                     <div>
//                       <div className="text-xs font-semibold flex items-center gap-1.5">
//                         <Upload size={12} className={currentIndex === idx ? 'text-[#7C3AED]' : 'text-gray-400'} />
//                         {item.document_title_requested}
//                       </div>
//                       {item.required && (
//                         <span className="text-[10px] text-purple-600 font-medium mt-0.5 block italic">Required</span>
//                       )}
//                     </div>
//                     {isDone && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* Bottom Action Footer Control Bar */}
//       <div className="max-w-7xl mx-auto w-full mt-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={handleFinishRequest}
//             disabled={submittingFinal}
//             className="px-5 py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
//           >
//             {submittingFinal ? 'Uploading & Submitting...' : 'Finish Request'}
//           </button>
//         </div>

//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
//             disabled={currentIndex === 0}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1"
//           >
//             <ChevronLeft size={14} /> Back
//           </button>
//           <button
//             onClick={() => setCurrentIndex((prev) => Math.min(requestData.items.length - 1, prev + 1))}
//             disabled={currentIndex === requestData.items.length - 1}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1"
//           >
//             Next Document <ChevronRight size={14} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



'use client';
import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, ChevronLeft, ChevronRight, User, X, Eye, AlertCircle } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface RequestItem {
  id: string | number;
  document_title_requested: string;
  required: boolean;
  type?: string;
  is_uploaded?: boolean;
  file_url?: string;
  status?: string; // Added status field ('pending', 'approved', 'rejected', etc.)
}

interface DocumentRequestData {
  id: string | number;
  subject: string;
  message: string;
  recipient_name: string;
  recipient_email: string;
  sender_email?: string;
  completed: boolean;
  items: RequestItem[];
}

interface PublicUploadPortalProps {
  token: string;
}

export default function PublicUploadPortal({ token }: PublicUploadPortalProps) {
  const [requestData, setRequestData] = useState<DocumentRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [stagedFiles, setStagedFiles] = useState<{ [key: string | number]: File }>({});
  const [stagedPreviews, setStagedPreviews] = useState<{ [key: string | number]: string }>({});

  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const data = await apiCall(`/v1/document-requests/public/${token}/`, { requiresAuth: false });
        setRequestData(data);
        // If the backend returns completed: false because of rejections, this will force it out of the success view
        setIsCompleted(data?.completed || false);
      } catch (error) {
        console.error('Failed to load document request portal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchPortalData();
    }
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && requestData) {
      const file = e.target.files[0];
      const currentItem = requestData.items[currentIndex];
      const itemId = currentItem.id;

      if (stagedPreviews[itemId]) {
        URL.revokeObjectURL(stagedPreviews[itemId]);
      }

      const previewUrl = URL.createObjectURL(file);

      setStagedFiles((prev) => ({ ...prev, [itemId]: file }));
      setStagedPreviews((prev) => ({ ...prev, [itemId]: previewUrl }));
    }
  };

  const handleRemoveStagedFile = (itemId: string | number) => {
    if (stagedPreviews[itemId]) {
      URL.revokeObjectURL(stagedPreviews[itemId]);
    }
    setStagedFiles((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
    setStagedPreviews((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleFinishRequest = async () => {
    if (!requestData) return;

    for (const item of requestData.items) {
      const hasUploaded = item.is_uploaded && item.status !== 'rejected';
      const hasStaged = Boolean(stagedFiles[item.id]);
      if (item.required && !hasUploaded && !hasStaged) {
        alert(`Please attach a file for the required document: "${item.document_title_requested}"`);
        return;
      }
    }

    setSubmittingFinal(true);
    try {
      for (const [itemId, fileObj] of Object.entries(stagedFiles)) {
        const formData = new FormData();
        formData.append('file', fileObj);
        formData.append('item_id', String(itemId));

        await apiCall(`/v1/document-requests/public/${token}/upload/`, {
          requiresAuth: false,
          method: 'POST',
          body: formData,
        });
      }

      await apiCall(`/v1/document-requests/public/${token}/submit/`, {
        requiresAuth: false,
        method: 'POST',
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Final submission failed:', error);
      alert('Failed to upload files and finalize submission. Please try again.');
    } finally {
      setSubmittingFinal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading document portal...
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 text-sm">
        Invalid or expired request link.
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Submission Complete!</h2>
          <p className="text-sm text-gray-600">
            Thank you. Your onboarding documents have been successfully updated and submitted to the admin team.
          </p>
        </div>
      </div>
    );
  }

  const activeItem = requestData.items[currentIndex];
  const activeStagedFile = stagedFiles[activeItem?.id];
  const activePreviewUrl = stagedPreviews[activeItem?.id] || activeItem?.file_url;
  const isRejected = activeItem?.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full mb-4 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1.5 font-medium text-[#7C3AED]">
          <User size={14} /> {requestData.sender_email || 'ict@cdl.africa'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        
        {/* Left Pane */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-[#7C3AED]">{requestData.subject}</h1>
            <div className="text-sm text-gray-700 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line">
              <p>Dear {requestData.recipient_name},</p>
              <p>{requestData.message}</p>
              <p className="pt-2">Regards,<br />Admin Team</p>
            </div>
          </div>

          {/* Active Upload Dropzone Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Requested Documents:</h3>
              <span className="text-xs text-gray-500">Document {currentIndex + 1} of {requestData.items.length}</span>
            </div>

            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[260px] relative ${
              isRejected ? 'border-red-300 bg-red-50/40' : 'border-purple-300 bg-purple-50/40'
            }`}>
              <div className="absolute top-4 flex flex-col items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {activeItem?.document_title_requested} {activeItem?.required && <span className="text-red-500">*</span>}
                </span>
                {isRejected && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-md">
                    <AlertCircle size={12} /> Previously Rejected - Re-upload Required
                  </span>
                )}
              </div>

              {(activeItem?.is_uploaded && !isRejected) || activeStagedFile ? (
                <div className="space-y-3 flex flex-col items-center mt-8 w-full max-w-xs">
                  <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs text-green-700 font-medium truncate w-full">
                    {activeStagedFile ? activeStagedFile.name : 'Attached & Ready for Submission'}
                  </p>

                  <div className="flex items-center gap-2 w-full justify-center">
                    {activePreviewUrl && (
                      <a
                        href={activePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs"
                      >
                        <Eye size={13} /> Preview
                      </a>
                    )}
                    {(activeStagedFile || (isRejected && activeItem?.is_uploaded)) && (
                      <button
                        onClick={() => handleRemoveStagedFile(activeItem.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 transition"
                      >
                        <X size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center space-y-3 mt-8">
                  <div className={`p-3 rounded-full shadow-sm ${isRejected ? 'bg-white text-red-600' : 'bg-white text-[#7C3AED]'}`}>
                    <Upload size={28} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {isRejected ? 'Click to upload a corrected version of this document' : 'Click here or drag file to attach'}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Checklist Pane */}
        <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-3 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#7C3AED]" /> Checklist ({requestData.items.length})
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {requestData.items.map((item, idx) => {
                const isStaged = Boolean(stagedFiles[item.id]);
                const isItemRejected = item.status === 'rejected';
                const isDone = (item.is_uploaded && !isItemRejected) || isStaged;

                return (
                  <div
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      currentIndex === idx
                        ? 'bg-purple-50 border-[#7C3AED] text-purple-900 shadow-xs'
                        : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <Upload size={12} className={currentIndex === idx ? 'text-[#7C3AED]' : 'text-gray-400'} />
                        {item.document_title_requested}
                      </div>
                      {isItemRejected ? (
                        <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Rejected</span>
                      ) : item.required ? (
                        <span className="text-[10px] text-purple-600 font-medium mt-0.5 block italic">Required</span>
                      ) : null}
                    </div>
                    {isDone ? (
                      <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                    ) : isItemRejected ? (
                      <AlertCircle size={14} className="text-red-600 shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Action Footer Control Bar */}
      <div className="max-w-7xl mx-auto w-full mt-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleFinishRequest}
            disabled={submittingFinal}
            className="px-5 py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
          >
            {submittingFinal ? 'Uploading & Submitting...' : 'Finish Request'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(requestData.items.length - 1, prev + 1))}
            disabled={currentIndex === requestData.items.length - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1"
          >
            Next Document <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}