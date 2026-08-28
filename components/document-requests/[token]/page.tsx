import PublicUploadPortal from '@/components/document-requests/PublicUploadPortal';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  return <PublicUploadPortal token={resolvedParams.token} />;
}