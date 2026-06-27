import { create } from "zustand";
import { supabase } from "~/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
}

let unsubscribe: (() => void) | undefined;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      // 先注册监听器，再获取 session，避免竞态条件
      const { data: subData } = supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      });
      unsubscribe = subData?.subscription?.unsubscribe;

      const { data } = await supabase.auth.getSession();
      set({
        session: data.session,
        user: data.session?.user ?? null,
        isAuthenticated: !!data.session,
        isLoading: false,
      });
    } catch (e) {
      console.error("[AuthStore] initialize failed:", e);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    // 直接设置状态，不依赖 onAuthStateChange 的异步回调
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isAuthenticated: true,
    });
    return {};
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // signUp 可能需要邮箱验证，session 可能为 null
    if (data.session) {
      set({
        session: data.session,
        user: data.session.user ?? null,
        isAuthenticated: true,
      });
    }
    return {};
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    set({ user: null, session: null, isAuthenticated: false });
    return {};
  },
}));
