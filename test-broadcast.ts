import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey.substring(0, 10) + "...");

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const channelName = "kds-test12345";
  console.log(`Sending to ${channelName}...`);
  
  const channel = supabaseAdmin.channel(channelName);
  
  channel.subscribe(async (status) => {
    console.log("Status:", status);
    if (status === "SUBSCRIBED") {
      try {
        await channel.send({
          type: "broadcast",
          event: "order_status_update",
          payload: { orderId: "test-order-id", status: "PREPARING" },
        });
        console.log("Sent successfully.");
      } catch (e) {
        console.error("Error sending:", e);
      } finally {
        supabaseAdmin.removeChannel(channel);
        process.exit(0);
      }
    }
    
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error("Failed to subscribe");
      process.exit(1);
    }
  });
}

main();
