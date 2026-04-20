import { MaterialCommunityIcons } from "@components/ui/icons";
import { SafeArea, Screen } from "@components/layout";
import { Button } from "@components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { useSignup } from "../hooks/useSignup";

const AUTH_BACKGROUND = "#EDEAE4";
const AUTH_FIELD_BACKGROUND = "#FFFFFF";
const AUTH_TEXT = "#2F2924";
const AUTH_MUTED = "#6F6860";
const AUTH_PRIMARY = "#8C9A7F";
const AUTH_ACCENT = "#B39C87";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupScreen() {
  const theme = useTheme();
  const { signup, isLoading, error } = useSignup();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const agreeToTerms = watch("agreeToTerms");
  const passwordValue = watch("password");
  const fieldLabelStyle = [theme.typography.labelSm, styles.fieldLabel, { color: AUTH_TEXT }];
  const fieldErrorStyle = [theme.typography.bodySm, styles.fieldError, { color: theme.colors.errorText }];
  const bottomLinkStyle = [theme.typography.body, styles.bottomLink, { color: AUTH_PRIMARY }];

  const passwordChecks = useMemo(
    () => ({
      minLength: passwordValue.length >= 8,
      upperLower: /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue),
      number: /\d/.test(passwordValue),
      symbol: /[^A-Za-z0-9]/.test(passwordValue),
    }),
    [passwordValue],
  );

  const onSubmit = async (data: SignupFormData) => {
    const success = await signup({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    });

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
              Create your account
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
                style={[theme.typography.bodySm, { color: theme.colors.errorText }]}
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
              FULL NAME
            </Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldBlock}>
                  <TextInput
                    style={fieldBaseStyle}
                    placeholder="Your name"
                    placeholderTextColor={AUTH_MUTED}
                    value={value}
                    onChangeText={onChange}
                    autoComplete="name"
                    accessibilityLabel="Full name input"
                  />
                  {errors.fullName?.message ? (
                    <Text style={fieldErrorStyle}>
                      {errors.fullName.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

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
                    placeholder="your@email.com"
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
                      placeholder="Create a password"
                      placeholderTextColor={AUTH_MUTED}
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      secureTextEntry={!isPasswordVisible}
                      autoComplete="new-password"
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
                  {isPasswordFocused ? (
                    <View
                      style={[
                        styles.passwordHelperCard,
                        {
                          backgroundColor: AUTH_FIELD_BACKGROUND,
                          shadowColor: AUTH_TEXT,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.bodySm,
                          styles.passwordHelperTitle,
                          { color: AUTH_TEXT },
                        ]}
                      >
                        Password requirements
                      </Text>

                      <View style={styles.passwordHelperList}>
                        <View style={styles.passwordHelperRow}>
                          <Text
                            style={[
                              styles.passwordHelperIcon,
                              {
                                color: passwordChecks.minLength
                                  ? AUTH_PRIMARY
                                  : AUTH_ACCENT,
                              },
                            ]}
                          >
                            {passwordChecks.minLength ? "✓" : "○"}
                          </Text>
                          <Text
                            style={[
                              theme.typography.bodySm,
                              styles.passwordHelperText,
                              { color: AUTH_MUTED },
                            ]}
                          >
                            Use at least 8 characters
                          </Text>
                        </View>

                        <View style={styles.passwordHelperRow}>
                          <Text
                            style={[
                              styles.passwordHelperIcon,
                              {
                                color:
                                  passwordChecks.upperLower &&
                                  passwordChecks.number &&
                                  passwordChecks.symbol
                                    ? AUTH_PRIMARY
                                    : AUTH_ACCENT,
                              },
                            ]}
                          >
                            {passwordChecks.upperLower &&
                            passwordChecks.number &&
                            passwordChecks.symbol
                              ? "✓"
                              : "○"}
                          </Text>
                          <Text
                            style={[
                              theme.typography.bodySm,
                              styles.passwordHelperText,
                              { color: AUTH_MUTED },
                            ]}
                          >
                            Include uppercase, lowercase, a number, and a symbol
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : null}
                  {errors.password?.message ? (
                    <Text style={fieldErrorStyle}>
                      {errors.password.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Text
              style={fieldLabelStyle}
            >
              CONFIRM PASSWORD
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldBlock}>
                  <View style={styles.passwordFieldWrap}>
                    <TextInput
                      style={[fieldBaseStyle, styles.passwordInput]}
                      placeholder="Confirm your password"
                      placeholderTextColor={AUTH_MUTED}
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!isConfirmPasswordVisible}
                      autoComplete="new-password"
                      accessibilityLabel="Confirm password input"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setIsConfirmPasswordVisible((current) => !current)
                      }
                      style={styles.passwordToggle}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={
                        isConfirmPasswordVisible
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      <MaterialCommunityIcons
                        name={
                          isConfirmPasswordVisible
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={22}
                        color={AUTH_MUTED}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword?.message ? (
                    <Text style={fieldErrorStyle}>
                      {errors.confirmPassword.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <TouchableOpacity
              style={[
                styles.termsContainer,
                {
                  borderColor: "transparent",
                  backgroundColor: AUTH_FIELD_BACKGROUND,
                  shadowColor: AUTH_TEXT,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.08,
                  shadowRadius: 22,
                  elevation: 4,
                },
              ]}
              onPress={() => {
                setValue("agreeToTerms", !agreeToTerms, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              accessible
              accessibilityLabel="Agree to terms and privacy policy"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreeToTerms }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: AUTH_ACCENT,
                    backgroundColor: agreeToTerms
                      ? AUTH_PRIMARY
                      : AUTH_FIELD_BACKGROUND,
                  },
                ]}
              >
                {agreeToTerms ? (
                  <Text style={styles.checkboxMark}>✓</Text>
                ) : null}
              </View>
              <Text
                style={[
                  theme.typography.bodySm,
                  styles.termsText,
                  { color: AUTH_TEXT },
                ]}
              >
                I agree to the Terms of Service and Privacy Policy. I understand
                my journal entries are private and will never be shared.
              </Text>
            </TouchableOpacity>

            {errors.agreeToTerms?.message ? (
              <Text style={fieldErrorStyle}>
                {errors.agreeToTerms.message}
              </Text>
            ) : null}
          </View>

          <Button
            label={isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
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
            accessibilityLabel="Create account button"
            accessibilityHint="Submit signup form"
          />

          <View style={styles.loginLink}>
            <Text style={[theme.typography.body, { color: AUTH_TEXT }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              accessible
              accessibilityLabel="Sign in"
              accessibilityHint="Navigate to login page"
            >
              <Text
                style={bottomLinkStyle}
              >
                Sign in
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 18,
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
  passwordHelperCard: {
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  passwordHelperTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },
  passwordHelperList: {
    gap: 8,
  },
  passwordHelperRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  passwordHelperIcon: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 10,
    fontWeight: "700",
  },
  passwordHelperText: {
    flex: 1,
    lineHeight: 20,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 10,
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 14,
  },
  termsText: {
    flex: 1,
    marginLeft: 12,
  },
  submitButton: {
    marginTop: 4,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    flexWrap: "wrap",
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
