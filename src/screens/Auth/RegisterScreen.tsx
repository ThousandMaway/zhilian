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

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("提示", "请输入邮箱和密码");
      return;
    }
    if (password.length < 6) {
      Alert.alert("提示", "密码至少 6 位");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("提示", "两次密码输入不一致");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert("注册失败", error);
    } else {
      Alert.alert("注册成功", "请查看邮箱确认链接，或直接登录", [
        { text: "去登录", onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1`}
    >
      <View style={tw`flex-1 justify-center px-8 bg-white`}>
        <View style={tw`items-center mb-10`}>
          <Text style={tw`text-4xl font-bold text-primary-600`}>{APP_NAME}</Text>
          <Text style={tw`text-gray-400 mt-1`}>创建你的账号</Text>
        </View>

        <View>
          <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>邮箱</Text>
          <TextInput
            style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 mb-4`}
            placeholder="请输入邮箱"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>密码</Text>
          <TextInput
            style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 mb-4`}
            placeholder="至少 6 位密码"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
            确认密码
          </Text>
          <TextInput
            style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 mb-8`}
            placeholder="再次输入密码"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={tw`rounded-xl py-3.5 items-center ${loading ? "bg-primary-400" : "bg-primary-600"}`}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white font-semibold text-lg`}>注册</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`mt-4 items-center`}
            onPress={() => navigation.goBack()}
          >
            <Text style={tw`text-primary-600 text-sm`}>
              已有账号？返回登录
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
