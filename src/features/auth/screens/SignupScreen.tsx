import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@styles/theme';
import { useSignup } from '../hooks/useSignup';
import { Screen, SafeArea } from '@components/layout';
import { Button, Input } from '@components/ui';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signup, isLoading, error } = useSignup();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const agreeToTerms = watch('agreeToTerms');

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
                  textAlign: 'center',
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Create your account
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.error + '20' },
              ]}
            >
              <Text
                style={[
                  theme.typography.bodySm,
                  { color: theme.colors.error },
                ]}
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
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.fullName?.message}
                  accessibilityLabel="Full name input"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="your@email.com"
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
                  placeholder="Create a password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.password?.message}
                  accessibilityLabel="Password input"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.confirmPassword?.message}
                  accessibilityLabel="Confirm password input"
                />
              )}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => {
                // TODO: Toggle checkbox
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
                    borderColor: theme.colors.border,
                    backgroundColor: agreeToTerms
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
              />
              <Text
                style={[
                  theme.typography.bodySm,
                  { color: theme.colors.text, flex: 1, marginLeft: theme.spacing.md },
                ]}
              >
                I agree to the Terms of Service and Privacy Policy. I understand my
                journal entries are private and will never be shared.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <Button
            label={isLoading ? 'Creating account...' : 'Create account'}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading || !agreeToTerms}
            accessibilityLabel="Create account button"
            accessibilityHint="Submit signup form"
          />

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login' as never)}
              accessible
              accessibilityLabel="Sign in"
              accessibilityHint="Navigate to login page"
            >
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.primary, fontWeight: '600' },
                ]}
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
});