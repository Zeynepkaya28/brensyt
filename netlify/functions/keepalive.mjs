// Supabase's free plan pauses a project after about a week without activity, which makes sign-up and
// sign-in fail. This scheduled function sends one tiny request every day (06:00 UTC) so that does not happen.
const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "https://xlvsptlpzwffnsqdgvqj.supabase.co";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_PUBLISHABLE_KEY") || "sb_publishable_5IAif0zfSFvZNuGVIgNbEA_SF_mvJS4";

export default async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=user_id&limit=1`, { headers: { apikey: SUPABASE_KEY } });
  console.log("keepalive:", res.status);
};

export const config = { schedule: "0 6 * * *" };
