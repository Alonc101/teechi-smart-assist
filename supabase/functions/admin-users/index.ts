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

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    // ── Create user (no userId needed) ──
    if (action === "create_user") {
      const { email, password, studentName, grade, schoolId } = body;
      if (!email || !password || !studentName) {
        return new Response(JSON.stringify({ error: "Missing email, password, or studentName" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user with confirmed email
      // Pass student data via user_metadata so the handle_new_user trigger picks it up
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          student_name: studentName,
          grade: grade || null,
          school_id: schoolId || null,
        },
      });
      if (createError) throw createError;
      if (!newUser?.user) throw new Error("Failed to create user");

      // The handle_new_user trigger automatically creates the student profile and student role
      result = { success: true, message: "User created", userId: newUser.user.id };

    } else {
      // ── All other actions require userId ──
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent self-actions (except list)
      if (action !== "list" && userId === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot perform action on yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      switch (action) {
        case "ban": {
          const { error } = await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: "876000h",
          });
          if (error) throw error;
          result = { success: true, message: "User banned" };
          break;
        }

        case "unban": {
          const { error } = await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: "none",
          });
          if (error) throw error;
          result = { success: true, message: "User unbanned" };
          break;
        }

        case "make_admin": {
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
          const { error } = await adminClient.auth.admin.updateUserById(userId, {
            email_confirm: true,
          });
          if (error) throw error;
          result = { success: true, message: "Email confirmed" };
          break;
        }

        case "delete": {
          await adminClient.from("students").delete().eq("user_id", userId);
          await adminClient.from("user_roles").delete().eq("user_id", userId);
          const { error } = await adminClient.auth.admin.deleteUser(userId);
          if (error) throw error;
          result = { success: true, message: "User deleted" };
          break;
        }

        case "list": {
          const { data: { users }, error } = await adminClient.auth.admin.listUsers({
            perPage: 1000,
          });
          if (error) throw error;

          const userMap: Record<string, { email: string; banned: boolean; email_confirmed: boolean; created_at: string }> = {};
          for (const u of users) {
            userMap[u.id] = {
              email: u.email || "",
              banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
              email_confirmed: !!u.email_confirmed_at,
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
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
