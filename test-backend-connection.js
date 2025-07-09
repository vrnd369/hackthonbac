import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = "https://rnwgojmxlvgrtnozxmlc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2dvam14bHZncnRub3p4bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjU1MjksImV4cCI6MjA2NTg0MTUyOX0._gA3hl3QP1pDNUO-4s0ilGgkXot39-G4qt3IqeDlGHw";

async function testBackendConnection() {
  console.log("🔍 Testing backend connection...\n");

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase client created successfully");

    // Test 1: Check if we can connect to the database
    console.log("\n📊 Testing database connection...");
    const { data: testData, error: testError } = await supabase
      .from("hackathon_registrations")
      .select("count")
      .limit(1);

    if (testError) {
      console.log("❌ Database connection failed:", testError.message);
      return false;
    }
    console.log("✅ Database connection successful");

    // Test 2: Check Edge Functions
    console.log("\n⚡ Testing Edge Functions...");
    const functions = [
      "get-registrations",
      "create-payment-intent",
      "confirm-payment",
      "create-team",
      "get-teams",
    ];

    for (const funcName of functions) {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/${funcName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ test: true }),
          }
        );

        if (response.status === 200 || response.status === 400) {
          console.log(`✅ ${funcName} function accessible`);
        } else {
          console.log(
            `⚠️  ${funcName} function returned status: ${response.status}`
          );
        }
      } catch (error) {
        console.log(`❌ ${funcName} function error:`, error.message);
      }
    }

    // Test 3: Check if tables exist
    console.log("\n🗄️  Checking database tables...");
    const tables = [
      "hackathon_registrations",
      "user_profiles",
      "teams",
      "team_submissions",
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName} exists`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${tableName}:`, error.message);
      }
    }

    console.log("\n🎉 Backend connection test completed!");
    return true;
  } catch (error) {
    console.error("❌ Backend connection test failed:", error.message);
    return false;
  }
}

// Run the test
testBackendConnection()
  .then((success) => {
    if (success) {
      console.log("\n✅ Backend is connected and working properly!");
    } else {
      console.log("\n❌ Backend connection issues detected!");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  });
