import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { auth, currentUser } from "@clerk/nextjs/server";

// Initialize Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Import api type for function references (use server path to avoid React hooks)
import { api } from "@oryn/database/server";

// POST /api/sync-user - Create Convex user from current Clerk session
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get full user details from Clerk
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already exists in Convex
    const existingUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "User already exists",
        userId: existingUser._id,
      });
    }

    // Create user in Convex
    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    );

    const newUserId = await convex.mutation(api.users.create, {
      clerkId: userId,
      email: primaryEmail?.emailAddress ?? "",
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
    });

    return NextResponse.json({
      success: true,
      message: "User created",
      userId: newUserId,
    });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}

// GET /api/sync-user - Check if current user exists in Convex
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const existingUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    return NextResponse.json({
      exists: !!existingUser,
      userId: existingUser?._id ?? null,
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: "Failed to check user" },
      { status: 500 }
    );
  }
}
