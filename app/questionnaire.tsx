import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Purchases from 'react-native-purchases'
import { Colors, Typography, Spacing, BorderRadius, AuraColors } from '@/constants/theme'
import { QuestionnaireAnswer, generateAuraFromAnswers } from '@/lib/auraGenerator'
import { useStore, setActiveReading } from '@/lib/store'
import { log } from '@/lib/log'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─── Questions data ───────────────────────────────────────────────────────────

interface Question {
  index: number
  prompt: string
  chakraHint?: string
  options: Array<{ label: string; sublabel?: string; colorKey?: string }>
}

const QUESTIONS: Question[] = [
  {
    index: 0,
    prompt: 'How do you feel right now?',
    chakraHint: 'Your vital energy',
    options: [
      { label: 'Exhausted', sublabel: 'Running on empty' },
      { label: 'Tired', sublabel: 'Could use rest' },
      { label: 'Neutral', sublabel: 'Just existing' },
      { label: 'Energized', sublabel: 'Ready to move' },
      { label: 'Electric', sublabel: 'Buzzing inside' },
    ],
  },
  {
    index: 1,
    prompt: 'When you walk into a room, you tend to...',
    chakraHint: 'Your social field',
    options: [
      { label: 'Observe quietly', sublabel: 'Take it all in first' },
      { label: 'Adapt to the vibe', sublabel: 'Become what\'s needed' },
      { label: 'Bring the energy', sublabel: 'The room shifts for you' },
      { label: 'Connect one-on-one', sublabel: 'Seek the individual' },
    ],
  },
  {
    index: 2,
    prompt: 'Your greatest strength is...',
    chakraHint: 'Your core gift',
    options: [
      { label: 'Intuition', sublabel: 'You just know things' },
      { label: 'Logic', sublabel: 'Clear-eyed reasoning' },
      { label: 'Creativity', sublabel: 'Making something from nothing' },
      { label: 'Empathy', sublabel: 'Feeling others deeply' },
      { label: 'Leadership', sublabel: 'Others follow naturally' },
    ],
  },
  {
    index: 3,
    prompt: 'You feel most alive when...',
    chakraHint: 'Where your energy flows',
    options: [
      { label: 'In nature', sublabel: 'Earth beneath you' },
      { label: 'Creating something', sublabel: 'Making the new' },
      { label: 'Helping others', sublabel: 'Service as calling' },
      { label: 'Learning', sublabel: 'Expanding the mind' },
      { label: 'Achieving goals', sublabel: 'Crossing the finish line' },
    ],
  },
  {
    index: 4,
    prompt: 'Your relationship with emotions is...',
    chakraHint: 'Your inner water',
    options: [
      { label: 'I feel everything deeply', sublabel: 'Waves move through you' },
      { label: 'I think before I feel', sublabel: 'Mind leads the way' },
      { label: 'I balance heart and mind', sublabel: 'Integrated awareness' },
      { label: 'I prefer to stay practical', sublabel: 'Ground over feeling' },
    ],
  },
  {
    index: 5,
    prompt: 'What color draws you most right now?',
    chakraHint: 'Your resonant frequency',
    options: AuraColors.map(c => ({ label: c.label, sublabel: c.trait, colorKey: c.key })),
  },
  {
    index: 6,
    prompt: 'Your energy levels lately...',
    chakraHint: 'Current field state',
    options: [
      { label: 'Scattered / Depleted', sublabel: 'Fragmented, exhausted' },
      { label: 'Steady / Grounded', sublabel: 'Stable and present' },
      { label: 'Building / Rising', sublabel: 'Momentum is growing' },
      { label: 'Overflowing', sublabel: 'More than enough' },
    ],
  },
  {
    index: 7,
    prompt: 'In conflict, you...',
    chakraHint: 'Your fire response',
    options: [
      { label: 'Withdraw and reflect', sublabel: 'Space before engagement' },
      { label: 'Stand your ground', sublabel: 'Hold the line' },
      { label: 'Seek harmony', sublabel: 'Peace above all' },
      { label: 'Get fired up', sublabel: 'Intensity rises fast' },
    ],
  },
  {
    index: 8,
    prompt: 'You are drawn to...',
    chakraHint: 'Your soul\'s calling',
    options: [
      { label: 'Spiritual practices', sublabel: 'Prayer, meditation, ritual' },
      { label: 'Physical activity', sublabel: 'Body as temple' },
      { label: 'Intellectual pursuits', sublabel: 'Ideas and inquiry' },
      { label: 'Artistic expression', sublabel: 'Beauty as language' },
      { label: 'Service to others', sublabel: 'Love in action' },
    ],
  },
  {
    index: 9,
    prompt: 'Your life right now feels like...',
    chakraHint: 'Your current chapter',
    options: [
      { label: 'A storm passing', sublabel: 'Turbulence and transition' },
      { label: 'Solid ground', sublabel: 'Steady and rooted' },
      { label: 'A journey beginning', sublabel: 'Fresh horizon ahead' },
      { label: 'A peak moment', sublabel: 'Summit or fullness' },
      { label: 'A quiet river', sublabel: 'Flowing, unhurried' },
    ],
  },
]

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100
  const width = useSharedValue(0)

  React.useEffect(() => {
    width.value = withTiming(progress, { duration: 500, easing: Easing.out(Easing.quad) })
  }, [progress])

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }))

  return (
    <View style={pStyles.progressContainer}>
      <View style={pStyles.progressTrack}>
        <Animated.View style={[pStyles.progressFill, barStyle]} />
      </View>
      <Text style={pStyles.progressText}>{current} / {total}</Text>
    </View>
  )
}

