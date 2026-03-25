import { useDashboardDataContext } from '@/context/DashboardDataContext';
import { toUserProfile } from '@/lib/academia-ui';

export function useUser() {
  const { userInfo, loading, error } = useDashboardDataContext();

  return {
    user: userInfo,
    profile: userInfo ? toUserProfile(userInfo) : null,
    loading,
    error,
  };
}
