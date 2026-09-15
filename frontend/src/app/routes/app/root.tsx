/**
 * Protected Routes Layout
 * Layout for routes that require login (currently only /generate)
 */

import { AuthGuard } from '@/features/auth';

export function ProtectedLayout() {
  return <AuthGuard />;
}
