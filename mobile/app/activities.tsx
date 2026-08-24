import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { ActivityScore, ActivityReason } from '@/types/weather';
import { useWeatherStore } from '@/store/weatherStore';
import { calculateActivityScores } from '@/utils/activityScore';
import { Card } from '@/components/common/Card';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatusBadge } from '@/components/common/StatusBadge';


const ICON_MAP: Record<string, string> = {
  bike: 'bicycle',
  mountain: 'terrain',
  activity: 'fitness',
  footprints: 'walk',
  camera: 'camera',
  'hard-hat': 'construct',
  umbrella: 'sunny',
  tent: 'home',
};


function getScoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.warning;
  if (score >= 40) return Colors.orange;
  return Colors.danger;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Excellent': return Colors.success;
    case 'Good': return Colors.lime;
    case 'Fair': return Colors.warning;
    case 'Poor': return Colors.orange;
    default: return Colors.danger;
  }
}

function getReasonDotColor(type: ActivityReason['type']): string {
  switch (type) {
    case 'positive': return Colors.success;
    case 'warning': return Colors.warning;
    case 'negative': return Colors.danger;
  }
}

function getOverallStatus(avg: number): string {
  if (avg >= 80) return 'Excellent';
  if (avg >= 60) return 'Good';
  if (avg >= 40) return 'Fair';
  return 'Poor';
}


