import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequired, validationErrorResponse } from "@/lib/validation";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Parse a document using AI
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`ai:${userId}`, RATE_LIMITS.ai);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const { documentId } = body;

    // Input validation
    const validation = validateRequired(body, ["documentId"]);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    // Get the Convex user
    const convexUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (!convexUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Get the document
    const document = await convex.query(api.documents.get, {
      id: documentId,
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.userId !== convexUser._id) {
      return NextResponse.json(
        { error: "Unauthorized access to document" },
        { status: 403 }
      );
    }

    // Import AI functions
    const { parseDocument } = await import("@oryn/ai");

    // Parse the document
    const result = await parseDocument(document.url, document.mimeType);

    // Update document with parsed content
    await convex.mutation(api.documents.updateParsedContent, {
      id: documentId,
      parsedContent: result.content || "",
    });

    return NextResponse.json({
      success: true,
      parsedContent: result.content,
      extractedData: result.extractedData,
    });
  } catch (error) {
    console.error("Document parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse document" },
      { status: 500 }
    );
  }
}
