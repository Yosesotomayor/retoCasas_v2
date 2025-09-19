import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-db";
import { checkUsageLimit, incrementUsage } from "@/lib/usage-db";
import { savePrediction } from "@/lib/predictions-db";

interface PredictionRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  const APP_AI_SERVICE_URL = process.env.APP_AI_SERVICE_URL;

  if (!APP_AI_SERVICE_URL) {
    return NextResponse.json(
      { error: "APP_AI_SERVICE_URL is not defined in environment variables" },
      { status: 500 }
    );
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userSubscription = (session.user as any).subscription;
    const subscriptionType = userSubscription?.type || 'FREE';

    const { prompt }: PredictionRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Field 'prompt' is required" },
        { status: 400 }
      );
    }

    // Check usage limits
    const usageInfo = await checkUsageLimit(userId, subscriptionType);

    if (!usageInfo.canUse) {
      return NextResponse.json(
        {
          error: "Daily usage limit exceeded",
          usageInfo: {
            limit: usageInfo.limit,
            used: usageInfo.used,
            remaining: usageInfo.remaining,
            subscriptionType: usageInfo.subscriptionType,
            resetDate: usageInfo.resetDate.toISOString(),
          },
        },
        { status: 429 }
      );
    }

    // Make prediction request to AI service
    const response = await fetch(`${APP_AI_SERVICE_URL}/api/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`AI Service error! status: ${response.status}`);
    }

    const data = await response.json();

    // Save prediction to database if we have price and properties
    if (data.price && data.properties) {
      try {
        await savePrediction(userId, {
          price: data.price,
          properties: data.properties
        });
      } catch (error) {
        console.error('Failed to save prediction:', error);
        // Continue with the response even if saving fails
      }
    }

    // Increment usage counter (database)
    await incrementUsage(userId, subscriptionType);

    // Return response with updated usage info
    const updatedUsageInfo = await checkUsageLimit(userId, subscriptionType);

    return NextResponse.json({
      ...data,
      usageInfo: {
        limit: updatedUsageInfo.limit,
        used: updatedUsageInfo.used,
        remaining: updatedUsageInfo.remaining,
        subscriptionType: updatedUsageInfo.subscriptionType,
        resetDate: updatedUsageInfo.resetDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("LLM API error:", error);
    return NextResponse.json(
      { error: `Failed to fetch from ML Service: ${error}` },
      { status: 500 }
    );
  }
}