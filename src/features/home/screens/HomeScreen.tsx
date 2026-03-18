import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useEffect } from 'react';
import { useTheme } from '@styles/theme';
import { useAuthStore } from '@store';
import { useEntries } from '@features/entries/hooks/useEntries';
import { useDrawers } from '@features/drawers/hooks/useDrawers';
import { useLifePhase } from '../hooks/useLifePhase';
import { Screen, SafeArea } from '@components/layout';
import { Button } from '@components/ui';

interface GroupedEntries {
  [date: string]: any[];
}

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { entries, isLoading: entriesLoading, fetchRecentEntries } = useEntries();
  const { drawers, isLoading: drawersLoading, fetchDrawers } = useDrawers();
  const { activePhase, isLoading: phaseLoading, fetchActivePhase } = useLifePhase();

  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({});

  // Fetch data on screen focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchActivePhase();
        fetchRecentEntries();
        fetchDrawers();
      }
    }, [user, fetchActivePhase, fetchRecentEntries, fetchDrawers])
  );

  // Group entries by date
  useEffect(() => {
    const grouped: GroupedEntries = {};
    entries.forEach((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    setGroupedEntries(grouped);
  }, [entries]);

  const handleNewEntry = useCallback(() => {
    navigation.navigate('CreateEntry' as never);
  }, [navigation]);

  const handleSearch = useCallback(() => {
    navigation.navigate('Search' as never);
  }, [navigation]);

  const handleSetLifePhase = useCallback(() => {
    navigation.navigate('LifePhases' as never);
  }, [navigation]);

  const handleCreateFirstEntry = useCallback(() => {
    navigation.navigate('CreateEntry' as never);
  }, [navigation]);

  const handleEntryPress = useCallback(
    (entryId: string) => {
      navigation.navigate('EntryDetail' as never, { entryId } as never);
    },
    [navigation]
  );

  const handleDrawerPress = useCallback(
    (drawerId: string) => {
      navigation.navigate('DrawerDetail' as never, { drawerId } as never);
    },
    [navigation]
  );

  const isLoading = entriesLoading || drawersLoading || phaseLoading;

  return (
    <SafeArea>
      <Screen style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessible
            accessibilityLabel="Menu"
            accessibilityRole="button"
          >
            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
              ☰
            </Text>
          </TouchableOpacity>
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
            Home
          </Text>
          <TouchableOpacity
            onPress={handleSetLifePhase}
            accessible
            accessibilityLabel={
              activePhase ? `Current life phase: ${activePhase.name}` : 'Set life phase'
            }
            accessibilityHint="Tap to set or change your current life phase"
            accessibilityRole="button"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  fontWeight: '500',
                  fontSize: 14,
                },
              ]}
            >
              {activePhase ? activePhase.name : 'Set Life Phase'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.newEntryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleNewEntry}
                accessible
                accessibilityLabel="Create new entry"
                accessibilityHint="Open entry creation screen"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    theme.typography.h3,
                    {
                      color: theme.colors.background,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  +
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.background,
                      fontWeight: '600',
                    },
                  ]}
                >
                  New Entry
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.searchButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleSearch}
                accessible
                accessibilityLabel="Search entries"
                accessibilityHint="Open search and filter screen"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    theme.typography.h3,
                    {
                      color: theme.colors.background,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  🔍
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.background,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Search
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recent Entries Section */}
            <View style={styles.section}>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  },
                ]}
              >
                Recent Entries
              </Text>

              {entries.length === 0 ? (
                // Empty State
                <View
                  style={[
                    styles.emptyState,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIcon,
                      {
                        backgroundColor: theme.colors.primary + '15',
                      },
                    ]}
                  >
                    <Text style={styles.emptyIconText}>✏️</Text>
                  </View>
                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: theme.colors.text,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    No entries yet
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        marginBottom: theme.spacing.lg,
                        lineHeight: 22,
                      },
                    ]}
                  >
                    Your journey starts here. Capture your first moment whenever you're
                    ready.
                  </Text>
                  <Button
                    label="+ Create First Entry"
                    onPress={handleCreateFirstEntry}
                    accessibilityLabel="Create first entry button"
                    accessibilityRole="button"
                  />
                </View>
              ) : (
                // Entries List
                <View>
                  {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                    <View key={date} style={styles.dateGroup}>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          {
                            color: theme.colors.textSecondary,
                            marginBottom: theme.spacing.md,
                            fontWeight: '500',
                          },
                        ]}
                      >
                        {date}
                      </Text>
                      {(dateEntries as any[]).map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={[
                            styles.entryCard,
                            { borderColor: theme.colors.border },
                          ]}
                          onPress={() => handleEntryPress(entry.id)}
                          accessible
                          accessibilityLabel={`Entry: ${entry.title || 'Untitled'}`}
                          accessibilityHint={`Created on ${new Date(entry.createdAt).toLocaleDateString()}`}
                          accessibilityRole="button"
                        >
                          <View style={styles.entryHeader}>
                            <Text
                              style={[
                                theme.typography.h3,
                                {
                                  color: theme.colors.text,
                                  flex: 1,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {entry.title || 'Untitled Entry'}
                            </Text>
                            {entry.mood && (
                              <Text
                                style={[theme.typography.body]}
                                accessible
                                accessibilityLabel={`Mood: ${entry.mood}`}
                              >
                                {entry.mood}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              theme.typography.bodySm,
                              {
                                color: theme.colors.textSecondary,
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {entry.content}
                          </Text>
                          {entry.drawers && entry.drawers.length > 0 && (
                            <View style={styles.entryTags}>
                              {entry.drawers.map((drawer: any) => (
                                <View
                                  key={drawer.id}
                                  style={[
                                    styles.tag,
                                    {
                                      backgroundColor: drawer.color + '20',
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      theme.typography.labelXs,
                                      { color: drawer.color },
                                    ]}
                                  >
                                    {drawer.name}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recently Opened Drawers Section */}
            <View style={styles.section}>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  },
                ]}
              >
                Recently Opened Drawers
              </Text>

              {drawers.length === 0 ? (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: theme.colors.gray[100] },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.bodySm,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    You can create custom drawers anytime to organize your entries by
                    theme or topic
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={drawers.slice(0, 5)}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item: drawer }) => (
                    <TouchableOpacity
                      style={[
                        styles.drawerCard,
                        { borderColor: theme.colors.border },
                      ]}
                      onPress={() => handleDrawerPress(drawer.id)}
                      accessible
                      accessibilityLabel={`Drawer: ${drawer.name}`}
                      accessibilityHint={`${drawer.entryCount} entries`}
                      accessibilityRole="button"
                    >
                      <View
                        style={[
                          styles.drawerIcon,
                          {
                            backgroundColor: drawer.color || theme.colors.primary,
                          },
                        ]}
                      >
                        <Text style={styles.drawerIconText}>
                          {drawer.icon || '📦'}
                        </Text>
                      </View>
                      <View style={styles.drawerInfo}>
                        <Text
                          style={[
                            theme.typography.h3,
                            { color: theme.colors.text },
                          ]}
                        >
                          {drawer.name}
                        </Text>
                        <Text
                          style={[
                            theme.typography.bodySm,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {drawer.entryCount} entries
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

              {drawers.length === 0 && (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: theme.colors.gray[100] },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.bodySm,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    You can create custom drawers anytime to organize your entries by
                    theme or topic
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
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
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  newEntryButton: {},
  searchButton: {},
  section: {
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 40,
  },
  dateGroup: {
    marginBottom: 20,
  },
  entryCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  drawerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  drawerIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drawerIconText: {
    fontSize: 24,
  },
  drawerInfo: {
    flex: 1,
  },
  infoBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});