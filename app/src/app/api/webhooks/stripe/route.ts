import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { updateUserStripeCustomerId, updateUserSubscription, getUserByStripeCustomerId } from "@/lib/auth-db";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  console.log("Webhook received - starting processing");

  try {
    const body = await request.text();
    console.log("Body received, length:", body.length);

    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    console.log("Signature present:", !!signature);
    console.log("Webhook secret configured:", !!webhookSecret);

    if (!signature) {
      console.error("Missing stripe signature in headers");
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      console.log("Attempting to construct webhook event");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Webhook event constructed successfully, type:", event.type);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      console.error("Webhook secret being used:", webhookSecret?.substring(0, 10) + "...");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    console.log("Processing event type:", event.type);
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Handling checkout.session.completed");
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        console.log("Handling subscription change:", event.type);
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        console.log("Handling subscription deletion");
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        console.log("Invoice payment succeeded - no action needed");
        break;
      }

      case "invoice.payment_failed": {
        console.log("Invoice payment failed");
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        break;
    }

    console.log("Webhook processed successfully");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout session:", session.id);
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error("Missing userId in checkout session metadata:", session.id);
    return;
  }

  try {
    console.log("Updating user Stripe customer ID for user:", userId);
    // Update user's Stripe customer ID if not set
    if (session.customer && typeof session.customer === "string") {
      await updateUserStripeCustomerId(userId, session.customer);
      console.log("Successfully updated customer ID");
    }
  } catch (error) {
    console.error("Error handling checkout session:", error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  console.log("Processing subscription change for customer:", customerId);

  try {
    const user = await getUserByStripeCustomerId(customerId);

    if (!user) {
      console.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    // Get subscription type from price ID
    const priceId = subscription.items.data[0]?.price.id;
    console.log("Price ID:", priceId);
    let subscriptionType: "BASIC" | "PREMIUM" = "BASIC";

    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
      subscriptionType = "PREMIUM";
    }

    // Update user subscription in database
    const status = subscription.status === "active" ? "ACTIVE" : "CANCELED";
    console.log("Updating subscription - Type:", subscriptionType, "Status:", status);
    await updateUserSubscription(user.id, subscriptionType, status);
    console.log("Successfully updated subscription");
  } catch (error) {
    console.error("Error handling subscription change:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  console.log("Processing subscription deletion for customer:", customerId);

  try {
    const user = await getUserByStripeCustomerId(customerId);

    if (!user) {
      console.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    // Update user subscription to FREE/CANCELED in database
    console.log("Setting subscription to FREE/CANCELED");
    await updateUserSubscription(user.id, "FREE", "CANCELED");
    console.log("Successfully deleted subscription");
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
  }
}