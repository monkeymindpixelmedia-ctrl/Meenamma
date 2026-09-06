import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'models/earn_models.dart';
import 'services/earn_api_service.dart';
import 'tokens/design_tokens.dart';
import 'widgets/earn_logo_badge.dart';

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

class MeenammaEarnApp extends StatelessWidget {
  const MeenammaEarnApp({super.key});

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
      home: const MainEarnShell(),
    );
  }
}

class MainEarnShell extends StatefulWidget {
  const MainEarnShell({super.key});

  @override
  State<MainEarnShell> createState() => _MainEarnShellState();
}

class _MainEarnShellState extends State<MainEarnShell> {
  EarnMember? _member;
  bool _isLoading = false;
  String _currentUserId = '338b3361-779c-474e-83d0-ff95a4b55901';

  @override
  void initState() {
    super.initState();
    _loadMemberData(_currentUserId);
  }

  Future<void> _loadMemberData(String userId) async {
    setState(() => _isLoading = true);
    final mem = await EarnApiService.fetchMember(userId);
    setState(() {
      _currentUserId = userId;
      _member = mem;
      _isLoading = false;
    });
  }

  void _showSubmitProofSheet(DeliverableTask task) {
    final proofCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: EarnTokens.surfaceDark,
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Submit Deliverable Proof',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: EarnTokens.textLight),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: EarnTokens.textMuted),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: EarnTokens.goldPrimary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: EarnTokens.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${task.week}: ${task.title}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: EarnTokens.goldLight)),
                  const SizedBox(height: 4),
                  Text('Stipend credit upon verification: ₹${task.stipendCredit}', style: const TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: proofCtrl,
              maxLines: 4,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Activity Summary / Drive Link / Group Notes',
                labelStyle: const TextStyle(color: EarnTokens.textMuted),
                filled: true,
                fillColor: EarnTokens.surfaceCard,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
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
                  if (proofCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  setState(() => _isLoading = true);
                  await EarnApiService.submitTaskProof(
                    membershipId: _member!.id,
                    userId: _currentUserId,
                    taskId: task.id,
                    proofText: proofCtrl.text.trim(),
                  );
                  // Update local task state
                  final updatedTasks = _member!.tasks.map((t) {
                    if (t.id == task.id) {
                      return DeliverableTask(
                        id: t.id,
                        title: t.title,
                        week: t.week,
                        stipendCredit: t.stipendCredit,
                        status: 'submitted',
                        proof: proofCtrl.text.trim(),
                      );
                    }
                    return t;
                  }).toList();

                  setState(() {
                    _member = EarnMember(
                      id: _member!.id,
                      name: _member!.name,
                      email: _member!.email,
                      phone: _member!.phone,
                      trackId: _member!.trackId,
                      trackTitle: _member!.trackTitle,
                      monthlySalary: _member!.monthlySalary,
                      organization: _member!.organization,
                      status: _member!.status,
                      upiId: _member!.upiId,
                      totalSalaryPaid: _member!.totalSalaryPaid,
                      currentAccruedSalary: _member!.currentAccruedSalary,
                      tasks: updatedTasks,
                    );
                    _isLoading = false;
                  });

                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Deliverable submitted for review! Synced with un.meenamma.')),
                    );
                  }
                },
                child: const Text('SUBMIT FOR VERIFICATION', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDisburseSalaryModal() {
    final upiCtrl = TextEditingController(text: _member?.upiId ?? 'kavitha@okhdfcbank');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: EarnTokens.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Withdraw Accrued Salary', style: TextStyle(color: EarnTokens.textLight, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current Accrued Balance:', style: TextStyle(color: EarnTokens.textMuted, fontSize: 12)),
            const SizedBox(height: 4),
            Text('₹${_member?.currentAccruedSalary ?? 0}', style: const TextStyle(color: EarnTokens.goldPrimary, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: upiCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'UPI ID for Salary Transfer',
                labelStyle: const TextStyle(color: EarnTokens.textMuted),
                filled: true,
                fillColor: EarnTokens.surfaceCard,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: EarnTokens.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: EarnTokens.goldPrimary, foregroundColor: Colors.black),
            onPressed: () async {
              Navigator.pop(ctx);
              await EarnApiService.requestSalaryDisbursement(
                userId: _currentUserId,
                amountInr: _member?.currentAccruedSalary ?? 0,
                upiId: upiCtrl.text.trim(),
                trackTitle: _member?.trackTitle ?? 'Student Intern',
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Salary disbursement initiated! Transferred via UPI within 2 hours.')),
                );
              }
            },
            child: const Text('CONFIRM TRANSFER'),
          ),
        ],
      ),
    );
  }

  void _showTrackSwitcher() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: EarnTokens.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Switch Work Track', style: TextStyle(color: EarnTokens.textLight, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              tileColor: _member?.trackId == 'student' ? EarnTokens.goldPrimary.withValues(alpha: 0.15) : EarnTokens.surfaceCard,
              leading: const Icon(Icons.school, color: EarnTokens.goldPrimary),
              title: const Text('Student Intern', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              subtitle: const Text('₹5,000 / month · 10-12 hrs/week', style: TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
              onTap: () async {
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                await EarnApiService.registerMember(
                  userId: _currentUserId,
                  name: _member?.name ?? 'Student Intern',
                  email: _member?.email ?? 'intern@meenamma.org',
                  phone: _member?.phone ?? '+91 98401 23456',
                  trackId: 'student',
                  organization: 'Anna University, Chennai',
                  upiId: _member?.upiId ?? 'member@upi',
                );
                await _loadMemberData(_currentUserId);
              },
            ),
            const SizedBox(height: 8),
            ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              tileColor: _member?.trackId == 'housewife' ? EarnTokens.goldPrimary.withValues(alpha: 0.15) : EarnTokens.surfaceCard,
              leading: const Icon(Icons.apartment, color: EarnTokens.goldPrimary),
              title: const Text('Housewife / Community Lead', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              subtitle: const Text('₹7,000 / month · Apartment group management', style: TextStyle(fontSize: 11, color: EarnTokens.textMuted)),
              onTap: () async {
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                await EarnApiService.registerMember(
                  userId: _currentUserId,
                  name: _member?.name ?? 'Community Lead',
                  email: _member?.email ?? 'lead@meenamma.org',
                  phone: _member?.phone ?? '+91 98401 23456',
                  trackId: 'housewife',
                  organization: 'T. Nagar Community, Chennai',
                  upiId: _member?.upiId ?? 'member@upi',
                );
                await _loadMemberData(_currentUserId);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final verifiedCount = _member?.tasks.where((t) => t.status == 'verified').length ?? 0;
    final totalTasks = _member?.tasks.length ?? 4;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: EarnTokens.canvasNight,
        elevation: 0,
        title: const EarnLogoBadge(),
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz, color: EarnTokens.goldPrimary),
            onPressed: _showTrackSwitcher,
            tooltip: 'Switch Track',
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: EarnTokens.goldLight),
            onPressed: () => _loadMemberData(_currentUserId),
            tooltip: 'Sync Cloud',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: EarnTokens.goldPrimary))
          : RefreshIndicator(
              color: EarnTokens.goldPrimary,
              onRefresh: () => _loadMemberData(_currentUserId),
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Member Profile Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [EarnTokens.surfaceCard, EarnTokens.surfaceDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: EarnTokens.borderSubtle),
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
                                Text(_member?.name ?? 'Member', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: EarnTokens.textLight)),
                                Text(_member?.organization ?? '', style: const TextStyle(fontSize: 12, color: EarnTokens.textMuted)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: EarnTokens.goldPrimary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.3)),
                              ),
                              child: Text(_member?.trackTitle ?? 'Student Intern', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.goldLight)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: EarnTokens.borderCard),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('FIXED MONTHLY SALARY', style: TextStyle(fontSize: 9, color: EarnTokens.textDim, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text('₹${_member?.monthlySalary ?? 5000} / mo', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: EarnTokens.emeraldSuccess.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text('GUARANTEED BASE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: EarnTokens.emeraldSuccess)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).animate().fade().slideY(begin: 0.05, end: 0),

                  const SizedBox(height: 16),

                  // 3 Salary & Milestones Cards
                  Row(
                    children: [
                      _kpiCard('Accrued Pay', '₹${_member?.currentAccruedSalary ?? 2500}', 'Current Month', EarnTokens.goldPrimary),
                      const SizedBox(width: 10),
                      _kpiCard('Total Disbursed', '₹${_member?.totalSalaryPaid ?? 5000}', 'Lifetime Paid', EarnTokens.textLight),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Withdraw Action Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: EarnTokens.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('AVAILABLE FOR DISBURSEMENT', style: TextStyle(fontSize: 9, color: EarnTokens.goldLight, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Text('₹${_member?.currentAccruedSalary ?? 2500}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
                          ],
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: EarnTokens.goldPrimary,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _showDisburseSalaryModal,
                          child: const Text('DISBURSE UPI', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Deliverables Section Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Weekly Deliverables', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: EarnTokens.textLight)),
                      Text('$verifiedCount / $totalTasks Verified', style: const TextStyle(fontSize: 12, color: EarnTokens.emeraldSuccess, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Deliverable task list
                  ...(_member?.tasks ?? []).map((t) => _taskTile(t)),

                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _kpiCard(String title, String value, String sub, Color valColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: EarnTokens.surfaceCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: EarnTokens.borderCard),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title.toUpperCase(), style: const TextStyle(fontSize: 9, color: EarnTokens.textDim, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: valColor)),
            const SizedBox(height: 2),
            Text(sub, style: const TextStyle(fontSize: 10, color: EarnTokens.textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _taskTile(DeliverableTask task) {
    final isVerified = task.status == 'verified';
    final isSubmitted = task.status == 'submitted';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isVerified ? EarnTokens.emeraldSuccess.withValues(alpha: 0.1) : EarnTokens.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isVerified ? EarnTokens.emeraldSuccess.withValues(alpha: 0.3) : EarnTokens.borderCard),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: EarnTokens.goldPrimary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(task.week, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.goldLight)),
              ),
              Text(
                'Credit: ₹${task.stipendCredit}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(task.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: EarnTokens.textLight)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    isVerified ? Icons.check_circle : (isSubmitted ? Icons.hourglass_top : Icons.radio_button_unchecked),
                    size: 14,
                    color: isVerified ? EarnTokens.emeraldSuccess : (isSubmitted ? EarnTokens.goldLight : EarnTokens.textMuted),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isVerified ? 'VERIFIED' : (isSubmitted ? 'UNDER REVIEW' : 'PENDING'),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isVerified ? EarnTokens.emeraldSuccess : (isSubmitted ? EarnTokens.goldLight : EarnTokens.textMuted),
                    ),
                  ),
                ],
              ),
              if (!isVerified && !isSubmitted)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: EarnTokens.goldPrimary,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.upload_file, size: 13),
                  label: const Text('SUBMIT PROOF', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  onPressed: () => _showSubmitProofSheet(task),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
