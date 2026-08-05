'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { StudentEnrollmentPage } from '@/components/enrollment/student-enrollment-page';

export default function EnrollmentPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const enrollmentCode = params.code ?? '';
  const token = searchParams.get('token');

  return <StudentEnrollmentPage enrollmentCode={decodeURIComponent(enrollmentCode)} token={token} />;
}
