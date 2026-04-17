import React, { Suspense } from 'react';
import { getFacultyDetails } from '@/lib/server/rmf';
import FacultyDetailClient from './FacultyDetailClient';
import FacultyDetailLoading from './loading';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function FacultyDetails({ facultyId }: { facultyId: string }) {
  const data = await getFacultyDetails(facultyId);

  if (!data) {
    notFound();
  }

  return (
    <FacultyDetailClient 
      faculty={data.faculty as any} 
      reviews={data.reviews as any} 
    />
  );
}

export default async function FacultyDetailPage({
  params,
}: {
  params: Promise<{ facultyId: string }>;
}) {
  const { facultyId } = await params;

  return (
    <Suspense fallback={<FacultyDetailLoading />}>
      <FacultyDetails facultyId={facultyId} />
    </Suspense>
  );
}
