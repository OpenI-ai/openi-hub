import { CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';

export const ENRICH_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-accent-100 text-accent-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  error: { label: 'Error', color: 'bg-gray-100 text-gray-600' },
};

export const JOB_STATUS = {
  completed: { label: 'Completed', color: 'bg-accent-50 text-accent-600', icon: CheckCircle2 },
  running: { label: 'Running', color: 'bg-blue-50 text-blue-600', icon: Activity },
  queued: { label: 'Queued', color: 'bg-gray-50 text-gray-500', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-600', icon: XCircle },
};
