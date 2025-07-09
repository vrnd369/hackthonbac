// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let sig = req.headers.get("stripe-signature");
  let body = await req.text();
  let event;

  try {
    // Dynamically import Stripe
    const Stripe = (await import("npm:stripe@14")).default;
    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2023-10-16" });

    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET env var");
    }

    // Verify the event signature
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    console.log("Verified Stripe event:", event.type);
  } catch (err) {
    console.error(
      "Stripe webhook signature verification failed or error:",
      err
    );
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  // Example: handle payment_intent.succeeded
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    // TODO: Add your business logic here (e.g., update DB, send email)
    console.log("Payment succeeded:", paymentIntent.id);
  }

  // Add more event types as needed

  return new Response("Webhook received", { status: 200 });
});
