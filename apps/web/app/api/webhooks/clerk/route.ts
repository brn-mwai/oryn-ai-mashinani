import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { verifyClerkWebhook, extractUserData } from "@oryn/auth";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  try {
    // Verify webhook signature
    const event = await verifyClerkWebhook(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });

    // Log webhook event for audit
    await convex.mutation(api.webhookEvents.create, {
      provider: "clerk",
      eventType: event.type,
      eventId: event.data.id ?? svixId,
      payload: event.data,
    });

    // Handle user.created event
    if (event.type === "user.created") {
      const userData = extractUserData(event);

      if (!userData.clerkId) {
        return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
      }

      // Check if user already exists (idempotency)
      const existingUser = await convex.query(api.users.getByClerkId, {
        clerkId: userData.clerkId,
      });

      if (!existingUser) {
        // Extract referral code from metadata if present
        const referredBy = (event.data.public_metadata?.referredBy as string) ||
                          (event.data.unsafe_metadata?.referredBy as string);

        await convex.mutation(api.users.create, {
          clerkId: userData.clerkId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
          referredBy,
        });
      }

      // Update webhook status to processed
      await convex.mutation(api.webhookEvents.updateStatusByEventId, {
        eventId: event.data.id ?? svixId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "user_created" });
    }

    // Handle user.updated event
    if (event.type === "user.updated") {
      const userData = extractUserData(event);

      if (!userData.clerkId) {
        return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
      }

      const existingUser = await convex.query(api.users.getByClerkId, {
        clerkId: userData.clerkId,
      });

      if (existingUser) {
        await convex.mutation(api.users.update, {
          id: existingUser._id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
        });
      }

      await convex.mutation(api.webhookEvents.updateStatusByEventId, {
        eventId: event.data.id ?? svixId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "user_updated" });
    }

    // Handle user.deleted event
    if (event.type === "user.deleted") {
      // Soft delete or mark as inactive - for now just log it
      await convex.mutation(api.webhookEvents.updateStatusByEventId, {
        eventId: event.data.id ?? svixId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "user_deleted_logged" });
    }

    // Unhandled event type - mark as ignored
    await convex.mutation(api.webhookEvents.updateStatusByEventId, {
      eventId: event.data.id ?? svixId,
      status: "ignored",
    });

    return NextResponse.json({ success: true, action: "ignored" });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
