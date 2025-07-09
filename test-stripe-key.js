async function testStripeKey() {
  console.log("🔍 Testing Stripe key...\n");

  try {
    // Test the Stripe key
    const stripeKey =
      "pk_live_51RbPL8B98Drnw31WYAvCGXl1nvqEvEun69A2YH6VVsjCJmiEZj2l3jGADdndMqzZdj75aPheCY1DHafrJ6diYn7a00FXb3Fqv5";

    console.log("Stripe key:", stripeKey);
    console.log(
      "Key type:",
      stripeKey.startsWith("pk_live_") ? "Live" : "Test"
    );

    // Try to load Stripe
    const { loadStripe } = await import("https://js.stripe.com/v3/");
    const stripe = await loadStripe(stripeKey);

    if (stripe) {
      console.log("✅ Stripe loaded successfully");
      console.log("Stripe object:", stripe);
    } else {
      console.log("❌ Stripe failed to load");
    }

    return true;
  } catch (error) {
    console.error("❌ Stripe key test failed:", error.message);
    return false;
  }
}

// Run the test
testStripeKey()
  .then((success) => {
    if (success) {
      console.log("\n✅ Stripe key is working!");
    } else {
      console.log("\n❌ Stripe key issues detected!");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  });
