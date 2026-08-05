'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ConfirmationProvider } from '@/components/ui/confirmation-dialog';
import { useSettingsStore } from '@/stores/settings.store';
import { useOrphanCleanup } from '@/hooks/use-orphan-cleanup';
import { useAuthStore } from '@/stores/auth.store';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { createDefaultUserPermissions, mapApiRoleToAppRole, normalizeUserPermissions } from '@/lib/user-permissions';
import { toast } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const profileSyncWarningShownRef = useRef(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const { currentUser, users, setCurrentUser, addUser, updateUser } = useSettingsStore();
  const { isAuthenticated, user: authUser } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const syncCurrentUser = async () => {
      if (!isAuthenticated || !authUser?.id) {
        if (useSettingsStore.getState().currentUser) {
          setCurrentUser(null);
        }
        return;
      }

      try {
        const profile = await usersService.getProfile();
        if (cancelled) return;

        const role = mapApiRoleToAppRole(profile.role);
        const storedUsers = useSettingsStore.getState().users;
        const stored = storedUsers.find((u) => u.id === profile.id);

        const nextCurrentUser = {
          id: profile.id,
          code: profile.code,
          name: profile.name,
          email: profile.email,
          role,
          pin: stored?.pin,
          permissions: normalizeUserPermissions(role, stored?.permissions || createDefaultUserPermissions(role)),
          active: profile.active,
          createdAt: profile.createdAt,
        };

        setCurrentUser(nextCurrentUser);

        if (!stored) {
          addUser(nextCurrentUser);
        } else {
          updateUser(profile.id, {
            code: profile.code,
            name: profile.name,
            email: profile.email,
            role,
            active: profile.active,
            createdAt: profile.createdAt,
          });
        }
      } catch {
        if (!profileSyncWarningShownRef.current) {
          profileSyncWarningShownRef.current = true;
          toast.warning('Não foi possível sincronizar o perfil do usuário. Mantendo dados locais.');
        }
      }
    };

    syncCurrentUser();
    return () => {
      cancelled = true;
    };
  }, [addUser, authUser?.id, isAuthenticated, setCurrentUser, updateUser]);
  const masterPin = useMemo(() => {
    if (currentUser?.role === 'Master' && currentUser.pin) {
      return currentUser.pin;
    }

    return users.find((user) => user.role === 'Master' && user.pin)?.pin;
  }, [currentUser, users]);

  // Auto-cleanup de lançamentos de custo órfãos (paridade Figma)
  useOrphanCleanup();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmationProvider
        masterPin={masterPin}
        validateMasterPin={async (pin) => {
          const result = await authService.authorizeMasterPin(pin);
          return result.authorized === true;
        }}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </ConfirmationProvider>
    </QueryClientProvider>
  );
}