export default function ActivitiesScreen() {
  const weatherData = useWeatherStore((s) => s.weatherData);
  const selectedActivityId = useWeatherStore((s) => s.selectedActivityId);
  const setSelectedActivity = useWeatherStore((s) => s.setSelectedActivity);

  const activities = useMemo<ActivityScore[]>(() => {
    if (!weatherData) return [];
    return calculateActivityScores(
      weatherData.current,
      weatherData.hourly,
      weatherData.daily,
    );
  }, [weatherData]);

  const averageScore = useMemo(() => {
    if (activities.length === 0) return 0;
    return Math.round(activities.reduce((s, a) => s + a.score, 0) / activities.length);
  }, [activities]);

  const bestActivity = activities[0] ?? null;
  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );


  if (!weatherData) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.headerTitle}>Activities</Text>
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Load a location first</Text>
            <Text style={styles.emptySubtitle}>
              Search for a city to see activity recommendations.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }


  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.headerTitle}>Activities</Text>

          {/* Selected Activity Detail */}
          {selectedActivity && (
            <Card style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <Ionicons
                    name={(ICON_MAP[selectedActivity.icon] ?? 'fitness-outline') as any}
                    size={24}
                    color={Colors.text}
                  />
                  <Text style={styles.detailName}>{selectedActivity.name}</Text>
                </View>
                <View style={styles.detailHeaderRight}>
                  <StatusBadge
                    label={selectedActivity.status}
                    color={getStatusColor(selectedActivity.status)}
                  />
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedActivity(null)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Close activity details"
                  >
                    <Ionicons name="close" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Score display */}
              <View style={styles.detailScoreRow}>
                <Text style={[styles.detailScore, { color: getScoreColor(selectedActivity.score) }]}>
                  {selectedActivity.score}
                </Text>
                <Text style={styles.detailScoreLabel}>/100</Text>
              </View>
              <ProgressBar
                value={selectedActivity.score}
                color={getScoreColor(selectedActivity.score)}
                height={8}
                style={styles.detailBar}
              />

              {/* Reasons */}
              <View style={styles.reasonsContainer} accessibilityLabel={`Reasons: ${selectedActivity.reasons.map(r => r.text).join('; ')}`}>
                {selectedActivity.reasons.map((r, i) => (
                  <View key={i} style={styles.reasonRow} accessibilityLabel={`${r.type}: ${r.text}`} accessibilityRole="text">
                    <View
                      style={[styles.reasonDot, { backgroundColor: getReasonDotColor(r.type) }]}
                    />
                    <Text style={styles.reasonText}>{r.text}</Text>
                  </View>
                ))}
              </View>

              {/* Times */}
              <View style={styles.timesContainer}>
                {selectedActivity.bestTime && (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.success} />
                    <Text style={styles.timeLabel}>Best time: </Text>
                    <Text style={styles.timeValue}>{selectedActivity.bestTime}</Text>
                  </View>
                )}
                {selectedActivity.avoidTime && (
                  <View style={styles.timeRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.orange} />
                    <Text style={styles.timeLabel}>Avoid: </Text>
                    <Text style={styles.timeValue}>
                      {selectedActivity.avoidTime}
                      {selectedActivity.avoidReason ? ` ${selectedActivity.avoidReason}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Overall Score Card (stand-alone, no Card wrapper) */}
          <View style={styles.overallCard} accessibilityLabel={`Overall Activity Score ${averageScore} out of 100, ${getOverallStatus(averageScore)}${bestActivity ? `. Best activity: ${bestActivity.name}` : ''}`}>
            <View style={styles.overallInner}>
              <Text style={styles.overallLabel}>Overall Activity Score</Text>
              <View style={styles.overallScoreRow}>
                <Text style={[styles.overallScore, { color: getScoreColor(averageScore) }]}>
                  {averageScore}
                </Text>
                <Text style={styles.overallScoreLabel}>/100</Text>
              </View>
              <StatusBadge
                label={getOverallStatus(averageScore)}
                color={getScoreColor(averageScore)}
              />
              {bestActivity && (
                <Text style={styles.overallSummary}>
                  Best activity: {bestActivity.name} ({bestActivity.score}/100)
                </Text>
              )}
            </View>
          </View>

          {/* Activity List */}
          <View style={styles.activityList}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedActivity(
                    selectedActivityId === activity.id ? null : activity.id,
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`${activity.name}, score ${activity.score} out of 100, ${activity.status}`}
                accessibilityHint={selectedActivityId === activity.id ? 'Tap to collapse details' : 'Tap to expand details'}
              >
                <Card style={styles.activityCard}>
                  {/* Top row: icon + name + score + badge */}
                  <View style={styles.activityTop}>
                    <View style={styles.activityInfo}>
                      <Ionicons
                        name={(ICON_MAP[activity.icon] ?? 'fitness-outline') as any}
                        size={22}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.activityName}>{activity.name}</Text>
                    </View>
                    <View style={styles.activityRight}>
                      <Text
                        style={[styles.activityScore, { color: getScoreColor(activity.score) }]}
                      >
                        {activity.score}
                      </Text>
                      <StatusBadge
                        label={activity.status}
                        color={getStatusColor(activity.status)}
                      />
                    </View>
                  </View>

                  {/* Progress bar */}
                  <ProgressBar
                    value={activity.score}
                    color={getScoreColor(activity.score)}
                    height={6}
                    style={styles.activityBar}
                  />

                  {/* Reasons */}
                  <View style={styles.reasonsContainer} accessibilityLabel={`Reasons: ${activity.reasons.map(r => r.text).join('; ')}`}>
                    {activity.reasons.map((r, i) => (
                      <View key={i} style={styles.reasonRow} accessibilityLabel={`${r.type}: ${r.text}`} accessibilityRole="text">
                        <View
                          style={[styles.reasonDot, { backgroundColor: getReasonDotColor(r.type) }]}
                        />
                        <Text style={styles.reasonText}>{r.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Best / Avoid times */}
                  {(activity.bestTime || activity.avoidTime) && (
                    <View style={styles.timesContainer}>
                      {activity.bestTime && (
                        <Text style={styles.timeMuted}>
                          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />{' '}
                          Best: {activity.bestTime}
                        </Text>
                      )}
                      {activity.avoidTime && (
                        <Text style={styles.timeMuted}>
                          <Ionicons name="alert-circle-outline" size={12} color={Colors.textMuted} />{' '}
                          Avoid: {activity.avoidTime}
                        </Text>
                      )}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },

  // Header
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  // Overall Score Card (stand-alone)
  overallCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  overallInner: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  overallLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  overallScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overallScore: {
    fontSize: 64,
    fontWeight: Typography.weights.bold,
    lineHeight: 68,
  },
  overallScoreLabel: {
    fontSize: Typography.sizes.xl,
    color: Colors.textMuted,
  },
  overallSummary: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },

  // Selected Activity Detail
  detailCard: {
    marginBottom: Spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  detailHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.md,
  },
  detailScore: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  detailScoreLabel: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
  },
  detailBar: {
    marginTop: Spacing.md,
  },

  // Reasons
  reasonsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reasonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Times
  timesContainer: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  timeValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  timeMuted: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  // Activity list
  activityList: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  activityCard: {
    paddingVertical: Spacing.lg,
  },
  activityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  activityName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  activityScore: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  activityBar: {
    marginTop: Spacing.md,
  },

  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
