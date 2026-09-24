import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'models/earn_models.dart';
import 'services/earn_api_service.dart';
import 'tokens/design_tokens.dart';
import 'widgets/earn_logo_badge.dart';

import 'screens/earn_auth_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: EarnTokens.canvasNight,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const MeenammaEarnApp());
}

class MeenammaEarnApp extends StatefulWidget {
  const MeenammaEarnApp({super.key});

  @override
  State<MeenammaEarnApp> createState() => _MeenammaEarnAppState();
}

class _MeenammaEarnAppState extends State<MeenammaEarnApp> {
  EarnMember? _authenticatedMember;
  bool _showSplash = true;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Meenamma Work & Earn',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: EarnTokens.canvasNight,
        primaryColor: EarnTokens.goldPrimary,
        colorScheme: const ColorScheme.dark(
          primary: EarnTokens.goldPrimary,
          secondary: EarnTokens.goldLight,
          surface: EarnTokens.surfaceDark,
        ),
        fontFamily: 'Roboto',
      ),
      home: _showSplash
          ? EarnSplashScreen(
              onFinish: () {
                setState(() => _showSplash = false);
              },
            )
          : _authenticatedMember == null
              ? EarnAuthScreen(
                  onAuthenticated: (member) {
                    setState(() => _authenticatedMember = member);
                  },
                )
              : MainEarnShell(
                  initialMember: _authenticatedMember,
                  onSignOut: () {
                    setState(() => _authenticatedMember = null);
                  },
                ),
    );
  }
}

class EarnSplashScreen extends StatefulWidget {
  final VoidCallback onFinish;
  const EarnSplashScreen({super.key, required this.onFinish});

  @override
  State<EarnSplashScreen> createState() => _EarnSplashScreenState();
}

