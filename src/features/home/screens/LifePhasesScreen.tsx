import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@styles/theme';
import { useLifePhase } from '../hooks/useLifePhase';
import { Screen, SafeArea } from '@components/layout';
import { Button, Input } from '@components/ui';

const lifePhaseSchema = z.object({
  name: z.string().min(2, 'Life phase name must be at least 2 characters'),
  description: z.string().optional(),
});

type LifePhaseFormData = z.infer<typeof lifePhaseSchema>;

const EXAMPLE_PHASES = [
  {
    name: 'College Years',
    description: 'Learning and growing',
  },
  {
    name: 'First Job',
    description: 'Starting my career journey',
  },
  {
    name: 'Living Abroad',
    description: 'New adventures in a new place',
  },
];

export function LifePhasesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { activePhase, phases, isLoading, createPhase, setActivePhaseById, fetchAllPhases } =
    useLifePhase();
  const [showModal, setShowModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LifePhaseFormData>({
    resolver: zodResolver(lifePhaseSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Fetch phases on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchAllPhases();
    }, [fetchAllPhases])
  );

  const onSubmit = async (data: LifePhaseFormData) => {
    const newPhase = await createPhase({
      name: data.name,
      description: data.description,
    });

    if (newPhase) {
      reset();
      setShowModal(false);
      fetchAllPhases();
    }
  };

  const handleSelectPhase = useCallback(
    async (phaseId: string) => {
      await setActivePhaseById(phaseId);
      fetchAllPhases();
    },
    [setActivePhaseById, fetchAllPhases]
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleExamplePhase = useCallback(
    (name: string, description: string) => {
      reset({ name, description });
    },
    [reset]
  );

  return (
    <SafeArea>
      <Screen style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} accessible accessibilityLabel="Go back">
            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
            Life Phases
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Illustration & Description */}
          <View style={styles.intro}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.gray[200] },
              ]}
            >
              <Text style={styles.iconText}>📅</Text>
            </View>

            <Text
              style={[
                theme.typography.h2,
                {
                  color: theme.colors.text,
                  textAlign: 'center',
                  marginVertical: theme.spacing.lg,
                },
              ]}
            >
              Define Your Life Phases
            </Text>

            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginBottom: theme.spacing.xl,
                  lineHeight: 24,
                },
              ]}
            >
              Group your entries under one current life phase at a time, helping you capture
              and reflect on the chapter you're in right now.
            </Text>
          </View>

          {/* Create Button */}
          <Button
            label="+ Create Your First Phase"
            onPress={() => setShowModal(true)}
            accessibilityLabel="Create new life phase button"
            accessibilityHint="Opens form to create a new life phase"
          />

          {/* Active Phase */}
          {activePhase && (
            <View
              style={[
                styles.card,
                styles.activeCard,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary + '10',
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.labelSm,
                  { color: theme.colors.primary, marginBottom: theme.spacing.sm },
                ]}
              >
                CURRENT LIFE PHASE
              </Text>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginBottom: theme.spacing.xs },
                ]}
              >
                {activePhase.name}
              </Text>
              {activePhase.description && (
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {activePhase.description}
                </Text>
              )}
            </View>
          )}

          {/* All Phases */}
          {phases.length > 0 && (
            <View>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.xl,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                YOUR LIFE PHASES
              </Text>

              <FlatList
                data={phases}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: phase }) => (
                  <TouchableOpacity
                    style={[
                      styles.phaseCard,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor:
                          phase.isActive ? theme.colors.primary + '10' : 'transparent',
                      },
                    ]}
                    onPress={() => handleSelectPhase(phase.id)}
                    accessible
                    accessibilityLabel={`Life phase: ${phase.name}`}
                    accessibilityHint={
                      phase.isActive ? 'Currently active' : 'Tap to set as active'
                    }
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.phaseIcon,
                        {
                          backgroundColor: phase.isActive
                            ? theme.colors.primary
                            : theme.colors.gray[300],
                        },
                      ]}
                    >
                      <Text style={styles.phaseIconText}>📅</Text>
                    </View>
                    <View style={styles.phaseInfo}>
                      <Text
                        style={[
                          theme.typography.h3,
                          { color: theme.colors.text },
                        ]}
                      >
                        {phase.name}
                      </Text>
                      {phase.description && (
                        <Text
                          style={[
                            theme.typography.bodySm,
                            {
                              color: theme.colors.textSecondary,
                              marginTop: theme.spacing.xs,
                            },
                          ]}
                        >
                          {phase.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Example Phases */}
          {phases.length === 0 && (
            <View>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.xl,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                EXAMPLE LIFE PHASES
              </Text>

              <FlatList
                data={EXAMPLE_PHASES}
                keyExtractor={(item) => item.name}
                scrollEnabled={false}
                renderItem={({ item: example }) => (
                  <TouchableOpacity
                    style={[
                      styles.exampleCard,
                      { borderColor: theme.colors.border },
                    ]}
                    onPress={() =>
                      handleExamplePhase(example.name, example.description)
                    }
                    accessible
                    accessibilityLabel={`Example: ${example.name}`}
                    accessibilityHint={`${example.description}. Tap to use this as template`}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.exampleIcon,
                        {
                          backgroundColor: theme.colors.gray[300],
                        },
                      ]}
                    >
                      <Text style={styles.exampleIconText}>📅</Text>
                    </View>
                    <View style={styles.exampleInfo}>
                      <Text
                        style={[
                          theme.typography.h3,
                          { color: theme.colors.text },
                        ]}
                      >
                        {example.name}
                      </Text>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          {
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing.xs,
                          },
                        ]}
                      >
                        {example.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </ScrollView>

        {/* Create Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <SafeArea>
            <Screen
              style={[
                styles.modalContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  accessible
                  accessibilityLabel="Close"
                >
                  <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
                <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
                  New Life Phase
                </Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                {/* Form */}
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Life Phase Name"
                        placeholder="e.g., College Years, New Job"
                        value={value}
                        onChangeText={onChange}
                        error={errors.name?.message}
                        accessibilityLabel="Life phase name input"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Description (Optional)"
                        placeholder="Add details about this life phase..."
                        value={value}
                        onChangeText={onChange}
                        multiline
                        numberOfLines={4}
                        accessibilityLabel="Life phase description input"
                      />
                    )}
                  />
                </View>

                <Button
                  label={isLoading ? 'Creating...' : 'Create Life Phase'}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  accessibilityLabel="Create life phase button"
                />
              </ScrollView>
            </Screen>
          </SafeArea>
        </Modal>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  intro: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 50,
  },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  activeCard: {
    borderWidth: 2,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  phaseIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  phaseIconText: {
    fontSize: 24,
  },
  phaseInfo: {
    flex: 1,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  exampleIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exampleIconText: {
    fontSize: 24,
  },
  exampleInfo: {
    flex: 1,
  },
  form: {
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
});