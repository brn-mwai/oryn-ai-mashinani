import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export { auth, currentUser, clerkClient };

export type UserRole = "user" | "admin" | "super_admin";

// Get the current user's role from session
export async function getUserRole(): Promise<UserRole> {
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: UserRole } | undefined;
  return metadata?.role ?? "user";
}

// Check if current user has required role
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const role = await getUserRole();

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
}

// Require authentication or redirect
export async function requireAuth(redirectTo?: string) {
  const { userId } = await auth();

  if (!userId) {
    redirect(redirectTo ?? "/sign-in");
  }

  return userId;
}

// Require admin role or redirect
export async function requireAdmin(redirectTo?: string) {
  const userId = await requireAuth();
  const isAdmin = await hasRole("admin");

  if (!isAdmin) {
    redirect(redirectTo ?? "/");
  }

  return userId;
}

// Require super admin role or redirect
export async function requireSuperAdmin(redirectTo?: string) {
  const userId = await requireAuth();
  const isSuperAdmin = await hasRole("super_admin");

  if (!isSuperAdmin) {
    redirect(redirectTo ?? "/");
  }

  return userId;
}

// Get current user with full profile
export async function getCurrentUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.emailAddresses[0]?.emailAddress,
    imageUrl: user.imageUrl,
    role: (user.publicMetadata?.role as UserRole) ?? "user",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Update user's public metadata (role, etc.)
export async function updateUserMetadata(
  userId: string,
  metadata: Partial<{ role: UserRole; [key: string]: unknown }>
) {
  const client = await clerkClient();

  return client.users.updateUser(userId, {
    publicMetadata: metadata,
  });
}

// Set user role (admin function)
export async function setUserRole(userId: string, role: UserRole) {
  return updateUserMetadata(userId, { role });
}

// Get a Convex-compatible auth token
export async function getConvexToken() {
  const { getToken } = await auth();
  return getToken({ template: "convex" });
}

// Get all users (admin function)
export async function getAllUsers(limit = 100, offset = 0) {
  const client = await clerkClient();

  return client.users.getUserList({
    limit,
    offset,
  });
}

// Search users by email (admin function)
export async function searchUsersByEmail(email: string) {
  const client = await clerkClient();

  return client.users.getUserList({
    emailAddress: [email],
  });
}

// Ban a user (admin function)
export async function banUser(userId: string) {
  const client = await clerkClient();

  return client.users.banUser(userId);
}

// Unban a user (admin function)
export async function unbanUser(userId: string) {
  const client = await clerkClient();

  return client.users.unbanUser(userId);
}

// Delete a user (super admin function)
export async function deleteUser(userId: string) {
  const client = await clerkClient();

  return client.users.deleteUser(userId);
}

// Get user's active sessions
export async function getUserSessions(userId: string) {
  const client = await clerkClient();

  return client.sessions.getSessionList({
    userId,
  });
}

// Revoke a session
export async function revokeSession(sessionId: string) {
  const client = await clerkClient();

  return client.sessions.revokeSession(sessionId);
}

// Revoke all user sessions
export async function revokeAllUserSessions(userId: string) {
  const sessions = await getUserSessions(userId);

  await Promise.all(
    sessions.data.map((session) => revokeSession(session.id))
  );
}
