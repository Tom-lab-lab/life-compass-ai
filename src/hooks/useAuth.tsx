import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const logAuthEvent = async (userId: string, action: string) => {
    try {
      const { error } = await supabase.from("audit_logs").insert({
        user_id: userId,
        action,
        resource_type: "auth",
        metadata: { timestamp: new Date().toISOString() },
      });
      if (error) console.error("Audit log insert error:", error);
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setLoading(false);

        if (event === "SIGNED_IN" && newSession?.user) {
          setLastUserId(newSession.user.id);
          setTimeout(() => logAuthEvent(newSession.user.id, "login"), 0);
        }

        if (event === "SIGNED_OUT" && lastUserId) {
          const uid = lastUserId;
          setLastUserId(null);
          // Use service-level logging via edge function since user session is gone
          setTimeout(() => {
            supabase.functions.invoke("log-auth-event", {
              body: { user_id: uid, action: "logout" },
            }).catch(() => {});
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) setLastUserId(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [lastUserId]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
