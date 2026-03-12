import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with caller's token to verify admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId } = await req.json();

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: "Missing action or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-actions
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot perform action on yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    switch (action) {
      case "ban": {
        const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: "876000h", // ~100 years
        });
        if (error) throw error;
        result = { success: true, message: "User banned" };
        break;
      }

      case "unban": {
        const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        if (error) throw error;
        result = { success: true, message: "User unbanned" };
        break;
      }

      case "make_admin": {
        // Insert admin role (ignore if exists)
        const { error } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (error && !error.message.includes("duplicate")) throw error;
        result = { success: true, message: "User is now admin" };
        break;
      }

      case "remove_admin": {
        const { error } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
        result = { success: true, message: "Admin role removed" };
        break;
      }

      case "confirm_email": {
        const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
        if (error) throw error;
        result = { success: true, message: "Email confirmed" };
        break;
      }

      case "delete": {
        // Delete student record first
        await adminClient.from("students").delete().eq("user_id", userId);
        // Delete user roles
        await adminClient.from("user_roles").delete().eq("user_id", userId);
        // Delete auth user
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;
        result = { success: true, message: "User deleted" };
        break;
      }

      case "list": {
        // Get all users with their ban status
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({
          perPage: 1000,
        });
        if (error) throw error;
        
        const userMap: Record<string, { email: string; banned: boolean; created_at: string }> = {};
        for (const u of users) {
          userMap[u.id] = {
            email: u.email || "",
            banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
            created_at: u.created_at,
          };
        }
        result = { success: true, users: userMap };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
