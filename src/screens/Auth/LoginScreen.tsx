import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuthStore } from "~/stores/auth";
import { APP_NAME } from "~/constants";
import tw from "~/lib/tw";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("提示", "请输入邮箱和密码");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert("登录失败", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1`}
    >
      <View style={tw`flex-1 justify-center px-8 bg-white`}>
        {/* Logo */}
        <View style={tw`items-center mb-12`}>
          <Text style={tw`text-5xl font-bold text-primary-600`}>{APP_NAME}</Text>
          <Text style={tw`text-gray-400 mt-2 text-base`}>
            智能刷题练习平台
          </Text>
        </View>

        {/* 表单 */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
            邮箱
          </Text>
          <TextInput
            style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900`}
            placeholder="请输入邮箱"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={tw`text-sm font-medium text-gray-700 mb-1 mt-4`}>
            密码
          </Text>
          <TextInput
            style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900`}
            placeholder="请输入密码"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={tw`mt-8 rounded-xl py-3.5 items-center ${loading ? "bg-primary-400" : "bg-primary-600"}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white font-semibold text-lg`}>登录</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`mt-4 items-center`}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={tw`text-primary-600 text-sm`}>
              还没有账号？立即注册
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
