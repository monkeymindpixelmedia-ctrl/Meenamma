import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'models/referral_models.dart';
import 'services/referral_api_service.dart';
import 'tokens/design_tokens.dart';
import 'widgets/referral_logo_badge.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: RefTokens.canvasNight,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const MeenammaReferralApp());
}

class MeenammaReferralApp extends StatelessWidget {
  const MeenammaReferralApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Meenamma Subscriber Referrals',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: RefTokens.canvasNight,
        primaryColor: RefTokens.emeraldPrimary,
        colorScheme: const ColorScheme.dark(
          primary: RefTokens.emeraldPrimary,
          secondary: RefTokens.mintAccent,
          surface: RefTokens.surfaceDark,
        ),
        fontFamily: 'Roboto',
      ),
      home: const MainReferralShell(),
    );
  }
}

class MainReferralShell extends StatefulWidget {
  const MainReferralShell({super.key});

  @override
  State<MainReferralShell> createState() => _MainReferralShellState();
}

class _MainReferralShellState extends State<MainReferralShell> {
  ReferralPartner? _partner;
  List<SubscriberRecord> _subscribers = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _handleLogin('8122348468');
  }

  Future<void> _handleLogin(String query) async {
    setState(() => _isLoading = true);
    final partner = await ReferralApiService.fetchPartner(query);
    if (partner != null) {
      final subs = await ReferralApiService.fetchSubscribers(partner.id, partner.referralCode);
      setState(() {
        _partner = partner;
        _subscribers = subs;
        _isLoading = false;
      });
    } else {
      // Fallback demo partner
      const demo = ReferralPartner(
        id: '338b3361-779c-474e-83d0-ff95a4b55901',
        name: 'Rathnavel Karthi',
        email: 'rathnavelkarthi1@gmail.com',
        phone: '+91 81223 48468',
        referralCode: 'RATH338B',
        upiId: 'rathna@okhdfcbank',
      );
      final subs = await ReferralApiService.fetchSubscribers(demo.id, demo.referralCode);
      setState(() {
        _partner = demo;
        _subscribers = subs;
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshData() async {
    if (_partner == null) return;
    setState(() => _isLoading = true);
    final subs = await ReferralApiService.fetchSubscribers(_partner!.id, _partner!.referralCode);
    setState(() {
      _subscribers = subs;
      _isLoading = false;
    });
  }

  void _showAddSubscriberSheet() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    int selectedPlan = 2; // Default ₹2/day (₹400 bounty)

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: RefTokens.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Register 100-Day Subscriber',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: RefTokens.textLight),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: RefTokens.textMuted),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Enroll subscriber into Daily Autopay Kudam. Live two-way sync with referral.meenamma web portal.',
                style: TextStyle(fontSize: 12, color: RefTokens.textMuted),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Subscriber Full Name',
                  labelStyle: const TextStyle(color: RefTokens.textMuted),
                  filled: true,
                  fillColor: RefTokens.surfaceCard,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'WhatsApp Mobile Number',
                  labelStyle: const TextStyle(color: RefTokens.textMuted),
                  filled: true,
                  fillColor: RefTokens.surfaceCard,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Choose Daily Autopay Savings Plan:',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: RefTokens.mintAccent),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _planOption(1, 200, selectedPlan == 1, () => setSheetState(() => selectedPlan = 1)),
                  const SizedBox(width: 8),
                  _planOption(2, 400, selectedPlan == 2, () => setSheetState(() => selectedPlan = 2)),
                  const SizedBox(width: 8),
                  _planOption(5, 600, selectedPlan == 5, () => setSheetState(() => selectedPlan = 5)),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: RefTokens.emeraldPrimary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: RefTokens.borderSubtle),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, size: 18, color: RefTokens.mintAccent),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your bounty of ₹${SubscriberRecord.calculateReward(selectedPlan)} will unlock when this subscriber finishes all 100 days.',
                        style: const TextStyle(fontSize: 11, color: RefTokens.textMuted),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: RefTokens.emeraldPrimary,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    if (nameCtrl.text.isEmpty || phoneCtrl.text.isEmpty) return;
                    Navigator.pop(ctx);
                    setState(() => _isLoading = true);
                    await ReferralApiService.addSubscriber(
                      partnerId: _partner!.id,
                      referralCode: _partner!.referralCode,
                      subscriberName: nameCtrl.text.trim(),
                      subscriberPhone: phoneCtrl.text.trim(),
                      dailyPlan: selectedPlan,
                    );
                    await _refreshData();
                  },
                  child: const Text('SYNC & ENROLL SUBSCRIBER', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _planOption(int plan, int bounty, bool isSelected, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? RefTokens.emeraldPrimary.withValues(alpha: 0.2) : RefTokens.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? RefTokens.emeraldPrimary : RefTokens.borderCard),
          ),
          child: Column(
            children: [
              Text('₹$plan/day', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isSelected ? RefTokens.textLight : Colors.white70)),
              const SizedBox(height: 4),
              Text('₹$bounty Prize', style: const TextStyle(fontSize: 11, color: RefTokens.mintAccent, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }

  void _showWithdrawModal(int amount) {
    final upiCtrl = TextEditingController(text: _partner?.upiId ?? 'rathna@okhdfcbank');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RefTokens.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Withdraw Unlocked Rewards', style: TextStyle(color: RefTokens.textLight, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Completed 100-Day Balance:', style: TextStyle(color: RefTokens.textMuted, fontSize: 12)),
            const SizedBox(height: 4),
            Text('₹$amount', style: const TextStyle(color: RefTokens.mintAccent, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: upiCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'UPI ID for Transfer',
                labelStyle: const TextStyle(color: RefTokens.textMuted),
                filled: true,
                fillColor: RefTokens.surfaceCard,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: RefTokens.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: RefTokens.emeraldPrimary, foregroundColor: Colors.black),
            onPressed: () async {
              Navigator.pop(ctx);
              await ReferralApiService.requestPayout(
                partnerId: _partner!.id,
                amountInr: amount,
                upiId: upiCtrl.text.trim(),
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Payout requested! Disbursed to UPI within 2 hours.')),
                );
              }
            },
            child: const Text('CONFIRM TRANSFER'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeSubs = _subscribers.filter((s) => !s.isCompleted);
    final completedSubs = _subscribers.filter((s) => s.isCompleted);
    final locked = activeSubs.fold<int>(0, (sum, s) => sum + s.rewardAmount);
    final unlocked = completedSubs.fold<int>(0, (sum, s) => sum + s.rewardAmount);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: RefTokens.canvasNight,
        elevation: 0,
        title: const ReferralLogoBadge(),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: RefTokens.mintAccent),
            onPressed: _refreshData,
            tooltip: 'Sync with Cloud',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: RefTokens.emeraldPrimary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.person_add),
        label: const Text('ADD SUBSCRIBER', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _showAddSubscriberSheet,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: RefTokens.emeraldPrimary))
          : RefreshIndicator(
              color: RefTokens.emeraldPrimary,
              onRefresh: _refreshData,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Partner Header Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [RefTokens.surfaceCard, RefTokens.surfaceDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: RefTokens.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_partner?.name ?? 'Partner', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: RefTokens.textLight)),
                                Text(_partner?.phone ?? '', style: const TextStyle(fontSize: 12, color: RefTokens.textMuted)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: RefTokens.emeraldPrimary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: RefTokens.emeraldPrimary.withValues(alpha: 0.3)),
                              ),
                              child: const Text('CLOUD SYNCED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: RefTokens.mintAccent)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: RefTokens.borderCard),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('YOUR REFERRAL CODE', style: TextStyle(fontSize: 9, color: RefTokens.textDim, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text(_partner?.referralCode ?? 'RATH338B', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: RefTokens.mintAccent, letterSpacing: 1.2)),
                                ],
                              ),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: RefTokens.emeraldPrimary,
                                  foregroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                icon: const Icon(Icons.copy, size: 14),
                                label: const Text('COPY LINK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                onPressed: () {
                                  final link = 'https://meenamma.org/kudam?ref=${_partner?.referralCode ?? "RATH338B"}';
                                  Clipboard.setData(ClipboardData(text: link));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Subscriber invitation link copied!')),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).animate().fade().slideY(begin: 0.05, end: 0),

                  const SizedBox(height: 16),

                  // 4 KPI Metric Cards
                  Row(
                    children: [
                      _metricCard('Active Subs', '${activeSubs.length}', 'In 100 days', RefTokens.textLight),
                      const SizedBox(width: 10),
                      _metricCard('100d Finished', '${completedSubs.length}', 'Completed', RefTokens.mintAccent),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _metricCard('Locked Bounty', '₹$locked', 'Pending day 100', RefTokens.goldAccent),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: RefTokens.surfaceCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: RefTokens.emeraldPrimary.withValues(alpha: 0.3)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('READY PAYOUT', style: TextStyle(fontSize: 9, color: RefTokens.mintAccent, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('₹$unlocked', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: RefTokens.mintAccent)),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                height: 28,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: RefTokens.emeraldPrimary,
                                    foregroundColor: Colors.black,
                                    padding: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  onPressed: unlocked > 0 ? () => _showWithdrawModal(unlocked) : null,
                                  child: const Text('WITHDRAW UPI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // The 100-Day Rule Banner
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: RefTokens.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: RefTokens.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.workspace_premium_outlined, color: RefTokens.mintAccent, size: 18),
                            SizedBox(width: 8),
                            Text('100-Day Milestone Bounty Rule', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: RefTokens.textLight)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Your task: Make sure subscribers complete their 100-day Autopay Kudam micro-savings cycle.',
                          style: TextStyle(fontSize: 11, color: RefTokens.textMuted),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _rulePill('₹1 / day', '₹200'),
                            const Text('·', style: TextStyle(color: RefTokens.textDim)),
                            _rulePill('₹2 / day', '₹400'),
                            const Text('·', style: TextStyle(color: RefTokens.textDim)),
                            _rulePill('₹5 / day', '₹600'),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Subscriber Cohort', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: RefTokens.textLight)),
                      Text('${_subscribers.length} total', style: const TextStyle(fontSize: 12, color: RefTokens.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Subscriber list
                  if (_subscribers.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      alignment: Alignment.center,
                      child: const Text('No subscribers yet. Tap "Add Subscriber" below.', style: TextStyle(color: RefTokens.textMuted, fontSize: 12)),
                    )
                  else
                    ..._subscribers.map((s) => _subscriberTile(s)),

                  const SizedBox(height: 80), // padding for FAB
                ],
              ),
            ),
    );
  }

  Widget _metricCard(String title, String value, String sub, Color valColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: RefTokens.surfaceCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: RefTokens.borderCard),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title.toUpperCase(), style: const TextStyle(fontSize: 9, color: RefTokens.textDim, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: valColor)),
            const SizedBox(height: 2),
            Text(sub, style: const TextStyle(fontSize: 10, color: RefTokens.textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _rulePill(String plan, String bounty) {
    return Column(
      children: [
        Text(plan, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: RefTokens.textLight)),
        Text('+$bounty Bounty', style: const TextStyle(fontSize: 10, color: RefTokens.mintAccent, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _subscriberTile(SubscriberRecord s) {
    final pct = (s.cycleDay / 100.0).clamp(0.0, 1.0);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: s.isCompleted ? RefTokens.emeraldDark.withValues(alpha: 0.2) : RefTokens.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: s.isCompleted ? RefTokens.emeraldPrimary : RefTokens.borderCard),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(s.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: RefTokens.textLight)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: RefTokens.borderCard),
                        ),
                        child: Text('₹${s.dailyPlan}/day', style: const TextStyle(fontSize: 10, color: RefTokens.mintAccent)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text('${s.phone} · Started ${s.startDate}', style: const TextStyle(fontSize: 11, color: RefTokens.textMuted)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₹${s.rewardAmount}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: s.isCompleted ? RefTokens.mintAccent : RefTokens.goldAccent)),
                  Text(s.isCompleted ? 'UNLOCKED' : 'LOCKED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: s.isCompleted ? RefTokens.mintAccent : RefTokens.goldAccent)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Day ${s.cycleDay} / 100', style: const TextStyle(fontSize: 11, color: RefTokens.textMuted)),
              Text('${(pct * 100).toInt()}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: s.isCompleted ? RefTokens.mintAccent : RefTokens.textLight)),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 6,
              backgroundColor: Colors.black38,
              valueColor: AlwaysStoppedAnimation<Color>(s.isCompleted ? RefTokens.mintAccent : RefTokens.emeraldPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

extension FilterExt<T> on List<T> {
  List<T> filter(bool Function(T) predicate) => where(predicate).toList();
}
