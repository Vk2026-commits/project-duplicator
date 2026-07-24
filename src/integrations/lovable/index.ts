// Local shim replacing the Lovable Cloud auth integration.
// Uses the Supabase JS client directly so the app runs against an external
// Supabase project without Lovable Cloud enabled.

import { supabase } from "../supabase/client";

type Provider = "google" | "apple" | "microsoft" | "lovable";
type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: Provider, opts?: SignInOptions) => {
      // "lovable" isn't a real OAuth provider outside Lovable Cloud; map it to google.
      const mapped = provider === "lovable" ? "google" : provider;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: mapped as "google" | "apple",
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      });
      if (error) return { error };
      return { redirected: true, url: data?.url };
    },
  },
};