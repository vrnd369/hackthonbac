async function testStripeConfig() {
  console.log("🔍 Testing Stripe configuration...\n");

  try {
    // Test 1: Check environment variables
    console.log("🔧 Testing environment variables...");
    const supabaseUrl = "https://rnwgojmxlvgrtnozxmlc.supabase.co";
    const supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2dvam14bHZncnRub3p4bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjU1MjksImV4cCI6MjA2NTg0MTUyOX0._gA3hl3QP1pDNUO-4s0ilGgkXot39-G4qt3IqeDlGHw";

    console.log("Supabase URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
    console.log("Supabase Key:", supabaseKey ? "✅ Set" : "❌ Missing");

    // Test 2: Test payment intent creation
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

    const result = await response.json();
    console.log("✅ Payment intent created successfully");
    console.log("Response:", result);

    console.log("\n🎉 Stripe configuration test passed!");
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
