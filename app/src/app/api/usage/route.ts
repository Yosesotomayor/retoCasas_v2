import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-db";
import { getUsageSummary } from "@/lib/usage-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userSubscription = (session.user as any).subscription;
    const subscriptionType = userSubscription?.type || 'FREE';

    // Get usage summary from database
    const usageSummary = await getUsageSummary(userId, subscriptionType);

    // Convert subscription type to tier format expected by the component
    const tierMap = {
      'FREE': 'free' as const,
      'BASIC': 'pro' as const,
      'PREMIUM': 'enterprise' as const,
    };

    return NextResponse.json({
      user: {
        id: userId,
        email: session.user.email || '',
        name: session.user.name || '',
        tier: tierMap[subscriptionType as keyof typeof tierMap],
        monthlyUsage: usageSummary.used,
        maxUsage: usageSummary.limit,
        remainingUsage: usageSummary.remaining,
        canMakeRequest: usageSummary.canUse,
      },
      recentUsage: [], // Empty for now, can be implemented later
      subscription: {
        type: subscriptionType,
        status: userSubscription?.status || "ACTIVE",
        currentPeriodEnd: userSubscription?.currentPeriodEnd,
      },
      usage: {
        limit: usageSummary.limit,
        used: usageSummary.used,
        remaining: usageSummary.remaining,
        resetDate: usageSummary.resetDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}