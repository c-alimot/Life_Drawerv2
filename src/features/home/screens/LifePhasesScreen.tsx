import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { Button, Modal } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { useLifePhase } from "../hooks/useLifePhase";

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";
const ACTION_CANCEL_BG = "#E3E1DC";
const ACTION_CANCEL_BORDER = "#C9C4BB";
const ACTION_CANCEL_TEXT = "#5F6368";

const lifePhaseSchema = z.object({
  name: z.string().min(2, "Life phase name must be at least 2 characters"),
  description: z.string().optional(),
});

type LifePhaseFormData = z.infer<typeof lifePhaseSchema>;

const EXAMPLE_PHASES = [
  {
    name: "College Years",
    description: "Learning and growing",
  },
  {
    name: "First Job",
    description: "Starting my career journey",
  },
  {
    name: "Living Abroad",
    description: "New adventures in a new place",
  },
];

export function LifePhasesScreen() {
  const theme = useTheme();
  const {
    activePhase,
    phases,
    isLoading,
    createPhase,
    setActivePhaseById,
    updatePhase,
    fetchAllPhases,
  } = useLifePhase();
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCurrentPhaseMenu, setShowCurrentPhaseMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LifePhaseFormData>({
    resolver: zodResolver(lifePhaseSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
  } = useForm<LifePhaseFormData>({
    resolver: zodResolver(lifePhaseSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch phases on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchAllPhases();
    }, [fetchAllPhases]),
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

  const closeCreatePhaseModal = useCallback(() => {
    setShowModal(false);
    reset();
  }, [reset]);

  const handleSelectPhase = useCallback(
    async (phaseId: string) => {
      await setActivePhaseById(phaseId);
      fetchAllPhases();
    },
    [setActivePhaseById, fetchAllPhases],
  );

  const handleExamplePhase = useCallback(
    (name: string, description: string) => {
      reset({ name, description });
    },
    [reset],
  );

  const openCurrentPhaseMenu = useCallback(() => {
    if (!activePhase) {
      return;
    }
    setShowCurrentPhaseMenu(true);
  }, [activePhase]);

  const handleOpenEditCurrentPhase = useCallback(() => {
    if (!activePhase) {
      return;
    }

    resetEditForm({
      name: activePhase.name,
      description: activePhase.description || "",
    });
    setShowCurrentPhaseMenu(false);
    setShowEditModal(true);
  }, [activePhase, resetEditForm]);

  const closeEditPhaseModal = useCallback(() => {
    setShowEditModal(false);
    resetEditForm({ name: "", description: "" });
  }, [resetEditForm]);

  const onSubmitEditPhase = useCallback(
    async (data: LifePhaseFormData) => {
      if (!activePhase) {
        return;
      }

      const updated = await updatePhase(activePhase.id, {
        name: data.name,
        description: data.description,
      });

      if (updated) {
        closeEditPhaseModal();
        fetchAllPhases();
      }
    },
    [activePhase, closeEditPhaseModal, fetchAllPhases, updatePhase],
  );

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppSideMenu
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentRoute="/life-phases"
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              style={styles.headerIconButton}
              accessible
              accessibilityLabel="Open menu"
            >
              <MaterialCommunityIcons name="menu" size={34} color={PAGE_TEXT} />
            </TouchableOpacity>
            <Text
              style={[
                styles.pageTitle,
                { color: PAGE_MUTED },
              ]}
            >
              Life Phases
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/search")}
            style={styles.headerIconButton}
            accessible
            accessibilityLabel="Search entries"
          >
            <MaterialCommunityIcons name="magnify" size={32} color={PAGE_PRIMARY} />
          </TouchableOpacity>
        </View>

        {isLoading && phases.length === 0 && !activePhase ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={PAGE_PRIMARY} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.heroBlock}>
              <Text
                style={[
                  styles.heroTitlePrimary,
                  { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                ]}
              >
                The Chapter{" "}
                <Text style={[styles.heroTitleSecondary, { color: PAGE_PRIMARY }]}>
                  You&apos;re In
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryAction,
                {
                  backgroundColor: PAGE_PRIMARY,
                  shadowColor: PAGE_TEXT,
                },
              ]}
              onPress={() => setShowModal(true)}
              accessible
              accessibilityLabel="Create new life phase button"
              accessibilityHint="Opens form to create a new life phase"
            >
              <View style={styles.primaryActionIconBox}>
                <Text style={styles.primaryActionIcon}>+</Text>
              </View>
              <View style={styles.primaryActionCopy}>
                <Text
                  style={[
                    styles.primaryActionText,
                    { fontFamily: theme.fonts.serif },
                  ]}
                >
                  Create Life Phase
                </Text>
              </View>
            </TouchableOpacity>

            {activePhase && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      theme.typography.bodySm,
                      styles.sectionHeaderText,
                      { color: PAGE_MUTED },
                    ]}
                  >
                    Current Life Phase
                  </Text>
                  <View
                    style={[
                      styles.sectionDivider,
                      { backgroundColor: theme.colors.accent1 },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.activeCard,
                    {
                      backgroundColor: PAGE_SURFACE,
                      shadowColor: PAGE_TEXT,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.phaseIcon,
                      { backgroundColor: PAGE_PRIMARY + "22" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={26}
                      color={PAGE_PRIMARY}
                    />
                  </View>
                  <View style={styles.phaseInfo}>
                    <Text
                      style={[
                        styles.phaseName,
                        { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                      ]}
                    >
                      {activePhase.name}
                    </Text>
                    <Text
                      style={[
                        theme.typography.bodySm,
                        styles.phaseDescription,
                        { color: PAGE_MUTED },
                      ]}
                    >
                      {activePhase.description ||
                        "This is the chapter currently guiding your entries and reflections."}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={openCurrentPhaseMenu}
                    style={styles.currentPhaseMore}
                    accessible
                    accessibilityLabel={`More options for ${activePhase.name}`}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={22}
                      color={theme.colors.textDisabled}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {phases.length > 0 && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      theme.typography.bodySm,
                      styles.sectionHeaderText,
                      { color: PAGE_MUTED },
                    ]}
                  >
                    Your Life Phases
                  </Text>
                  <View
                    style={[
                      styles.sectionDivider,
                      { backgroundColor: theme.colors.accent1 },
                    ]}
                  />
                </View>

                <FlatList
                  data={phases}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item: phase }) => (
                    <TouchableOpacity
                      style={[
                        styles.phaseCard,
                        {
                          backgroundColor: PAGE_SURFACE,
                          shadowColor: PAGE_TEXT,
                        },
                      ]}
                      onPress={() => handleSelectPhase(phase.id)}
                      accessible
                      accessibilityLabel={`Life phase: ${phase.name}`}
                      accessibilityHint={
                        phase.isActive
                          ? "Currently active"
                          : "Tap to set as active"
                      }
                      accessibilityRole="button"
                    >
                      <View
                        style={[
                          styles.phaseIcon,
                          { backgroundColor: PAGE_PRIMARY + "22" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="calendar-blank-outline"
                          size={26}
                          color={phase.isActive ? PAGE_SECONDARY : PAGE_PRIMARY}
                        />
                      </View>
                      <View style={styles.phaseInfo}>
                        <Text
                          style={[
                            styles.phaseName,
                            { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                          ]}
                        >
                          {phase.name}
                        </Text>
                        {phase.description && (
                          <Text
                            style={[
                              theme.typography.bodySm,
                              styles.phaseDescription,
                              { color: PAGE_MUTED },
                            ]}
                          >
                            {phase.description}
                          </Text>
                        )}
                      </View>
                      {phase.isActive && (
                        <View style={styles.phaseStatus}>
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color={PAGE_SECONDARY}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {phases.length === 0 && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      theme.typography.bodySm,
                      styles.sectionHeaderText,
                      { color: PAGE_MUTED },
                    ]}
                  >
                    Example Life Phases
                  </Text>
                  <View
                    style={[
                      styles.sectionDivider,
                      { backgroundColor: theme.colors.accent1 },
                    ]}
                  />
                </View>

                <FlatList
                  data={EXAMPLE_PHASES}
                  keyExtractor={(item) => item.name}
                  scrollEnabled={false}
                  renderItem={({ item: example }) => (
                    <TouchableOpacity
                      style={[
                        styles.exampleCard,
                        {
                          backgroundColor: PAGE_SURFACE,
                          shadowColor: PAGE_TEXT,
                        },
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
                          { backgroundColor: PAGE_PRIMARY + "22" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="calendar-blank-outline"
                          size={26}
                          color={PAGE_PRIMARY}
                        />
                      </View>
                      <View style={styles.exampleInfo}>
                        <Text
                          style={[
                            styles.phaseName,
                            { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                          ]}
                        >
                          {example.name}
                        </Text>
                        <Text
                          style={[
                            theme.typography.bodySm,
                            styles.phaseDescription,
                            { color: PAGE_MUTED },
                          ]}
                        >
                          {example.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />

                <Text
                  style={[
                    styles.helperText,
                    { color: PAGE_MUTED, fontFamily: theme.fonts.serif },
                  ]}
                >
                  Create life phases to mark different seasons of your life and keep
                  your reflections grounded in the chapter you&apos;re living now.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Create Life Phase Modal */}
        <Modal
          visible={showModal}
          onClose={closeCreatePhaseModal}
          animationType="fade"
          backdropStyle={styles.modalBackdrop}
          contentStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              New Life Phase
            </Text>
            <TouchableOpacity
              onPress={closeCreatePhaseModal}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close create life phase"
            >
              <MaterialCommunityIcons name="close" size={28} color={PAGE_BORDER} />
            </TouchableOpacity>
          </View>

          <Text style={[theme.typography.body, styles.modalSubtitle, { color: PAGE_MUTED }]}>
            Capture the chapter you&apos;re currently living in.
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <>
                <Text style={[theme.typography.labelSm, styles.modalFieldLabel, { color: PAGE_TEXT }]}>
                  LIFE PHASE NAME
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. College Years, New Job"
                  placeholderTextColor={PAGE_MUTED}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: "#F8F6F2",
                      color: PAGE_TEXT,
                      shadowColor: PAGE_TEXT,
                    },
                  ]}
                  accessibilityLabel="Life phase name input"
                />
              </>
            )}
          />
          {errors.name?.message ? (
            <Text style={styles.fieldErrorText}>{errors.name.message}</Text>
          ) : null}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <>
                <Text style={[theme.typography.labelSm, styles.modalFieldLabel, { color: PAGE_TEXT }]}>
                  DESCRIPTION (OPTIONAL)
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Add details about this life phase..."
                  placeholderTextColor={PAGE_MUTED}
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    {
                      backgroundColor: "#F8F6F2",
                      color: PAGE_TEXT,
                      shadowColor: PAGE_TEXT,
                    },
                  ]}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Life phase description input"
                />
              </>
            )}
          />

          <View style={styles.modalActions}>
            <Button
              label="Cancel"
              onPress={closeCreatePhaseModal}
              variant="outline"
              style={[
                styles.modalSecondaryButton,
                { borderRadius: 999, borderColor: PAGE_BORDER },
              ]}
              textStyle={{ color: PAGE_SECONDARY, fontWeight: "700" }}
            />
            <Button
              label={isLoading ? "Creating..." : "Create"}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              variant="primary"
              style={[
                styles.modalPrimaryButton,
                { borderRadius: 999, backgroundColor: PAGE_SECONDARY },
              ]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
            />
          </View>
        </Modal>

        <Modal
          visible={showCurrentPhaseMenu}
          onClose={() => setShowCurrentPhaseMenu(false)}
          animationType="fade"
          backdropStyle={styles.modalBackdrop}
          contentStyle={styles.actionModal}
        >
          <Text style={[styles.actionTitle, { color: PAGE_TEXT, fontFamily: theme.fonts.serif }]}>
            {activePhase?.name || "Current Life Phase"}
          </Text>
          <Text style={[theme.typography.bodySm, styles.actionSubtitle, { color: PAGE_MUTED }]}>
            Choose an action for this life phase.
          </Text>
          <Button
            label="Edit"
            onPress={handleOpenEditCurrentPhase}
            variant="primary"
            style={[styles.actionButton, styles.actionEditButton]}
            textStyle={{ color: PAGE_SECONDARY, fontWeight: "700" }}
          />
          <Button
            label="Cancel"
            onPress={() => setShowCurrentPhaseMenu(false)}
            variant="primary"
            style={[
              styles.actionButton,
              { backgroundColor: ACTION_CANCEL_BG, borderColor: ACTION_CANCEL_BORDER },
            ]}
            textStyle={{ color: ACTION_CANCEL_TEXT, fontWeight: "700" }}
          />
        </Modal>

        <Modal
          visible={showEditModal}
          onClose={closeEditPhaseModal}
          animationType="fade"
          backdropStyle={styles.modalBackdrop}
          contentStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              Edit Life Phase
            </Text>
            <TouchableOpacity
              onPress={closeEditPhaseModal}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close edit life phase"
            >
              <MaterialCommunityIcons name="close" size={28} color={PAGE_BORDER} />
            </TouchableOpacity>
          </View>

          <Text style={[theme.typography.body, styles.modalSubtitle, { color: PAGE_MUTED }]}>
            Update your current chapter details.
          </Text>

          <Controller
            control={editControl}
            name="name"
            render={({ field: { onChange, value } }) => (
              <>
                <Text style={[theme.typography.labelSm, styles.modalFieldLabel, { color: PAGE_TEXT }]}>
                  LIFE PHASE NAME
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. College Years, New Job"
                  placeholderTextColor={PAGE_MUTED}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: "#F8F6F2",
                      color: PAGE_TEXT,
                      shadowColor: PAGE_TEXT,
                    },
                  ]}
                  accessibilityLabel="Edit life phase name input"
                />
              </>
            )}
          />
          {editErrors.name?.message ? (
            <Text style={styles.fieldErrorText}>{editErrors.name.message}</Text>
          ) : null}

          <Controller
            control={editControl}
            name="description"
            render={({ field: { onChange, value } }) => (
              <>
                <Text style={[theme.typography.labelSm, styles.modalFieldLabel, { color: PAGE_TEXT }]}>
                  DESCRIPTION (OPTIONAL)
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Add details about this life phase..."
                  placeholderTextColor={PAGE_MUTED}
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    {
                      backgroundColor: "#F8F6F2",
                      color: PAGE_TEXT,
                      shadowColor: PAGE_TEXT,
                    },
                  ]}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Edit life phase description input"
                />
              </>
            )}
          />

          <View style={styles.modalActions}>
            <Button
              label="Cancel"
              onPress={closeEditPhaseModal}
              variant="primary"
              style={[
                styles.modalSecondaryButton,
                { borderRadius: 999, backgroundColor: ACTION_CANCEL_BG, borderColor: ACTION_CANCEL_BORDER },
              ]}
              textStyle={{ color: ACTION_CANCEL_TEXT, fontWeight: "700" }}
            />
            <Button
              label={isLoading ? "Saving..." : "Save"}
              onPress={handleEditSubmit(onSubmitEditPhase)}
              disabled={isLoading}
              variant="primary"
              style={[
                styles.modalPrimaryButton,
                { borderRadius: 999, backgroundColor: PAGE_SECONDARY },
              ]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
            />
          </View>
        </Modal>

        <AppBottomNav currentRoute="/life-phases" />
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "300",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 230,
  },
  heroBlock: {
    marginTop: 6,
    marginBottom: 30,
  },
  heroTitlePrimary: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
  },
  heroTitleSecondary: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
    marginTop: 2,
  },
  primaryAction: {
    minHeight: 92,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    marginBottom: 24,
  },
  primaryActionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  primaryActionCopy: {
    flex: 1,
  },
  primaryActionIcon: {
    color: "#F8F6F2",
    fontSize: 32,
    lineHeight: 32,
  },
  primaryActionText: {
    color: "#F8F6F2",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "300",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionHeaderText: {
    textTransform: "uppercase",
    letterSpacing: 2.6,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 14,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    opacity: 0.7,
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 28,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  phaseCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginBottom: 18,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    minHeight: 106,
  },
  phaseIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  phaseInfo: {
    flex: 1,
  },
  exampleCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginBottom: 18,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    minHeight: 106,
  },
  exampleIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  exampleInfo: {
    flex: 1,
  },
  modalBackdrop: {
    padding: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  modalContent: {
    width: "100%",
    borderRadius: 28,
    padding: 24,
    backgroundColor: PAGE_SURFACE,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "400",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    lineHeight: 22,
    marginBottom: 16,
  },
  modalFieldLabel: {
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  modalInput: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 14,
  },
  modalTextArea: {
    minHeight: 112,
    paddingTop: 14,
  },
  fieldErrorText: {
    color: "#A6544E",
    marginTop: -6,
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: PAGE_SURFACE,
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 52,
  },
  phaseName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "300",
  },
  phaseDescription: {
    marginTop: 4,
  },
  phaseStatus: {
    width: 28,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  currentPhaseMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  actionModal: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: PAGE_SURFACE,
  },
  actionTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
    marginBottom: 6,
  },
  actionSubtitle: {
    marginBottom: 14,
    lineHeight: 22,
  },
  actionButton: {
    minHeight: 52,
    borderRadius: 999,
    marginBottom: 10,
  },
  actionEditButton: {
    backgroundColor: "#DFE8D9",
    borderColor: "#C9D8C0",
  },
  helperText: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    lineHeight: 28,
    textAlign: "center",
    fontSize: 18,
    fontStyle: "italic",
  },
});