class _EarnSplashScreenState extends State<EarnSplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _scaleAnimation = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();

    _timer = Timer(const Duration(milliseconds: 2400), () {
      if (mounted) widget.onFinish();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EarnTokens.canvasNight,
      body: GestureDetector(
        onTap: widget.onFinish,
        behavior: HitTestBehavior.opaque,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Center(
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      EarnTokens.goldPrimary.withValues(alpha: 0.18),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'KASIMEDU HARBOR · OFFICIAL WORKFORCE',
                          style: TextStyle(
                            fontSize: 10,
                            letterSpacing: 2.2,
                            fontWeight: FontWeight.w600,
                            color: EarnTokens.textMuted,
                          ),
                        ),
                      ],
                    ),
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: ScaleTransition(
                        scale: _scaleAnimation,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: EarnTokens.surfaceDark,
                                border: Border.all(
                                  color: EarnTokens.goldPrimary.withValues(alpha: 0.6),
                                  width: 2.0,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: EarnTokens.goldPrimary.withValues(alpha: 0.35),
                                    blurRadius: 28,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(12),
                              child: Image.asset(
                                'assets/images/meenamma_logo.png',
                                fit: BoxFit.contain,
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'MEENAMMA',
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 6.0,
                                color: Color(0xFFF5F2EB),
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'WORK & EARN · PARTNER NETWORK',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2.0,
                                color: EarnTokens.goldPrimary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                              ),
                              child: const Text(
                                'RELEASE v1.0.0+6 · STIPEND VERIFIED',
                                style: TextStyle(
                                  fontSize: 9,
                                  color: Color(0xFFA89E88),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Column(
                      children: [
                        const SizedBox(
                          width: 140,
                          child: LinearProgressIndicator(
                            backgroundColor: Colors.white10,
                            valueColor: AlwaysStoppedAnimation<Color>(EarnTokens.goldPrimary),
                            minHeight: 2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Tap anywhere to skip',
                          style: TextStyle(
                            fontSize: 10,
                            color: EarnTokens.textMuted.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


class MainEarnShell extends StatefulWidget {
  final EarnMember? initialMember;
  final VoidCallback? onSignOut;

  const MainEarnShell({super.key, this.initialMember, this.onSignOut});

  @override
  State<MainEarnShell> createState() => _MainEarnShellState();
}

class _MainEarnShellState extends State<MainEarnShell> {
  EarnMember? _member;
  List<ReferralItem> _referrals = [];
  bool _isLoading = false;
  String _currentUserId = '338b3361-779c-474e-83d0-ff95a4b55901';
  int _selectedTab = 0;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    if (widget.initialMember != null) {
      _member = widget.initialMember;
      _currentUserId = widget.initialMember!.id;
      _loadReferrals(_currentUserId);
    } else {
      _loadAllData(_currentUserId);
    }
  }

  Future<void> _loadReferrals(String userId) async {
    final refs = await EarnApiService.fetchReferrals(userId);
    if (mounted) {
      setState(() => _referrals = refs);
    }
  }

  Future<void> _loadAllData(String userId) async {
    setState(() => _isLoading = true);
    final mem = await EarnApiService.fetchMember(userId);
    final refs = await EarnApiService.fetchReferrals(userId);
    if (mounted) {
      setState(() {
        _currentUserId = userId;
        _member = mem;
        _referrals = refs;
        _isLoading = false;
      });
    }
  }

  void _copyToClipboard(String text, String message) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: EarnTokens.goldPrimary,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _launchExternalUrl(String urlStr) async {
    final uri = Uri.parse(urlStr);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(uri);
      }
    } catch (_) {
      _copyToClipboard(urlStr, 'Link copied: $urlStr');
    }
  }

  void _showEditAccountSheet() {
    final nameCtrl = TextEditingController(text: _member?.name ?? '');
    final phoneCtrl = TextEditingController(text: _member?.phone ?? '');
    final collegeCtrl = TextEditingController(text: _member?.organization ?? '');
    final upiCtrl = TextEditingController(text: _member?.upiId ?? '');
    final accountHolderCtrl = TextEditingController(text: _member?.accountHolder.isNotEmpty == true ? _member!.accountHolder : (_member?.name ?? ''));
    final bankCtrl = TextEditingController(text: _member?.bankAccount ?? '');
    final ifscCtrl = TextEditingController(text: _member?.ifsc ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0B0F14),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Edit Payout & UPI Details',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: EarnTokens.textMuted),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Used by Meenamma Accounts for your ₹5,000 monthly internship stipend.',
                style: TextStyle(fontSize: 12, color: EarnTokens.textMuted),
              ),
              const SizedBox(height: 16),
              _sheetField('Full Legal Name', nameCtrl, Icons.person_outline),
              const SizedBox(height: 10),
              _sheetField('WhatsApp Phone Number', phoneCtrl, Icons.phone_outlined),
              const SizedBox(height: 10),
              _sheetField('College / University', collegeCtrl, Icons.school_outlined),
              const SizedBox(height: 10),
              _sheetField('UPI ID / VPA (e.g. name@okhdfcbank)', upiCtrl, Icons.account_balance_wallet_outlined, isRequired: true),
              const SizedBox(height: 10),
              _sheetField('Account Holder Name', accountHolderCtrl, Icons.badge_outlined),
              const SizedBox(height: 10),
              _sheetField('Bank Account Number (Optional)', bankCtrl, Icons.account_balance_outlined),
              const SizedBox(height: 10),
              _sheetField('IFSC Code (Optional)', ifscCtrl, Icons.password_outlined),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: EarnTokens.goldPrimary,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    if (upiCtrl.text.trim().isEmpty && bankCtrl.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter a UPI ID or Bank Account for disbursements.')),
                      );
                      return;
                    }
                    Navigator.pop(ctx);
                    setState(() => _isLoading = true);

                    final updated = _member!.copyWith(
                      name: nameCtrl.text.trim(),
                      phone: phoneCtrl.text.trim(),
                      organization: collegeCtrl.text.trim(),
                      upiId: upiCtrl.text.trim(),
                      accountHolder: accountHolderCtrl.text.trim(),
                      bankAccount: bankCtrl.text.trim(),
                      ifsc: ifscCtrl.text.trim().toUpperCase(),
                    );

                    await EarnApiService.updateDisbursementDetails(
                      userId: _currentUserId,
                      name: updated.name,
                      phone: updated.phone,
                      organization: updated.organization,
                      upiId: updated.upiId,
                      accountHolder: updated.accountHolder,
                      bankAccount: updated.bankAccount,
                      ifsc: updated.ifsc,
                    );

                    setState(() {
                      _member = updated;
                      _isLoading = false;
                    });

                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Disbursement details verified and saved! Accounts notified.'),
                          backgroundColor: Color(0xFF10B981),
                        ),
                      );
                    }
                  },
                  child: const Text('SAVE DISBURSEMENT DETAILS', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sheetField(String label, TextEditingController ctrl, IconData icon, {bool isRequired = false}) {
    return TextField(
      controller: ctrl,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: EarnTokens.goldPrimary, size: 18),
        labelText: isRequired ? '$label *' : label,
        labelStyle: const TextStyle(color: EarnTokens.textMuted, fontSize: 12),
        filled: true,
        fillColor: const Color(0xFF141920),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final refCode = _member?.internCode ?? 'INT-INTERN-60D';
    final refUrl = 'https://meenamma.org/?ref=$refCode';

    return Scaffold(
      backgroundColor: EarnTokens.canvasNight,
      appBar: AppBar(
        backgroundColor: const Color(0xFF040608),
        elevation: 0,
        title: const EarnLogoBadge(),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                ),
                const SizedBox(width: 5),
                const Text('SYNCED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white70)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: EarnTokens.goldPrimary, size: 20),
            onPressed: () => _loadAllData(_currentUserId),
            tooltip: 'Refresh',
          ),
          if (widget.onSignOut != null)
            IconButton(
              icon: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
              onPressed: widget.onSignOut,
              tooltip: 'Sign Out',
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: EarnTokens.goldPrimary))
          : IndexedStack(
              index: _selectedTab,
              children: [
                _buildPipelineTab(refUrl),
                _buildShareTab(refCode, refUrl),
                _buildStipendTab(),
                _buildInternIdTab(refCode),
              ],
            ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF070A0E),
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.08), width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedTab,
          onTap: (idx) => setState(() => _selectedTab = idx),
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: EarnTokens.goldPrimary,
          unselectedItemColor: EarnTokens.textMuted,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.people_alt_outlined),
              activeIcon: Icon(Icons.people_alt),
              label: 'Pipeline',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.share_outlined),
              activeIcon: Icon(Icons.share),
              label: 'Share',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet),
              label: 'Stipend',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.badge_outlined),
              activeIcon: Icon(Icons.badge),
              label: 'Intern ID',
            ),
          ],
        ),
      ),
    );
  }

  // ─── TAB 0: PIPELINE (REFERRAL CRM) ───
  Widget _buildPipelineTab(String refUrl) {
    final activeCount = _referrals.where((r) => r.status == 'active').length;
    final delayedCount = _referrals.where((r) => r.status == 'payment_delayed' || r.status == 'registration_error').length;
    final totalClicks = _referrals.isNotEmpty ? _referrals.length * 3 : 0;
    final totalInstalls = _referrals.length;

    final filtered = _referrals.where((r) {
      if (_filterStatus == 'all') return true;
      if (_filterStatus == 'action_needed') return r.status == 'payment_delayed' || r.status == 'registration_error';
      if (_filterStatus == 'active') return r.status == 'active';
      if (_filterStatus == 'installed') return r.status == 'installed';
      return true;
    }).toList();

    return RefreshIndicator(
      color: EarnTokens.goldPrimary,
      onRefresh: () => _loadAllData(_currentUserId),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Program Badge Strip
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1D160C), Color(0xFF0F1318)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.25)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: EarnTokens.goldPrimary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.calendar_today_outlined, color: EarnTokens.goldPrimary, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('60-Day College Internship', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                        SizedBox(height: 2),
                        Text('Fixed Monthly Pay · Direct Bank Payout', style: TextStyle(fontSize: 10, color: EarnTokens.textMuted)),
                      ],
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: const [
                    Text('ACTIVE COHORT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                    SizedBox(height: 2),
                    Text('59 Days Left', style: TextStyle(fontSize: 10, color: EarnTokens.textMuted)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 4-Metric Funnel Row
          Row(
            children: [
              _metricTile('Link Clicks', '$totalClicks', Colors.white),
              const SizedBox(width: 8),
              _metricTile('Installs', '$totalInstalls', const Color(0xFF60A5FA)),
              const SizedBox(width: 8),
              _metricTile('Subscribers', '$activeCount', const Color(0xFF10B981)),
              const SizedBox(width: 8),
              _metricTile('Nudge', '$delayedCount', const Color(0xFFFBBF24)),
            ],
          ),
          const SizedBox(height: 14),

          // Universal Referral Bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0B0F14),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('YOUR UNIVERSAL REFERRAL LINK', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                    Text('Web & APK Sync', style: TextStyle(fontSize: 9, color: EarnTokens.goldPrimary)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white10),
                        ),
                        child: Text(refUrl, style: const TextStyle(fontSize: 11, color: EarnTokens.goldLight, fontFamily: 'monospace'), overflow: TextOverflow.ellipsis),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 18, color: EarnTokens.goldPrimary),
                      onPressed: () => _copyToClipboard(refUrl, 'Referral link copied!'),
                      tooltip: 'Copy Link',
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip('all', 'All Referrals (${_referrals.length})'),
                const SizedBox(width: 8),
                _filterChip('action_needed', '⚠️ Attention ($delayedCount)'),
                const SizedBox(width: 8),
                _filterChip('active', '🟢 Active Kudam ($activeCount)'),
                const SizedBox(width: 8),
                _filterChip('installed', '📲 New Installs ($totalInstalls)'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Pipeline List
          if (_referrals.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF0B0F14),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: EarnTokens.goldPrimary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.share, color: EarnTokens.goldPrimary, size: 24),
                  ),
                  const SizedBox(height: 14),
                  const Text('Your Referral Pipeline is Ready', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                  const SizedBox(height: 6),
                  const Text(
                    'You have 0 referrals yet. Share your unique intern link with friends, family, and hostel mates. All app installs, orders, and active daily savings will automatically appear here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: EarnTokens.textMuted, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 42,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.send, size: 16),
                      label: const Text('SHARE REFERRAL LINK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () => _copyToClipboard(refUrl, 'Referral link copied for WhatsApp sharing!'),
                    ),
                  ),
                ],
              ),
            )
          else if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0B0F14),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text('No referrals match this filter.', style: TextStyle(color: EarnTokens.textMuted, fontSize: 12)),
              ),
            )
          else
            ...filtered.map((item) => _referralCard(item)),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _metricTile(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF0B0F14),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          children: [
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 8, color: EarnTokens.textDim, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String id, String label) {
    final isSelected = _filterStatus == id;
    return GestureDetector(
      onTap: () => setState(() => _filterStatus = id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? EarnTokens.goldPrimary : const Color(0xFF0B0F14),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? EarnTokens.goldPrimary : Colors.white12),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.black : EarnTokens.textLight,
          ),
        ),
      ),
    );
  }

  Widget _referralCard(ReferralItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0B0F14),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
              Text(item.statusLabel, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
            ],
          ),
          const SizedBox(height: 4),
          Text('${item.phone} · ${item.plan}', style: const TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
          const SizedBox(height: 6),
          Text(item.issue, style: const TextStyle(fontSize: 11, color: Color(0xFFD4CEBA))),
        ],
      ),
    );
  }

  // ─── TAB 1: SHARE & DISTRIBUTION (EARN PORTAL, SIDELOAD APK, CUSTOMER STORE) ───
  Widget _buildShareTab(String refCode, String refUrl) {
    const earnWebPortal = 'https://earn.meenamma.org';
    const apkDownloadUrl = 'https://earn.meenamma.org/apk/Meenamma-WorkplaceEarn.apk';
    const playStoreTestingUrl = 'https://play.google.com/apps/testing/com.meenamma.app';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // CARD 1: DIRECT ANDROID APK (SIDELOAD)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0F1E17), Color(0xFF08120E)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.android, color: Color(0xFF10B981), size: 18),
                      SizedBox(width: 8),
                      Text(
                        'DIRECT ANDROID APK (SIDELOAD)',
                        style: TextStyle(fontSize: 11, letterSpacing: 1.2, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                    ),
                    child: const Text('v1.0.0 RELEASE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Direct APK file for campus interns and Android testing. Install immediately without waiting for Google Play whitelisting.',
                style: TextStyle(fontSize: 11, color: Color(0xFFA7B8AF), height: 1.4),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.link, color: Color(0xFF10B981), size: 16),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        apkDownloadUrl,
                        style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.white70),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy, color: Color(0xFF10B981), size: 16),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => _copyToClipboard(apkDownloadUrl, 'APK download link copied to clipboard!'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.download, size: 16),
                      label: const Text('DOWNLOAD APK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () => _launchExternalUrl(apkDownloadUrl),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF10B981),
                        side: const BorderSide(color: Color(0xFF10B981)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.share, size: 16),
                      label: const Text('SHARE APK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () {
                        final msg = 'Hey! Join the Meenamma Student Intern Program. Download our official Android APK: $apkDownloadUrl or log into the web portal: $earnWebPortal';
                        _copyToClipboard(msg, 'APK share message copied! Paste in WhatsApp.');
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // CARD 2: INTERN WORKPLACE WEB PORTAL (earn.meenamma.org)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1A1608), Color(0xFF0D0F14)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.devices, color: EarnTokens.goldPrimary, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'INTERN WORKPLACE WEB PORTAL',
                        style: TextStyle(fontSize: 11, letterSpacing: 1.2, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: EarnTokens.goldPrimary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.3)),
                    ),
                    child: const Text('earn.meenamma.org', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: EarnTokens.goldLight)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Access your live internship funnel CRM, stipend ledger, and task deliverables on any PC, Mac, iPhone, or browser without installing an app.',
                style: TextStyle(fontSize: 11, color: EarnTokens.textMuted, height: 1.4),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.language, color: EarnTokens.goldPrimary, size: 16),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        earnWebPortal,
                        style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.white),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy, color: EarnTokens.goldPrimary, size: 16),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => _copyToClipboard(earnWebPortal, 'Workplace web portal URL copied!'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: EarnTokens.goldPrimary,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.open_in_browser, size: 16),
                      label: const Text('OPEN WEB PORTAL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () => _launchExternalUrl(earnWebPortal),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: EarnTokens.goldLight,
                        side: BorderSide(color: EarnTokens.goldPrimary.withValues(alpha: 0.5)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.copy, size: 16),
                      label: const Text('COPY LINK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () => _copyToClipboard(earnWebPortal, 'Portal URL copied: https://earn.meenamma.org'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // CARD 3: CUSTOMER STORE REFERRAL LINK (meenamma.org/?ref=...)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF141A22), Color(0xFF090D12)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.storefront_outlined, color: Colors.blueAccent, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'CUSTOMER STORE REFERRAL LINK',
                        style: TextStyle(fontSize: 11, letterSpacing: 1.2, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.blueAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3)),
                    ),
                    child: const Text('meenamma.org', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.lightBlueAccent)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Share with customers & hostel flatmates. When they order Kasimedu fresh catch or start ₹50/day Kudam savings, credit is automatically logged to your intern account.',
                style: TextStyle(fontSize: 11, color: EarnTokens.textMuted, height: 1.4),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      refCode,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, letterSpacing: 2.0, color: Colors.lightBlueAccent),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy, color: Colors.lightBlueAccent, size: 18),
                      onPressed: () => _copyToClipboard(refCode, 'Referral code copied!'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.copy, size: 16),
                      label: const Text('COPY STORE LINK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () => _copyToClipboard(refUrl, 'Customer store referral link copied!'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.send, size: 16),
                      label: const Text('WHATSAPP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      onPressed: () {
                        final msg = 'Hi! Pre-order fresh catch directly from Kasimedu harbor with Meenamma or start ₹50/day micro-savings for daily catch! Use my student intern referral link: $refUrl';
                        _copyToClipboard(msg, 'WhatsApp invite message copied! Paste in any chat.');
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // CARD 4: CLOSED TESTING & DISTRIBUTION GUIDE
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF0B0F14),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.info_outline, color: EarnTokens.goldPrimary, size: 18),
                  SizedBox(width: 8),
                  Text('Distribution & Access Guide', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 12),
              _guideStep('1. Intern Workplace Web Portal (earn.meenamma.org)', 'Works on any device without installation. Interns can view their stipend ledger and manage CRM referrals.'),
              const SizedBox(height: 10),
              _guideStep('2. Direct Android APK Sideload', 'Immediate installation for classmates and hostel teams. Direct APK link: $apkDownloadUrl'),
              const SizedBox(height: 10),
              _guideStep('3. Customer Storefront (meenamma.org)', 'Customer-facing store where families and students order fresh catch & enroll in Kudam micro-savings.'),
              const SizedBox(height: 10),
              _guideStep('4. Google Play Closed Testing Link', 'Testers on the Google Play testing whitelist can opt in at $playStoreTestingUrl'),
            ],
          ),
        ),
        const SizedBox(height: 30),
      ],
    );
  }

  Widget _guideStep(String title, String desc) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: EarnTokens.goldLight)),
        const SizedBox(height: 2),
        Text(desc, style: const TextStyle(fontSize: 11, color: EarnTokens.textMuted, height: 1.4)),
      ],
    );
  }

  // ─── TAB 2: STIPEND & PAYOUT DETAILS ───
  Widget _buildStipendTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Monthly Guaranteed Base
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1D1708), Color(0xFF0D1016)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('GUARANTEED MONTHLY STIPEND', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('COMPANY DISBURSED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text('₹5,000 / month', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
              const SizedBox(height: 4),
              const Text('₹10,000 Total Stipend across 60 days. Direct company bank/UPI disbursement.', style: TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Milestones
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B0F14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('MONTH 1 MILESTONE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                    SizedBox(height: 4),
                    Text('₹5,000', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    SizedBox(height: 2),
                    Text('At Day 30', style: TextStyle(fontSize: 10, color: Color(0xFF10B981))),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B0F14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('MONTH 2 MILESTONE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                    SizedBox(height: 4),
                    Text('₹5,000', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    SizedBox(height: 2),
                    Text('At Day 60', style: TextStyle(fontSize: 10, color: Color(0xFF60A5FA))),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Payout Account Details Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF0B0F14),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('STIPEND PAYOUT DESTINATION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                  GestureDetector(
                    onTap: _showEditAccountSheet,
                    child: const Text('Edit Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _detailRow('Recipient Name', _member?.accountHolder.isNotEmpty == true ? _member!.accountHolder : (_member?.name ?? 'Not set')),
              _detailRow('WhatsApp Phone', _member?.phone.isNotEmpty == true ? _member!.phone : 'Not set'),
              _detailRow('College / Org', _member?.organization ?? 'College / University'),
              _detailRow('UPI ID / VPA', _member?.upiId.isNotEmpty == true ? _member!.upiId : 'Not set (Tap edit to add)', isHighlight: true),
              _detailRow('Bank Account', _member?.bankAccount.isNotEmpty == true ? _member!.bankAccount : 'Optional'),
              _detailRow('IFSC Code', _member?.ifsc.isNotEmpty == true ? _member!.ifsc : 'Optional'),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: EarnTokens.goldPrimary.withValues(alpha: 0.15),
                    foregroundColor: EarnTokens.goldPrimary,
                    side: BorderSide(color: EarnTokens.goldPrimary.withValues(alpha: 0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: Text(_member?.upiId.isNotEmpty == true ? 'UPDATE UPI / BANK DETAILS' : 'ADD UPI FOR STIPEND', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  onPressed: _showEditAccountSheet,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 30),
      ],
    );
  }

  Widget _detailRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isHighlight ? EarnTokens.goldPrimary : Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // ─── TAB 3: DIGITAL INTERN ID CARD ───
  Widget _buildInternIdTab(String refCode) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Golden Intern ID Badge
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF221A0C), Color(0xFF0F141A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.45), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: EarnTokens.goldPrimary.withValues(alpha: 0.15),
                blurRadius: 20,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: EarnTokens.goldPrimary),
                        ),
                        padding: const EdgeInsets.all(4),
                        child: Image.asset('assets/images/meenamma_logo.png', fit: BoxFit.contain),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'MEENAMMA',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 2.0, color: EarnTokens.goldPrimary),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF10B981)),
                    ),
                    child: const Text('VERIFIED INTERN', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(_member?.name ?? 'Student Intern', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 2),
              Text(_member?.organization ?? 'College / University', style: const TextStyle(fontSize: 12, color: EarnTokens.textMuted)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('INTERN ID', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                        const SizedBox(height: 2),
                        Text(refCode, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text('VALIDITY', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
                        SizedBox(height: 2),
                        Text('60 Days Cohort', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Quick Actions Card (NO Replay Splash!)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0B0F14),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('ACCOUNT ACTIONS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.textDim)),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: EarnTokens.goldPrimary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.edit_outlined, color: EarnTokens.goldPrimary, size: 20),
                ),
                title: const Text('Update Payout & UPI Details', style: TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.bold)),
                subtitle: Text(_member?.upiId.isNotEmpty == true ? _member!.upiId : 'Tap to configure stipend UPI ID', style: const TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
                trailing: const Icon(Icons.chevron_right, color: EarnTokens.textMuted),
                onTap: _showEditAccountSheet,
              ),
              const Divider(color: Colors.white10),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
                ),
                title: const Text('Sign Out', style: TextStyle(fontSize: 13, color: Colors.redAccent, fontWeight: FontWeight.bold)),
                subtitle: const Text('End your session on this device', style: TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
                trailing: const Icon(Icons.chevron_right, color: EarnTokens.textMuted),
                onTap: widget.onSignOut,
              ),
            ],
          ),
        ),
        const SizedBox(height: 30),
      ],
    );
  }
}

