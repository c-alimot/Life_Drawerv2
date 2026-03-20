import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTheme } from '@styles/theme';
import { useEntryDetail } from '../hooks/useEntryDetail';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { MOOD_MAP, type MoodValue } from '@constants/mood';
import { Screen, SafeArea } from '@components/layout';
import { Button } from '@components/ui';

type TabType = 'content' | 'media' | 'details';

export function EntryDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { entryId } = route.params as { entryId: string };
  const { entry, isLoading, fetchEntry, deleteEntry, unlinkDrawer, unlinkTag } =
    useEntryDetail(entryId);
  const { isPlaying, duration, position, play } = useAudioPlayer(
    entry?.audioUrl || null
  );

  const [activeTab, setActiveTab] = useState<TabType>('content');

  useFocusEffect(
    useCallback(() => {
      fetchEntry();
    }, [fetchEntry])
  );

  const handleEdit = useCallback(() => {
    navigation.navigate('EditEntry' as never, { entryId } as never);
  }, [navigation, entryId]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          const success = await deleteEntry();
          if (success) {
            Alert.alert('Success', 'Entry deleted');
            navigation.goBack();
          } else {
            Alert.alert('Error', 'Failed to delete entry');
          }
        },
        style: 'destructive',
      },
    ]);
  }, [deleteEntry, navigation]);

  const handleRemoveDrawer = useCallback(
    (drawerId: string) => {
      Alert.alert('Remove Drawer', 'Remove this entry from this drawer?', [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            await unlinkDrawer(drawerId);
          },
          style: 'destructive',
        },
      ]);
    },
    [unlinkDrawer]
  );

  const handleRemoveTag = useCallback(
    (tagId: string) => {
      Alert.alert('Remove Tag', 'Remove this tag from the entry?', [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            await unlinkTag(tagId);
          },
          style: 'destructive',
        },
      ]);
    },
    [unlinkTag]
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeArea>
        <Screen style={styles.container}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Screen>
      </SafeArea>
    );
  }

  if (!entry) {
    return (
      <SafeArea>
        <Screen style={styles.container}>
          <View style={styles.loaderContainer}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Entry not found
            </Text>
          </View>
        </Screen>
      </SafeArea>
    );
  }

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <SafeArea>
      <Screen style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} accessible accessibilityLabel="Go back">
            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <Button
              label="Edit"
              onPress={handleEdit}
              size="sm"
              accessibilityLabel="Edit entry"
            />
            <TouchableOpacity
              onPress={handleDelete}
              accessible
              accessibilityLabel="Delete entry"
              style={{ marginLeft: theme.spacing.sm }}
            >
              <Text style={[theme.typography.body, { color: theme.colors.error }]}>
                🗑️
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('content')}
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === 'content' ? theme.colors.primary : 'transparent',
              },
            ]}
            accessible
            accessibilityLabel="Content tab"
            accessibilityRole="tab"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color:
                    activeTab === 'content' ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: activeTab === 'content' ? '600' : '400',
                },
              ]}
            >
              Content
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('media')}
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === 'media' ? theme.colors.primary : 'transparent',
              },
            ]}
            accessible
            accessibilityLabel="Media tab"
            accessibilityRole="tab"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color:
                    activeTab === 'media' ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: activeTab === 'media' ? '600' : '400',
                },
              ]}
            >
              Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('details')}
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === 'details' ? theme.colors.primary : 'transparent',
              },
            ]}
            accessible
            accessibilityLabel="Details tab"
            accessibilityRole="tab"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color:
                    activeTab === 'details' ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: activeTab === 'details' ? '600' : '400',
                },
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Content Tab */}
          {activeTab === 'content' && (
            <View>
              <Text
                style={[
                  theme.typography.h2,
                  { color: theme.colors.text, marginBottom: theme.spacing.sm },
                ]}
              >
                {entry.title}
              </Text>

              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                {formattedDate}
              </Text>

              {entry.mood && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: theme.spacing.sm }}>
                    {MOOD_MAP[entry.mood as MoodValue]?.emoji}
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {MOOD_MAP[entry.mood as MoodValue]?.label}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.text,
                    lineHeight: 24,
                  },
                ]}
              >
                {entry.content}
              </Text>
            </View>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <View>
              {/* Images */}
              {entry.images && entry.images.length > 0 && (
                <View style={{ marginBottom: theme.spacing.xl }}>
                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: theme.colors.text,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    Images
                  </Text>
                  <FlatList
                    data={entry.images}
                    keyExtractor={(_, index) => `image-${index}`}
                    horizontal
                    scrollEnabled
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: imageUri }) => (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.detailImage}
                        accessible
                        accessibilityLabel="Entry image"
                      />
                    )}
                  />
                </View>
              )}

              {/* Audio */}
              {entry.audioUrl && (
                <View style={{ marginBottom: theme.spacing.xl }}>
                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: theme.colors.text,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    Voice Memo
                  </Text>
                  <View
                    style={[
                      styles.audioPlayer,
                      { borderColor: theme.colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={play}
                      style={[
                        styles.playButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      accessible
                      accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                      accessibilityRole="button"
                    >
                      <Text style={styles.playButtonText}>
                        {isPlaying ? '⏸️' : '▶️'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.audioInfo}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.colors.gray[200] },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: theme.colors.primary,
                              width: `${progressPercent}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {Math.floor(position / 1000)}s / {Math.floor(duration / 1000)}s
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <View>
              {/* Location */}
              {entry.location && (
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      {
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.sm,
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    Location
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.text },
                    ]}
                  >
                    📍 {entry.location.address || `${entry.location.latitude.toFixed(4)}, ${entry.location.longitude.toFixed(4)}`}
                  </Text>
                </View>
              )}

              {/* Drawers */}
              {entry.drawers && entry.drawers.length > 0 && (
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      {
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.sm,
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    Drawers
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {entry.drawers.map((drawer) => (
                      <TouchableOpacity
                        key={drawer.id}
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: drawer.color + '20',
                            borderColor: drawer.color,
                          },
                        ]}
                        onLongPress={() => handleRemoveDrawer(drawer.id)}
                        accessible
                        accessibilityLabel={`Drawer: ${drawer.name}`}
                        accessibilityHint="Long press to remove"
                      >
                        <Text
                          style={[
                            theme.typography.bodySm,
                            { color: drawer.color },
                          ]}
                        >
                          {drawer.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      {
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.sm,
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    Tags
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {entry.tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: tag.color + '20',
                            borderColor: tag.color,
                          },
                        ]}
                        onLongPress={() => handleRemoveTag(tag.id)}
                        accessible
                        accessibilityLabel={`Tag: ${tag.name}`}
                        accessibilityHint="Long press to remove"
                      >
                        <Text
                          style={[
                            theme.typography.bodySm,
                            { color: tag.color },
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Author */}
              {entry.author && (
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      {
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.sm,
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    Author
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.text },
                    ]}
                  >
                    {entry.author.displayName || entry.author.email}
                  </Text>
                </View>
              )}

              {/* Created/Updated */}
              <View>
                <Text
                  style={[
                    theme.typography.labelSm,
                    {
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.sm,
                      textTransform: 'uppercase',
                    },
                  ]}
                >
                  Dates
                </Text>
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
                  ]}
                >
                  Created: {new Date(entry.createdAt).toLocaleString()}
                </Text>
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Updated: {new Date(entry.updatedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playButtonText: {
    fontSize: 24,
  },
  audioInfo: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
});