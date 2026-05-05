import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Purchases, { type PurchasesPackage } from 'react-native-purchases'
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme'

const { width: W } = Dimensions.get('window')

const FEATURES = [
  { glyph: '◉', label: 'Unlimited aura readings — camera & questionnaire' },
  { glyph: '✦', label: 'Full chakra analysis with color resonance map' },
  { glyph: '✧', label: 'Save and revisit all past readings' },
  { glyph: '☽', label: 'Deeper personality and energy field insights' },
  { glyph: '▲', label: 'Daily aura shift tracking' },
]

type Plan = 'monthly' | 'annual' | 'lifetime'

// Pulsing orb animation
function AuraGlow() {
  const scale = useSharedValue(1)
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.12, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    )
  }, [])
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.55,
  }))
  return (
    <View style={orbStyles.container}>
      <Animated.View style={[orbStyles.outerGlow, glowStyle]} />
      <View style={orbStyles.innerOrb} />
      <Text style={orbStyles.symbol}>◉</Text>
    </View>
  )
}

const orbStyles = StyleSheet.create({
  container: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.aura.violet,
  },
  innerOrb: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.aura.indigo,
    opacity: 0.8,
  },
  symbol: {
    fontSize: 28,
    color: Colors.text,
  },
})

export default function PaywallScreen() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [packages, setPackages] = useState<Partial<Record<Plan, PurchasesPackage>>>({})
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    Purchases.getOfferings().then((offerings) => {
      const current = offerings.current
      if (!current) return
      const pkgs: Partial<Record<Plan, PurchasesPackage>> = {}
      for (const pkg of current.availablePackages) {
        if (pkg.identifier === '$rc_monthly' || pkg.identifier === 'monthly') pkgs.monthly = pkg
        if (pkg.identifier === '$rc_annual' || pkg.identifier === 'annual') pkgs.annual = pkg
        if (pkg.identifier === '$rc_lifetime' || pkg.identifier === 'lifetime') pkgs.lifetime = pkg
      }
      setPackages(pkgs)
    }).catch((err) => console.warn('[paywall] getOfferings error:', err))
  }, [])

  const monthlyPrice = packages.monthly?.product.priceString ?? '$4.99'
  const annualPrice = packages.annual?.product.priceString ?? '$24.99'
  const lifetimePrice = packages.lifetime?.product.priceString ?? '$79.99'
  const annualMonthly = packages.annual
    ? `$${(packages.annual.product.price / 12).toFixed(2)}/mo`
    : '$2.08/mo'

  const PLANS = [
    {
      id: 'monthly' as Plan,
      label: 'Monthly',
      price: monthlyPrice,
      sub: 'per month · cancel anytime',
      highlight: false,
    },
    {
      id: 'annual' as Plan,
      label: 'Annual',
      price: annualPrice,
      sub: `${annualMonthly} · save 58%`,
      highlight: true,
      badge: 'Best Value',
    },
    {
      id: 'lifetime' as Plan,
      label: 'Lifetime',
      price: lifetimePrice,
      sub: 'one-time · no subscription',
      highlight: false,
      badge: 'No Renewal',
    },
  ]

  const handlePurchase = async () => {
    const pkg = packages[selectedPlan]
    if (!pkg) {
      Alert.alert('Unavailable', 'Purchase options are not available right now. Please try again.')
      return
    }
    setIsPurchasing(true)
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      if (customerInfo.entitlements.active['premium']) {
        router.back()
        Alert.alert('Welcome to AURA+', 'You now have unlimited aura readings.')
      }
    } catch (err: any) {
      if (!err?.userCancelled) {
        console.error('[paywall] Purchase error:', err)
        Alert.alert('Purchase Failed', err?.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    try {
      const customerInfo = await Purchases.restorePurchases()
      if (customerInfo.entitlements.active['premium']) {
        router.back()
        Alert.alert('Purchases Restored', 'Your premium access has been restored.')
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.')
      }
    } catch (err: any) {
      console.error('[paywall] Restore error:', err)
      Alert.alert('Restore Failed', err?.message ?? 'Could not restore purchases.')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.hero}>
          <AuraGlow />
          <Text style={styles.heroTitle}>AURA+</Text>
          <Text style={styles.heroSubtitle}>
            Unlock unlimited readings and see your full energy field — chakras, colors, and personality insights
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureGlyph}>{f.glyph}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Plan selector */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.planBlock}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.highlight && styles.planCardHighlight,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.planCardLeft}>
                <View style={[styles.planRadio, selectedPlan === plan.id && styles.planRadioSelected]}>
                  {selectedPlan === plan.id && <View style={styles.planRadioDot} />}
                </View>
              </View>
              <View style={styles.planCardContent}>
                <Text style={[styles.planTitle, selectedPlan === plan.id && styles.planTitleSelected]}>
                  {plan.label}
                </Text>
                <Text style={styles.planSubtitle}>{plan.price} · {plan.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(550)} style={styles.ctaBlock}>
          <TouchableOpacity
            style={[styles.ctaBtn, isPurchasing && styles.ctaBtnLoading]}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring}
            activeOpacity={0.85}
          >
            {isPurchasing ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <Text style={styles.ctaBtnText}>Unlock AURA+</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isPurchasing || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color={Colors.textMuted} size="small" />
            ) : (
              <Text style={styles.restoreBtnText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            Subscription auto-renews. Cancel anytime in App Store / Google Play settings.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.aura.violet,
    letterSpacing: 4,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  features: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureGlyph: {
    fontSize: 18,
    color: Colors.aura.violet,
    width: 28,
    textAlign: 'center',
  },
  featureLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  planBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  planCardSelected: {
    borderColor: Colors.aura.violet,
    backgroundColor: 'rgba(128,90,213,0.06)',
  },
  planCardHighlight: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  planBadge: {
    position: 'absolute',
    top: -11,
    right: Spacing.md,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  planBadgeText: {
    ...Typography.label,
    color: Colors.bg,
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  planCardLeft: {
    justifyContent: 'center',
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    borderColor: Colors.aura.violet,
  },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.aura.violet,
  },
  planCardContent: {
    flex: 1,
  },
  planTitle: {
    ...Typography.h3,
    color: Colors.textMuted,
  },
  planTitleSelected: {
    color: Colors.text,
  },
  planSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  ctaBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaBtn: {
    backgroundColor: Colors.aura.violet,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.aura.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnLoading: {
    opacity: 0.7,
  },
  ctaBtnText: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  restoreBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
  },
  restoreBtnText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  legal: {
    ...Typography.label,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
    paddingHorizontal: Spacing.md,
  },
})