const pStyles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.aura.violet,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    ...Typography.label,
    color: Colors.textMuted,
    width: 36,
    textAlign: 'right',
  },
})

// ─── Color swatch option (Q6) ─────────────────────────────────────────────────

function ColorSwatch({
  colorKey,
  label,
  sublabel,
  selected,
  onPress,
}: {
  colorKey: string
  label: string
  sublabel?: string
  selected: boolean
  onPress: () => void
}) {
  const colorHex = AuraColors.find(c => c.key === colorKey)?.hex ?? '#FFFFFF'
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    )
    onPress()
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          swatchStyles.container,
          selected && { borderColor: colorHex, backgroundColor: colorHex + '22' },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[swatchStyles.dot, { backgroundColor: colorHex }]} />
        <View style={swatchStyles.textBlock}>
          <Text style={[swatchStyles.label, selected && { color: colorHex }]}>{label}</Text>
          {sublabel && <Text style={swatchStyles.sublabel}>{sublabel}</Text>}
        </View>
        {selected && (
          <View style={[swatchStyles.check, { backgroundColor: colorHex }]}>
            <Text style={swatchStyles.checkMark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

const swatchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  sublabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
})

// ─── Answer option ────────────────────────────────────────────────────────────

function AnswerOption({
  label,
  sublabel,
  selected,
  onPress,
  index,
}: {
  label: string
  sublabel?: string
  selected: boolean
  onPress: () => void
  index: number
}) {
  const scale = useSharedValue(1)
  const bgOpacity = useSharedValue(selected ? 1 : 0)

  React.useEffect(() => {
    bgOpacity.value = withTiming(selected ? 1 : 0, { duration: 200 })
  }, [selected])

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 60 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    )
    onPress()
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(selected ? Colors.aura.violet : Colors.border, { duration: 200 }),
    backgroundColor: withTiming(selected ? Colors.aura.violet + '22' : Colors.surface, { duration: 200 }),
  }))

  return (
    <Animated.View
      style={containerStyle}
      entering={FadeIn.delay(index * 60).duration(300)}
    >
      <TouchableOpacity
        style={optStyles.inner}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[optStyles.indicator, selected && optStyles.indicatorActive]}>
          {selected && <Text style={optStyles.indicatorDot}>●</Text>}
        </View>
        <View style={optStyles.textBlock}>
          <Text style={[optStyles.label, selected && { color: Colors.text }]}>{label}</Text>
          {sublabel && <Text style={optStyles.sublabel}>{sublabel}</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const optStyles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorActive: {
    borderColor: Colors.aura.violet,
  },
  indicatorDot: {
    fontSize: 10,
    color: Colors.aura.violet,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sublabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted + 'AA',
  },
})

// ─── Question card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question
  selectedIndex: number | null
  onSelect: (idx: number) => void
  questionNumber: number
}

