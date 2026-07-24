// Lovable Cloud is disabled for this project. OAuth is routed
// directly through Supabase Auth on the external project.
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

type OAuthProvider = "google" | "apple" | "microsoft" | "lovable";

function mapProvider(provider: OAuthProvider) {
  if (provider === "microsoft") return "azure" as const;
  if (provider === "lovable") return "google" as const;
  return provider as "google" | "apple";
}

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: mapProvider(provider),
        options: {
          redirectTo: opts?.redirect_uri ?? window.location.origin,
          queryParams: opts?.extraParams,
        },
      });
      if (error) return { error, redirected: false };
      return { redirected: true, url: data?.url };
    },
  },
};
