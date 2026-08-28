import { use } from 'react';
import PublicUploadPortal from '@/components/document-requests/PublicUploadPortal';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function FulfillPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <PublicUploadPortal token={resolvedParams.token} />;
}