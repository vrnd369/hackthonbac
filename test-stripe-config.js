import { getStripe } from "./src/lib/stripe.ts";

async function testStripeConfig() {
  console.log("🔍 Testing Stripe configuration...\n");

  try {
    // Test 1: Check if Stripe can be initialized
    console.log("📊 Testing Stripe initialization...");
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error("Stripe not initialized");
    }
    console.log("✅ Stripe initialized successfully");

    // Test 2: Check environment variables
    console.log("\n🔧 Testing environment variables...");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    console.log("Supabase URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
    console.log("Supabase Key:", supabaseKey ? "✅ Set" : "❌ Missing");
    console.log("Stripe Key:", stripeKey ? "✅ Set" : "❌ Missing");

    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      throw new Error("Missing required environment variables");
    }

    // Test 3: Test payment intent creation
    console.log("\n💳 Testing payment intent creation...");
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-payment-intent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          amount: 10,
          currency: "usd",
          description: "Test Payment Intent",
          metadata: {
            test: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Payment intent creation failed: ${response.status} - ${errorText}`
      );
    }

    const { client_secret } = await response.json();
    console.log("✅ Payment intent created successfully");
    console.log("Client secret length:", client_secret?.length || 0);

    // Test 4: Test Stripe Elements creation
    console.log("\n🎨 Testing Stripe Elements creation...");
    const elements = stripe.elements({
      clientSecret: client_secret,
      appearance: {
        theme: "night",
      },
    });

    console.log("✅ Stripe Elements created successfully");
    console.log("Elements object:", elements);

    console.log("\n🎉 All Stripe tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Stripe test failed:", error.message);
    return false;
  }
}

// Run the test
testStripeConfig()
  .then((success) => {
    if (success) {
      console.log("\n✅ Stripe configuration is working properly!");
    } else {
      console.log("\n❌ Stripe configuration issues detected!");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  });
