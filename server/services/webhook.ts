import { db } from "../../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

/**
 * Handle Stripe webhook events
 * @param event Stripe webhook event
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
        
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    throw error;
  }
}

/**
 * Handle successful payment intents for one-time payments
 * @param paymentIntent The successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  const metadata = paymentIntent.metadata;
  
  // If this isn't a payment with our metadata, ignore it
  if (!metadata.userId || !metadata.plan || !metadata.expiresAt) {
    console.log("Payment intent doesn't have required metadata, skipping");
    return;
  }
  
  // Skip subscription payments (handled by subscription events)
  if (metadata.paymentType === 'subscription') {
    console.log(`Skipping payment intent for subscription payment: ${paymentIntent.id}`);
    return;
  }
  
  try {
    // Get the user - convert userId string to number
    const userId = parseInt(metadata.userId, 10);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      console.error(`User ${metadata.userId} not found for payment ${paymentIntent.id}`);
      return;
    }
    
    // Update the user's subscription information for one-time payment
    await db
      .update(users)
      .set({
        subscriptionStatus: "active",
        subscriptionTier: metadata.plan,
        subscriptionExpiresAt: new Date(metadata.expiresAt),
        stripeCustomerId: paymentIntent.customer as string || user.stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    console.log(`User ${metadata.userId} subscription updated for one-time plan ${metadata.plan}`);
  } catch (error) {
    console.error(`Error updating user subscription for payment ${paymentIntent.id}:`, error);
    throw error;
  }
}

/**
 * Handle invoice paid events for recurring subscriptions
 * @param invoice The paid invoice
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  if (invoice.billing_reason !== 'subscription_cycle') {
    console.log(`Skipping invoice that isn't a subscription cycle: ${invoice.id}`);
    return;
  }
  
  const customerId = invoice.customer as string;
  if (!customerId) {
    console.log(`Invoice ${invoice.id} doesn't have a customer ID, skipping`);
    return;
  }
  
  try {
    // Look up the user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    
    if (!user) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) {
      console.error(`Invoice ${invoice.id} doesn't have a subscription ID`);
      return;
    }
    
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Calculate new expiration date based on the billing period
    const now = new Date();
    let expiresAt = new Date(now);
    
    // Determine the plan type from the subscription items
    const item = subscription.items.data[0];
    const productId = item.price.product as string;
    const product = await stripe.products.retrieve(productId);
    const planType = product.metadata.plan || 'monthly'; // Default to monthly
    
    // Set expiration date based on plan type
    if (planType === 'annual') {
      expiresAt.setDate(now.getDate() + 365); // 365 days for annual plan
    } else {
      expiresAt.setDate(now.getDate() + 30); // 30 days for monthly plan
    }
    
    // Update the user's subscription information
    await db
      .update(users)
      .set({
        subscriptionStatus: "active",
        subscriptionTier: planType,
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log(`User ${user.id} subscription renewed for plan ${planType}`);
  } catch (error) {
    console.error(`Error processing paid invoice ${invoice.id}:`, error);
    throw error;
  }
}

/**
 * Handle subscription created events
 * @param subscription The created subscription
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  if (!customerId) {
    console.log(`Subscription ${subscription.id} doesn't have a customer ID, skipping`);
    return;
  }
  
  try {
    // Look up the user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    
    if (!user) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    // Calculate expiration date based on the billing period
    const now = new Date();
    let expiresAt = new Date(now);
    
    // Determine the plan type from the subscription items
    const item = subscription.items.data[0];
    const productId = item.price.product as string;
    const product = await stripe.products.retrieve(productId);
    const planType = product.metadata.plan || 'monthly'; // Default to monthly
    
    // Set expiration date based on plan type
    if (planType === 'annual') {
      expiresAt.setDate(now.getDate() + 365); // 365 days for annual plan
    } else {
      expiresAt.setDate(now.getDate() + 30); // 30 days for monthly plan
    }
    
    // Update the user's subscription information
    await db
      .update(users)
      .set({
        subscriptionStatus: "active",
        subscriptionTier: planType,
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log(`User ${user.id} subscription created for plan ${planType}`);
  } catch (error) {
    console.error(`Error processing subscription created ${subscription.id}:`, error);
    throw error;
  }
}

/**
 * Handle subscription updated events
 * @param subscription The updated subscription
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  if (!customerId) {
    console.log(`Subscription ${subscription.id} doesn't have a customer ID, skipping`);
    return;
  }
  
  try {
    // Look up the user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    
    if (!user) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    // Determine the new subscription status
    let subscriptionStatus = 'active';
    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      subscriptionStatus = 'canceled';
    } else if (subscription.status === 'past_due') {
      subscriptionStatus = 'past_due';
    }
    
    // Update the user's subscription status
    await db
      .update(users)
      .set({
        subscriptionStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log(`User ${user.id} subscription updated to status ${subscriptionStatus}`);
  } catch (error) {
    console.error(`Error processing subscription updated ${subscription.id}:`, error);
    throw error;
  }
}

/**
 * Handle subscription deleted events
 * @param subscription The deleted subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  if (!customerId) {
    console.log(`Subscription ${subscription.id} doesn't have a customer ID, skipping`);
    return;
  }
  
  try {
    // Look up the user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    
    if (!user) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    // Update the user's subscription information
    await db
      .update(users)
      .set({
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log(`User ${user.id} subscription deleted`);
  } catch (error) {
    console.error(`Error processing subscription deleted ${subscription.id}:`, error);
    throw error;
  }
}