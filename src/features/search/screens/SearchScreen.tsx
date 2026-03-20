import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useMemo } from 'react';
import { useTheme } from '@styles/theme';
import { useEntries } from '../hooks/useEntries';
import { MOOD_MAP, type MoodValue } from '@constants/moods';
import { Screen, SafeArea } from '@components/layout';
import { Button } from '@components/ui';

type FilterType = 'all' | 'mood' | 'drawer' | 'tag' | 'date';

interface SearchFilters {
  mood: MoodValue | null;
  drawer: string | null;
  tag: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { entries, isLoading, fetchEntries } = useEntries();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filters, setFilters] = useState<SearchFilters>({
    mood: null,
    drawer: null,
    tag: null,
    dateRange: 'all',
  });
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries])
  );

  // Filter entries based on search term and filters
  const filteredEntries = useMemo(() => {
    if (!entries) return [];

    let results = entries.filter((entry) => {
      // Search term filter (title + content)
      const matchesSearchTerm =
        searchTerm === '' ||
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearchTerm) return false;

      // Mood filter
      if (filters.mood && entry.mood !== filters.mood) return false;

      // Drawer filter
      if (
        filters.drawer &&
        !entry.drawers?.some((d) => d.id === filters.drawer)
      ) {
        return false;
      }

      // Tag filter
      if (filters.tag && !entry.tags?.some((t) => t.id === filters.tag)) {
        return false;
      }

      // Date range filter
      const entryDate = new Date(entry.createdAt);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (filters.dateRange === 'today' && entryDate < startOfDay) {
        return false;
      }
      if (filters.dateRange === 'week' && entryDate < startOfWeek) {
        return false;
      }
      if (filters.dateRange === 'month' && entryDate < startOfMonth) {
        return false;
      }

      return true;
    });

    return results;
  }, [entries, searchTerm, filters]);

  const handleEntryPress = useCallback(
    (entryId: string) => {
      navigation.navigate('EntryDetail', { entryId } as any);
    },
    [navigation]
  );

  const handleMoodFilterChange = useCallback((mood: MoodValue | null) => {
    setFilters((prev) => ({ ...prev, mood }));
  }, []);

  const handleDrawerFilterChange = useCallback((drawerId: string | null) => {
    setFilters((prev) => ({ ...prev, drawer: drawerId }));
  }, []);

  const handleTagFilterChange = useCallback((tagId: string | null) => {
    setFilters((prev) => ({ ...prev, tag: tagId }));
  }, []);

  const handleDateRangeChange = useCallback(
    (range: 'all' | 'today' | 'week' | 'month') => {
      setFilters((prev) => ({ ...prev, dateRange: range }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      mood: null,
      drawer: null,
      tag: null,
      dateRange: 'all',
    });
    setSearchTerm('');
  }, []);

  const getUniqueDrawers = useMemo(() => {
    const drawerMap = new Map();
    entries?.forEach((entry) => {
      entry.drawers?.forEach((drawer) => {
        drawerMap.set(drawer.id, drawer);
      });
    });
    return Array.from(drawerMap.values());
  }, [entries]);

  const getUniqueTags = useMemo(() => {
    const tagMap = new Map();
    entries?.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        tagMap.set(tag.id, tag);
      });
    });
    return Array.from(tagMap.values());
  }, [entries]);

  const hasActiveFilters =
    filters.mood ||
    filters.drawer ||
    filters.tag ||
    filters.dateRange !== 'all' ||
    searchTerm !== '';

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

  return (
    <SafeArea>
      <Screen style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
            Search Entries
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} accessible accessibilityLabel="Clear filters">
              <Text style={[theme.typography.bodySm, { color: theme.colors.primary }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.colors.text },
            ]}
            placeholder="Search by title or content..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            accessibilityLabel="Search entries"
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === 'all' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            accessible
            accessibilityLabel="All entries filter"
            accessibilityRole="button"
          >
            <Text
              style={[
                theme.typography.labelSm,
                {
                  color:
                    activeFilter === 'all' ? theme.colors.background : theme.colors.text,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('mood')}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === 'mood' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            accessible
            accessibilityLabel="Filter by mood"
            accessibilityRole="button"
          >
            <Text
              style={[
                theme.typography.labelSm,
                {
                  color:
                    activeFilter === 'mood' ? theme.colors.background : theme.colors.text,
                },
              ]}
            >
              Mood
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('drawer')}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === 'drawer' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            accessible
            accessibilityLabel="Filter by drawer"
            accessibilityRole="button"
          >
            <Text
              style={[
                theme.typography.labelSm,
                {
                  color:
                    activeFilter === 'drawer'
                      ? theme.colors.background
                      : theme.colors.text,
                },
              ]}
            >
              Drawer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('tag')}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === 'tag' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            accessible
            accessibilityLabel="Filter by tag"
            accessibilityRole="button"
          >
            <Text
              style={[
                theme.typography.labelSm,
                {
                  color:
                    activeFilter === 'tag' ? theme.colors.background : theme.colors.text,
                },
              ]}
            >
              Tag
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('date')}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === 'date' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            accessible
            accessibilityLabel="Filter by date"
            accessibilityRole="button"
          >
            <Text
              style={[
                theme.typography.labelSm,
                {
                  color:
                    activeFilter === 'date' ? theme.colors.background : theme.colors.text,
                },
              ]}
            >
              Date
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filter Options */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {activeFilter === 'mood' && (
            <View>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                Filter by Mood
              </Text>
              <TouchableOpacity
                onPress={() => handleMoodFilterChange(null)}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor:
                      filters.mood === null ? theme.colors.primary + '20' : theme.colors.surface,
                    borderColor:
                      filters.mood === null ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                accessible
                accessibilityLabel="Clear mood filter"
                accessibilityRole="button"
              >
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  All Moods
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(MOOD_MAP).map(([moodKey, moodData]) => (
                  <TouchableOpacity
                    key={moodKey}
                    onPress={() =>
                      handleMoodFilterChange(
                        filters.mood === (moodKey as MoodValue) ? null : (moodKey as MoodValue)
                      )
                    }
                    style={[
                      styles.moodFilterOption,
                      {
                        backgroundColor:
                          filters.mood === moodKey
                            ? theme.colors.primary + '30'
                            : theme.colors.surface,
                        borderColor:
                          filters.mood === moodKey ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    accessible
                    accessibilityLabel={`Filter by ${moodData.label}`}
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 24 }}>{moodData.emoji}</Text>
                    <Text
                      style={[
                        theme.typography.bodySm,
                        { color: theme.colors.text, marginTop: 4 },
                      ]}
                    >
                      {moodData.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeFilter === 'drawer' && (
            <View>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                Filter by Drawer
              </Text>
              <TouchableOpacity
                onPress={() => handleDrawerFilterChange(null)}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor:
                      filters.drawer === null
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                    borderColor:
                      filters.drawer === null ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                accessible
                accessibilityLabel="Clear drawer filter"
                accessibilityRole="button"
              >
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  All Drawers
                </Text>
              </TouchableOpacity>
              {getUniqueDrawers.map((drawer) => (
                <TouchableOpacity
                  key={drawer.id}
                  onPress={() =>
                    handleDrawerFilterChange(
                      filters.drawer === drawer.id ? null : drawer.id
                    )
                  }
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor:
                        filters.drawer === drawer.id
                          ? theme.colors.primary + '20'
                          : theme.colors.surface,
                      borderColor:
                        filters.drawer === drawer.id ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`Filter by ${drawer.name}`}
                  accessibilityRole="button"
                >
                  <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                    📁 {drawer.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {getUniqueDrawers.length === 0 && (
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
                  ]}
                >
                  No drawers found
                </Text>
              )}
            </View>
          )}

          {activeFilter === 'tag' && (
            <View>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                Filter by Tag
              </Text>
              <TouchableOpacity
                onPress={() => handleTagFilterChange(null)}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor:
                      filters.tag === null
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                    borderColor:
                      filters.tag === null ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                accessible
                accessibilityLabel="Clear tag filter"
                accessibilityRole="button"
              >
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  All Tags
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {getUniqueTags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() =>
                      handleTagFilterChange(filters.tag === tag.id ? null : tag.id)
                    }
                    style={[
                      styles.tagFilterOption,
                      {
                        backgroundColor:
                          filters.tag === tag.id ? theme.colors.primary + '30' : tag.color + '20',
                        borderColor: filters.tag === tag.id ? theme.colors.primary : tag.color,
                      },
                    ]}
                    accessible
                    accessibilityLabel={`Filter by ${tag.name}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        theme.typography.bodySm,
                        { color: filters.tag === tag.id ? theme.colors.primary : tag.color },
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {getUniqueTags.length === 0 && (
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
                  ]}
                >
                  No tags found
                </Text>
              )}
            </View>
          )}

          {activeFilter === 'date' && (
            <View>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                Filter by Date
              </Text>
              {(['all', 'today', 'week', 'month'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  onPress={() => handleDateRangeChange(range)}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor:
                        filters.dateRange === range
                          ? theme.colors.primary + '20'
                          : theme.colors.surface,
                      borderColor:
                        filters.dateRange === range ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`Filter by ${range}`}
                  accessibilityRole="button"
                >
                  <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                    {range === 'all' && '📅 All Time'}
                    {range === 'today' && '📅 Today'}
                    {range === 'week' && '📅 This Week'}
                    {range === 'month' && '📅 This Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={[theme.typography.labelSm, { color: theme.colors.textSecondary }]}>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'Result' : 'Results'}
          </Text>
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[theme.typography.h3, { color: theme.colors.textSecondary }]}>
              No entries found
            </Text>
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  marginTop: theme.spacing.md,
                  textAlign: 'center',
                },
              ]}
            >
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Start creating entries to see them here'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.entryCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={() => handleEntryPress(item.id)}
                accessible
                accessibilityLabel={`Entry: ${item.title}`}
                accessibilityRole="button"
              >
                <View style={styles.entryHeader}>
                  <Text
                    numberOfLines={1}
                    style={[theme.typography.h4, { color: theme.colors.text, flex: 1 }]}
                  >
                    {item.title}
                  </Text>
                  {item.mood && (
                    <Text style={{ fontSize: 18, marginLeft: 8 }}>
                      {MOOD_MAP[item.mood as MoodValue]?.emoji}
                    </Text>
                  )}
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    theme.typography.bodySm,
                    {
                      color: theme.colors.textSecondary,
                      marginVertical: theme.spacing.sm,
                    },
                  ]}
                >
                  {item.content}
                </Text>

                <Text
                  style={[
                    theme.typography.labelXs,
                    { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                  ]}
                >
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>

                {(item.tags?.length || 0) > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {item.tags?.map((tag) => (
                      <View
                        key={tag.id}
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: tag.color + '30',
                            borderColor: tag.color,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            theme.typography.labelXs,
                            { color: tag.color },
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.entriesList}
          />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterTabs: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  moodFilterOption: {
    flex: 0,
    width: '23%',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  tagFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  entriesList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  entryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});