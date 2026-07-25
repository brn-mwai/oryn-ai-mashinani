"use client";

import { useUser, useAuth as useClerkAuth, useSession } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

export { useUser, useSession };

// Extended useAuth hook with role checking
export function useAuth() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useClerkAuth();
  const { user } = useUser();
  const { session } = useSession();

  const role = useMemo(() => {
    return (user?.publicMetadata as { role?: string })?.role ?? "user";
  }, [user]);

  const isAdmin = useMemo(() => {
    return role === "admin" || role === "super_admin";
  }, [role]);

  const isSuperAdmin = useMemo(() => {
    return role === "super_admin";
  }, [role]);

  const getConvexToken = useCallback(async () => {
    return await getToken({ template: "convex" });
  }, [getToken]);

  return {
    isLoaded,
    isSignedIn,
    userId,
    sessionId,
    user,
    role,
    isAdmin,
    isSuperAdmin,
    getToken,
    getConvexToken,
  };
}

// Hook to check if user has specific permission
export function usePermission(requiredRole: "user" | "admin" | "super_admin") {
  const { role, isLoaded, isSignedIn } = useAuth();

  const hasPermission = useMemo(() => {
    if (!isSignedIn) return false;

    switch (requiredRole) {
      case "user":
        return true;
      case "admin":
        return role === "admin" || role === "super_admin";
      case "super_admin":
        return role === "super_admin";
      default:
        return false;
    }
  }, [role, isSignedIn, requiredRole]);

  return {
    hasPermission,
    isLoaded,
  };
}

// Hook to get user's full name
export function useUserName() {
  const { user, isLoaded } = useUser();

  const fullName = useMemo(() => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return user.emailAddresses[0]?.emailAddress ?? "";
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ?? "";
  }, [user]);

  return {
    fullName,
    initials,
    isLoaded,
  };
}
