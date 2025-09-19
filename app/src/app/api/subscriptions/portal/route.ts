import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserById } from "@/lib/auth-db";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });
}

export async function POST(_request: NextRequest) {
  console.log("Portal request received");

  try {
    console.log("Getting server session");
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.error("No session or user found - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log("User ID from session:", userId);

    const user = await getUserById(userId);
    console.log("User data:", { id: user?.id, stripeCustomerId: user?.stripeCustomerId });

    if (!user || !user.stripeCustomerId) {
      console.error("No user or Stripe customer ID found");
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    // Create customer portal session
    console.log("Creating Stripe portal session for customer:", user.stripeCustomerId);
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.APP_BASE_URL}/subscription`,
    });

    console.log("Portal session created successfully:", portalSession.id);
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}