import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@oryn/ai";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channel, clientName, amount, currency, dueDate, title } = body;

    if (!channel || !clientName || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const formattedAmount = new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
    }).format(amount);

    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    let prompt = "";

    if (channel === "email") {
      prompt = `Write a professional but friendly payment reminder email.

Details:
- Client Name: ${clientName}
- Amount Due: ${formattedAmount}
- Claim/Invoice: ${title || "Outstanding Payment"}
${formattedDueDate ? `- Due Date: ${formattedDueDate}` : ""}

Requirements:
- Be professional yet warm and understanding
- Don't be aggressive or threatening
- Include a clear call to action
- Keep it concise (under 200 words)
- Don't include [brackets] or placeholders

Return JSON format:
{
  "subject": "Email subject line",
  "content": "Full email body"
}`;
    } else {
      // SMS or WhatsApp
      prompt = `Write a brief, friendly payment reminder ${channel === "whatsapp" ? "WhatsApp message" : "SMS"}.

Details:
- Client Name: ${clientName}
- Amount Due: ${formattedAmount}
${formattedDueDate ? `- Due Date: ${formattedDueDate}` : ""}

Requirements:
- Keep it under 160 characters for SMS, or under 300 for WhatsApp
- Be friendly and professional
- Include the amount
- Don't use [brackets] or placeholders

Return JSON format:
{
  "content": "Message text"
}`;
    }

    const result = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = result.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse JSON response
    let parsed: { subject?: string; content?: string } = {};
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        }
      }
    } catch {
      // If parsing fails, use the raw text as content
      parsed = { content: text };
    }

    return NextResponse.json({
      subject: parsed.subject || "",
      content: parsed.content || "",
    });
  } catch (error: any) {
    logger.error("Draft message error", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json(
      { error: error.message || "Failed to draft message" },
      { status: 500 }
    );
  }
}
