import { MaterialCommunityIcons } from "@components/ui/icons";
import { SafeArea, Screen } from "@components/layout";
import { Button } from "@components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { authApi } from "../api/auth.api";
import { useLogin } from "../hooks/useLogin";

const AUTH_BACKGROUND = "#EDEAE4";
const AUTH_FIELD_BACKGROUND = "#FFFFFF";
const AUTH_TEXT = "#2F2924";
const AUTH_MUTED = "#6F6860";
const AUTH_PRIMARY = "#8C9A7F";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const theme = useTheme();
  const { login, isLoading, error } = useLogin();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");
  const fieldLabelStyle = [theme.typography.labelSm, styles.fieldLabel, { color: AUTH_TEXT }];
  const fieldErrorStyle = [theme.typography.bodySm, styles.fieldError, { color: "#FFFFFF" }];
  const bottomPromptStyle = [theme.typography.body, styles.bottomPrompt, { color: AUTH_TEXT }];
  const bottomLinkStyle = [theme.typography.body, styles.bottomLink, { color: AUTH_PRIMARY }];

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data);
    if (success) {
      // Navigation handled by RootNavigator based on auth state
    }
  };

  const fieldBaseStyle = {
    backgroundColor: AUTH_FIELD_BACKGROUND,
    borderRadius: 18,
    paddingHorizontal: 18,
    minHeight: 72,
    borderWidth: 0,
    color: AUTH_TEXT,
    shadowColor: AUTH_TEXT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
    ...theme.typography.body,
  } as const;

  return (
    <SafeArea>
      <Screen
        style={[styles.container, { backgroundColor: AUTH_BACKGROUND }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/intro")}
              accessible
              accessibilityLabel="Go back"
            >
              <Text
                style={[
                  theme.typography.body,
                  styles.backLink,
                  { color: AUTH_TEXT },
                ]}
              >
                Back
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.titleSection}>
              <Text
                style={[
                  styles.title,
                  {
                    color: AUTH_TEXT,
                    textAlign: "center",
                    fontFamily: theme.fonts.serif,
                  },
                ]}
              >
                Welcome back
              </Text>
            </View>

            {error && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.errorBackground },
                ]}
              >
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: "#FFFFFF" },
                  ]}
                  accessible
                  accessibilityRole="alert"
                >
                  {error.message}
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <Text
                style={fieldLabelStyle}
              >
                EMAIL ADDRESS
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldBlock}>
                    <TextInput
                      style={fieldBaseStyle}
                      placeholder="you@email.com"
                      placeholderTextColor={AUTH_MUTED}
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      accessibilityLabel="Email input"
                    />
                    {errors.email?.message ? (
                      <Text style={fieldErrorStyle}>
                        {errors.email.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <Text
                style={fieldLabelStyle}
              >
                PASSWORD
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldBlock}>
                    <View style={styles.passwordFieldWrap}>
                      <TextInput
                        style={[fieldBaseStyle, styles.passwordInput]}
                        placeholder="Enter your password"
                        placeholderTextColor={AUTH_MUTED}
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!isPasswordVisible}
                        autoComplete="current-password"
                        accessibilityLabel="Password input"
                      />
                      <TouchableOpacity
                        onPress={() => setIsPasswordVisible((current) => !current)}
                        style={styles.passwordToggle}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={
                          isPasswordVisible ? "Hide password" : "Show password"
                        }
                      >
                        <MaterialCommunityIcons
                          name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                          size={22}
                          color={AUTH_MUTED}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password?.message ? (
                      <Text style={fieldErrorStyle}>
                        {errors.password.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={async () => {
                  if (!emailValue.trim()) {
                    Alert.alert(
                      "Email required",
                      "Enter your email first and then tap Forgot password.",
                    );
                    return;
                  }

                  const result = await authApi.resetPassword(emailValue.trim());
                  if (result.success) {
                    Alert.alert(
                      "Reset email sent",
                      "Check your inbox for password reset instructions.",
                    );
                  } else {
                    Alert.alert(
                      "Unable to send reset email",
                      result.error?.message || "Please try again.",
                    );
                  }
                }}
                accessible
                accessibilityLabel="Forgot password"
                accessibilityHint="Opens password recovery flow"
              >
                <Text
                  style={[
                    theme.typography.bodySm,
                    styles.forgotLink,
                    { color: AUTH_TEXT },
                  ]}
                >
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              label={isLoading ? "SIGNING IN..." : "SIGN IN"}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              variant="primary"
              textStyle={{ color: "#FFFFFF" }}
            style={[
              styles.submitButton,
              {
                borderRadius: 999,
                minHeight: 72,
                backgroundColor: AUTH_PRIMARY,
              },
              ]}
              accessibilityLabel="Sign in button"
            />

            <View style={styles.signupLink}>
              <Text
                style={bottomPromptStyle}
              >
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/signup")}
                accessible
                accessibilityLabel="Create account"
                accessibilityHint="Navigate to signup page"
              >
                <Text
                  style={bottomLinkStyle}
                >
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 8,
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 72,
  },
  backLink: {
    fontWeight: "500",
  },
  titleSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 2,
  },
  form: {
    marginBottom: 30,
  },
  fieldLabel: {
    letterSpacing: 2.2,
    marginBottom: 8,
    marginTop: 12,
  },
  fieldBlock: {
    marginBottom: 8,
  },
  passwordFieldWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 56,
  },
  passwordToggle: {
    position: "absolute",
    right: 18,
    height: 72,
    justifyContent: "center",
  },
  fieldError: {
    marginTop: 8,
  },
  forgotLink: {
    marginTop: 6,
    marginBottom: 8,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 4,
  },
  signupLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    flexWrap: "wrap",
  },
  bottomPrompt: {
    textAlign: "center",
  },
  bottomLink: {
    fontWeight: "700",
  },
  errorBanner: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
});