function QuestionCard({ question, selectedIndex, onSelect, questionNumber }: QuestionCardProps) {
  const isColorQuestion = question.index === 5

  return (
    <Animated.View
      key={`q-${question.index}`}
      entering={SlideInRight.duration(350).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutLeft.duration(280).easing(Easing.in(Easing.cubic))}
      style={cardStyles.card}
    >
      {/* Question header */}
      <View style={cardStyles.header}>
        {question.chakraHint && (
          <Text style={cardStyles.hint}>{question.chakraHint}</Text>
        )}
        <Text style={cardStyles.prompt}>{question.prompt}</Text>
      </View>

      {/* Options */}
      <ScrollView
        style={cardStyles.optionList}
        contentContainerStyle={cardStyles.optionContent}
        showsVerticalScrollIndicator={false}
      >
        {isColorQuestion
          ? question.options.map((opt, i) => (
              <ColorSwatch
                key={i}
                colorKey={opt.colorKey!}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={selectedIndex === i}
                onPress={() => onSelect(i)}
              />
            ))
          : question.options.map((opt, i) => (
              <AnswerOption
                key={i}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={selectedIndex === i}
                onPress={() => onSelect(i)}
                index={i}
              />
            ))
        }
      </ScrollView>
    </Animated.View>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  hint: {
    ...Typography.label,
    color: Colors.aura.violet,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  prompt: {
    ...Typography.h1,
    color: Colors.text,
    lineHeight: 36,
  },
  optionList: {
    flex: 1,
  },
  optionContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
})

// ─── Main Questionnaire Screen ────────────────────────────────────────────────

export default function QuestionnaireScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUESTIONS.length).fill(null))
  const [isTransitioning, setIsTransitioning] = useState(false)
  const readingsUsed = useStore((s) => s.readingsUsed)
  const incrementReadings = useStore((s) => s.incrementReadings)

  const currentQuestion = QUESTIONS[currentIndex]
  const currentAnswer = answers[currentIndex]
  const isLastQuestion = currentIndex === QUESTIONS.length - 1
  const canAdvance = currentAnswer !== null

  const handleSelect = useCallback((answerIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setAnswers(prev => {
      const next = [...prev]
      next[currentIndex] = answerIdx
      return next
    })
  }, [currentIndex])

  const handleNext = useCallback(async () => {
    if (!canAdvance || isTransitioning) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (isLastQuestion) {
      // Check entitlement before generating result
      let isPremium = false
      try {
        const customerInfo = await Purchases.getCustomerInfo()
        isPremium = !!customerInfo.entitlements.active['premium']
      } catch (err) {
        log.warn('[rc][aura][questionnaire] getCustomerInfo failed:', err)
        // isPremium stays false (defensive). Don't reroute to paywall on transient RC errors —
        // free-tier counter-based gate below already enforces correct UX.
      }

      if (!isPremium && readingsUsed >= 2) {
        router.push('/paywall')
        return
      }
      incrementReadings()

      // Build the answer list and navigate to result
      const finalAnswers: QuestionnaireAnswer[] = answers
        .map((a, i) => a !== null ? { questionIndex: i, answerIndex: a } : null)
        .filter(Boolean) as QuestionnaireAnswer[]

      const profile = generateAuraFromAnswers(finalAnswers)
      await setActiveReading({ profile, source: 'questionnaire' })
      router.push('/aura-result')
    } else {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(i => i + 1)
        setIsTransitioning(false)
      }, 50)
    }
  }, [canAdvance, isTransitioning, isLastQuestion, answers, currentIndex, readingsUsed, incrementReadings])

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      router.back()
    } else {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(i => i - 1)
        setIsTransitioning(false)
      }, 50)
    }
  }, [currentIndex])

  return (
    <SafeAreaView style={qStyles.container}>
      {/* Top bar */}
      <View style={qStyles.topBar}>
        <TouchableOpacity onPress={handleBack} style={qStyles.backButton}>
          <Text style={qStyles.backArrow}>←</Text>
        </TouchableOpacity>
        <ProgressBar current={currentIndex + (canAdvance ? 1 : 0)} total={QUESTIONS.length} />
      </View>

      {/* Question area */}
      <View style={qStyles.questionArea}>
        {!isTransitioning && (
          <QuestionCard
            question={currentQuestion}
            selectedIndex={currentAnswer}
            onSelect={handleSelect}
            questionNumber={currentIndex + 1}
          />
        )}
      </View>

      {/* Next / Reveal button */}
      <View style={qStyles.footer}>
        <TouchableOpacity
          style={[qStyles.nextButton, !canAdvance && qStyles.nextButtonDisabled]}
          onPress={handleNext}
          activeOpacity={canAdvance ? 0.85 : 1}
        >
          <Text style={[qStyles.nextButtonText, !canAdvance && qStyles.nextButtonTextDisabled]}>
            {isLastQuestion ? 'Reveal My Aura' : 'Continue'}
          </Text>
          {!isLastQuestion && (
            <Text style={[qStyles.nextArrow, !canAdvance && qStyles.nextButtonTextDisabled]}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const qStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : 0,
  },
  backButton: {
    padding: Spacing.md,
    paddingLeft: Spacing.xl,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.textMuted,
  },
  questionArea: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl + Spacing.md,
    paddingTop: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.aura.violet,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.aura.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: Colors.textMuted,
  },
  nextArrow: {
    fontSize: 18,
    color: Colors.text,
  },
})
