// app/forms/fill/submit/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api'; // Or use getApiUrl if you prefer standard fetch

export default function SubmissionSuccessPage() {
  const params = useParams();
  const id = params?.id;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    // Using your pre-existing apiCall helper safely handles base URLs, auth tokens, etc.
    apiCall(`/v1/esignature/form-submissions/${id}/`)
      .then((data) => {
        setSubmission(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-10 text-white text-center bg-gray-950 min-h-screen">Loading submission details...</div>;
  if (error) return <div className="p-10 text-red-500 text-center bg-gray-950 min-h-screen">Error: {error}</div>;

  return (
    <div className="w-full min-h-screen bg-gray-950 text-white flex flex-col items-center p-6 md:p-12">
      <div className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-2xl font-bold mb-2">
            ✓
          </div>
          <h1 className="text-2xl font-bold">Form Submitted Successfully</h1>
          <p className="text-xs text-gray-400">Your response has been securely recorded and processed.</p>
          <span className="text-[10px] bg-gray-800 text-purple-400 px-3 py-1 rounded-full font-mono mt-1">
            Submission ID: {id}
          </span>
        </div>

        {submission && submission.field_values && (
          <div className="flex flex-col gap-3 mt-4">
            <h2 className="text-sm font-semibold text-gray-300 border-b border-gray-800 pb-2">Submitted Responses</h2>
            <div className="flex flex-col gap-2 max-h-96 overflow-auto pr-2">
              {submission.field_values.map((item, idx) => (
                <div key={idx} className="bg-gray-950/60 border border-gray-800/80 p-3 rounded-lg flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 font-medium">{item.form_field_label || `Field ${idx + 1}`}</span>
                  <span className="text-xs text-white font-semibold break-all">
                    {typeof item.value === 'boolean' ? (item.value ? 'Yes / Checked' : 'No / Unchecked') : (item.value || 'N/A')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center pt-4 border-t border-gray-800">
          <Link
            href="/"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition duration-200 shadow"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}