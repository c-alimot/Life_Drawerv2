import { SafeArea, Screen } from "@components/layout";
import { Button, Input } from "@components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import { Controller, useForm } from "react-hook-form";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { useLogin } from "../hooks/useLogin";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { login, isLoading, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data);
    if (success) {
      // Navigation handled by RootNavigator based on auth state
    }
  };

  return (
    <SafeArea>
      <Screen style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessible
              accessibilityLabel="Go back"
            >
              <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                ← Back
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text
              style={[
                theme.typography.h2,
                {
                  color: theme.colors.text,
                  textAlign: "center",
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Welcome back
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.error + "20" },
              ]}
            >
              <Text
                style={[theme.typography.bodySm, { color: theme.colors.error }]}
                accessible
                accessibilityRole="alert"
              >
                {error.message}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@email.com"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  accessibilityLabel="Email input"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.password?.message}
                  accessibilityLabel="Password input"
                />
              )}
            />

            <TouchableOpacity
              onPress={() => {
                // TODO: Implement forgot password
              }}
              accessible
              accessibilityLabel="Forgot password"
              accessibilityHint="Opens password recovery flow"
            >
              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <Button
            label={isLoading ? "Signing in..." : "Sign in"}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityLabel="Sign in button"
          />

          {/* Signup Link */}
          <View style={styles.signupLink}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Signup" as never)}
              accessible
              accessibilityLabel="Create account"
              accessibilityHint="Navigate to signup page"
            >
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.primary, fontWeight: "600" },
                ]}
              >
                Create account
              </Text>
            </TouchableOpacity>
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
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleSection: {
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  signupLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    flexWrap: "wrap",
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
});
