import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "~/stores/auth";
import RootNavigator from "~/navigation/RootNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 分钟
      retry: 1,
    },
  },
});

// 监听登录状态变化，清理缓存
function AuthCacheGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const prevAuth = useRef(isAuthenticated);
  const prevUserId = useRef(userId);

  useEffect(() => {
    // 登出时清除所有缓存
    if (prevAuth.current && !isAuthenticated) {
      queryClient.clear();
    }
    // 切换账号时也清除（从 A 用户直接切到 B 用户）
    if (prevUserId.current && userId && prevUserId.current !== userId) {
      queryClient.clear();
    }
    prevAuth.current = isAuthenticated;
    prevUserId.current = userId;
  }, [isAuthenticated, userId]);

  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthCacheGuard>
          <RootNavigator />
        </AuthCacheGuard>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
