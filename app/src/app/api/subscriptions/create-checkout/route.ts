import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getUserById, updateUserStripeCustomerId } from "@/lib/auth-db";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });
}

export async function POST(request: NextRequest) {
  console.log("Create checkout request received");

  try {
    console.log("Getting server session");
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.error("No session or user found - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log("User ID from session:", userId);

    const { priceId, subscriptionType } = await request.json();
    console.log("Request data:", { priceId, subscriptionType });

    if (!priceId || !subscriptionType) {
      console.error("Missing required fields:", { priceId, subscriptionType });
      return NextResponse.json(
        { error: "Missing required fields: priceId, subscriptionType" },
        { status: 400 }
      );
    }

    // Validate Price ID format
    if (!priceId.startsWith('price_')) {
      console.error("Invalid Price ID format:", priceId);
      return NextResponse.json(
        {
          error: "Invalid Price ID format. Must start with 'price_'",
          received: priceId,
          hint: "Check your Stripe Dashboard for correct Price IDs"
        },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!["BASIC", "PREMIUM"].includes(subscriptionType)) {
      console.error("Invalid subscription type:", subscriptionType);
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 }
      );
    }

    // Get user from database
    console.log("Getting user from database");
    const user = await getUserById(userId);
    console.log("User data:", { id: user?.id, email: user?.email, stripeCustomerId: user?.stripeCustomerId });

    if (!user) {
      console.error("User not found for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create Stripe customer
    console.log("Initializing Stripe");
    const stripe = getStripe();
    let customer;
    if (user.stripeCustomerId) {
      console.log("Retrieving existing Stripe customer:", user.stripeCustomerId);
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
      console.log("Customer retrieved successfully");
    } else {
      console.log("Creating new Stripe customer for:", user.email);
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      console.log("New customer created:", customer.id);

      // Update user with Stripe customer ID in database
      console.log("Updating user with Stripe customer ID");
      await updateUserStripeCustomerId(user.id, customer.id);
      console.log("User updated successfully");
    }

    // Create checkout session
    console.log("Creating checkout session with:", {
      customer: customer.id,
      priceId,
      subscriptionType,
      baseUrl: process.env.APP_BASE_URL
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.APP_BASE_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL}/subscription?canceled=true`,
      metadata: {
        userId: user.id,
        subscriptionType,
      },
    });

    console.log("Checkout session created successfully:", checkoutSession.id);
    console.log("Redirecting to:", checkoutSession.url);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}