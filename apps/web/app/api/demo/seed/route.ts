import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get optional debtor email from request body
    const body = await request.json().catch(() => ({}));
    const debtorEmail = body.debtorEmail;

    // Run the seed mutation
    const result = await convex.mutation(api.seedDemo.seed, {
      userClerkId: userId,
      userEmail: user.emailAddresses[0]?.emailAddress || "",
      debtorEmail: debtorEmail || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Run the clear mutation
    const result = await convex.mutation(api.seedDemo.clearDemo, {
      userClerkId: userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear demo data", details: String(error) },
      { status: 500 }
    );
  }
}
