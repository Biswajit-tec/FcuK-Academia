import React, { Suspense } from 'react';
import { getRmfFaculties } from '@/lib/server/rmf';
import FacultyListClient from './FacultyListClient';
import FacultyListLoading from './loading';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function FacultyList() {
  const data = await getRmfFaculties();
  return (
    <FacultyListClient 
      initialFaculties={data.faculties || []} 
      college={'college' in data ? data.college : null} 
    />
  );
}

export default function RateMyFacultyPage() {
  return (
    <Suspense fallback={<FacultyListLoading />}>
      <FacultyList />
    </Suspense>
  );
}
