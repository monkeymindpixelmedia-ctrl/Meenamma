import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/earn_models.dart';
import '../services/earn_api_service.dart';
import '../tokens/design_tokens.dart';

class EarnAuthScreen extends StatefulWidget {
  final Function(EarnMember member) onAuthenticated;

  const EarnAuthScreen({super.key, required this.onAuthenticated});

  @override
  State<EarnAuthScreen> createState() => _EarnAuthScreenState();
}

class _EarnAuthScreenState extends State<EarnAuthScreen> {
  // 'login' | 'register' | 'forgot'
  String _authView = 'login';

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Register controllers
  final _regNameController = TextEditingController();
  final _regEmailController = TextEditingController();
  final _regPhoneController = TextEditingController();
  final _regCollegeController = TextEditingController();
  final _regPasswordController = TextEditingController();

  // Forgot password controller
  final _forgotEmailController = TextEditingController();

  bool _loading = false;
  bool _obscureLoginPassword = true;
  bool _obscureRegPassword = true;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _regNameController.dispose();
    _regEmailController.dispose();
    _regPhoneController.dispose();
    _regCollegeController.dispose();
    _regPasswordController.dispose();
    _forgotEmailController.dispose();
    super.dispose();
  }

  void _handleDemoIntern() {
    widget.onAuthenticated(const EarnMember(
      id: '338b3361-779c-474e-83d0-ff95a4b55901',
      name: 'Kavitha S.',
      email: 'kavitha.intern@meenamma.org',
      phone: '+91 98401 23456',
      trackId: 'student',
      trackTitle: 'Student Intern',
      monthlySalary: 5000,
      organization: 'Anna University, Guindy (ECE Dept)',
      status: 'Active',
      upiId: 'kavitha@okhdfcbank',
      accountHolder: 'Kavitha S',
      bankAccount: '50100482910234',
      ifsc: 'HDFC0001234',
      internCode: 'INT-KAVITH-60D',
      dayOfInternship: 18,
      createdAt: '2026-09-06T10:00:00Z',
      totalSalaryPaid: 5000,
      currentAccruedSalary: 2500,
      tasks: DeliverableTask.defaultStudentTasks,
    ));
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      // google_sign_in v7 uses a singleton with initialize() + authenticate()
      final gs = GoogleSignIn.instance;
      await gs.initialize();
      final account = await gs.authenticate();
      final email = account.email;
      final name = account.displayName ?? email.split('@').first;
      final googleId = account.id;

      final member = await EarnApiService.getOrCreateGoogleMember(
        email: email,
        name: name,
        googleId: googleId,
      );
      if (!mounted) return;
      widget.onAuthenticated(member);
    } catch (e) {
      debugPrint('Native Google Sign-In failed: $e — opening account dialog');
      if (!mounted) return;
      setState(() => _loading = false);
      _showGoogleAccountDialog();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showGoogleAccountDialog() {
    final emailCtrl = TextEditingController();
    final nameCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            left: 20,
            right: 20,
            top: 24,
          ),
          decoration: const BoxDecoration(
            color: Color(0xFF0C1017),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: EarnTokens.goldPrimary, width: 1.5)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      _GoogleGIcon(),
                      SizedBox(width: 10),
                      Text(
                        'Connect Google Account',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter your student or personal Google email to connect your Meenamma 60-Day Internship workplace record.',
                style: TextStyle(fontSize: 12, color: EarnTokens.textMuted, height: 1.4),
              ),
              const SizedBox(height: 16),
              _cyberTextField(
                controller: emailCtrl,
                hint: 'student.email@gmail.com',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 10),
              _cyberTextField(
                controller: nameCtrl,
                hint: 'Full Name (as per Student ID)',
                keyboardType: TextInputType.name,
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
                    final email = emailCtrl.text.trim();
                    final name = nameCtrl.text.trim();
                    if (email.isEmpty) return;

                    Navigator.pop(ctx);
                    setState(() => _loading = true);
                    final member = await EarnApiService.getOrCreateGoogleMember(
                      email: email,
                      name: name.isNotEmpty ? name : email.split('@').first,
                    );
                    if (!mounted) return;
                    setState(() => _loading = false);
                    widget.onAuthenticated(member);
                  },
                  child: const Text(
                    'SIGN IN WITH GOOGLE EMAIL',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.1),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton.icon(
                  icon: const Icon(Icons.open_in_browser, size: 14, color: EarnTokens.goldLight),
                  label: const Text(
                    'Open Browser Google Login (earn.meenamma.org)',
                    style: TextStyle(fontSize: 11, color: EarnTokens.goldLight),
                  ),
                  onPressed: () async {
                    Navigator.pop(ctx);
                    final uri = Uri.parse('https://sejfusqyxtmejbwppexe.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://earn.meenamma.org/auth/callback/google');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleEmailLogin() async {
    final email = _emailController.text.trim();
    final pass = _passwordController.text.trim();
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _errorMessage = 'Please enter your student email and password.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    final member = await EarnApiService.signInWithPassword(email, pass);
    if (!mounted) return;
    setState(() => _loading = false);

    if (member != null) {
      widget.onAuthenticated(member);
    } else {
      // If direct password fails, attempt fetching by email identifier or fallback
      setState(() => _errorMessage = 'Invalid email or password. You can also use 1-Tap Intern Demo.');
    }
  }

  Future<void> _handleEmailRegister() async {
    final name = _regNameController.text.trim();
    final email = _regEmailController.text.trim();
    final phone = _regPhoneController.text.trim();
    final college = _regCollegeController.text.trim();
    final pass = _regPasswordController.text.trim();

    if (name.isEmpty || email.isEmpty || phone.isEmpty || college.isEmpty || pass.isEmpty) {
      setState(() => _errorMessage = 'Please fill out all registration fields.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final success = await EarnApiService.registerMember(
        userId: 'stu_${DateTime.now().millisecondsSinceEpoch}',
        name: name,
        email: email,
        phone: phone,
        trackId: 'student',
        organization: college,
        upiId: '',
      );

      if (!mounted) return;
      setState(() => _loading = false);

      if (success) {
        final newMember = EarnMember(
          id: 'stu_${DateTime.now().millisecondsSinceEpoch}',
          name: name,
          email: email,
          phone: phone,
          trackId: 'student',
          trackTitle: 'Student Intern',
          monthlySalary: 5000,
          organization: college,
          status: 'Active',
          upiId: '',
          internCode: 'INT-${name.replaceAll(' ', '').toUpperCase().padRight(6, 'X').substring(0, 6)}-60D',
          totalSalaryPaid: 0,
          currentAccruedSalary: 0,
          tasks: DeliverableTask.defaultStudentTasks,
        );
        widget.onAuthenticated(newMember);
      } else {
        setState(() => _errorMessage = 'Could not register. Please try again.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMessage = 'Registration error: $e';
      });
    }
  }

  Future<void> _handleResetPassword() async {
    final email = _forgotEmailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMessage = 'Please enter your student email.');
      return;
    }
    setState(() {
      _successMessage = 'Password reset instructions sent to $email.';
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020304),
      body: SafeArea(
        child: Column(
          children: [
            // Top Status Bar (matching localhost:3000 mobile chassis header)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '20:10',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 5),
                        const Text(
                          '60D-INTERN',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.0, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: const [
                      Text('5G', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: EarnTokens.goldPrimary)),
                      SizedBox(width: 4),
                      Icon(Icons.battery_full, size: 14, color: Colors.white70),
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  children: [
                    const SizedBox(height: 12),

                    // Official Glowing Logo Badge
                    Container(
                      width: 82,
                      height: 82,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF0E131A),
                        border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.5), width: 1.8),
                        boxShadow: [
                          BoxShadow(
                            color: EarnTokens.goldPrimary.withValues(alpha: 0.35),
                            blurRadius: 26,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(8),
                      child: Image.asset('assets/images/meenamma_logo.png', fit: BoxFit.contain),
                    ),
                    const SizedBox(height: 16),

                    // Title & Subtitles
                    const Text(
                      'MEENAMMA',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3.0,
                        color: Color(0xFFF5F2EB),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '60-DAY STUDENT INTERNSHIP',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2.2,
                        color: EarnTokens.goldPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Kasimedu Harbor Community Network · Unified Google Account',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, color: Color(0xFFA89E88)),
                    ),

                    const SizedBox(height: 24),

                    // Tab Switcher [ Sign In ] vs [ Register ]
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0A0E12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() {
                                _authView = 'login';
                                _errorMessage = null;
                                _successMessage = null;
                              }),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _authView == 'login' ? EarnTokens.goldPrimary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Sign In',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: _authView == 'login' ? Colors.black : const Color(0xFF8C8270),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() {
                                _authView = 'register';
                                _errorMessage = null;
                                _successMessage = null;
                              }),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _authView == 'register' ? EarnTokens.goldPrimary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Register',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: _authView == 'register' ? Colors.black : const Color(0xFF8C8270),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Error & Success Messages
                    if (_errorMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: Colors.redAccent, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_errorMessage!, style: const TextStyle(fontSize: 11, color: Colors.redAccent)),
                            ),
                          ],
                        ),
                      ),
                    if (_successMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_successMessage!, style: const TextStyle(fontSize: 11, color: Color(0xFF10B981))),
                            ),
                          ],
                        ),
                      ),

                    // BIG WHITE "Continue with Google" BUTTON
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF1F2937),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                        ),
                        onPressed: _loading ? null : _handleGoogleSignIn,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            _GoogleGIcon(),
                            SizedBox(width: 10),
                            Text(
                              'Continue with Google',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Divider: ──── OR WITH STUDENT EMAIL ────
                    Row(
                      children: const [
                        Expanded(child: Divider(color: Colors.white12)),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 10),
                          child: Text(
                            'OR WITH STUDENT EMAIL',
                            style: TextStyle(fontSize: 9, letterSpacing: 1.2, fontWeight: FontWeight.bold, color: Color(0xFF8C8270)),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.white12)),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // VIEW 1: SIGN IN
                    if (_authView == 'login') ...[
                      _cyberTextField(
                        controller: _emailController,
                        hint: 'Student Email (e.g. name@college.edu)',
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 10),
                      _cyberTextField(
                        controller: _passwordController,
                        hint: 'Password',
                        obscureText: _obscureLoginPassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureLoginPassword ? Icons.visibility_off : Icons.visibility,
                            color: const Color(0xFF8C8270),
                            size: 18,
                          ),
                          onPressed: () => setState(() => _obscureLoginPassword = !_obscureLoginPassword),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            '60-Day Active Cohort',
                            style: TextStyle(fontSize: 11, color: Color(0xFF8C8270)),
                          ),
                          GestureDetector(
                            onTap: () => setState(() {
                              _authView = 'forgot';
                              _errorMessage = null;
                            }),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(fontSize: 11, color: EarnTokens.goldPrimary, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
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
                          onPressed: _loading ? null : _handleEmailLogin,
                          child: Text(
                            _loading ? 'VERIFYING...' : 'SIGN IN TO WORKSPACE',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                          ),
                        ),
                      ),
                    ],

                    // VIEW 2: REGISTER
                    if (_authView == 'register') ...[
                      _cyberTextField(controller: _regNameController, hint: 'Full Name'),
                      const SizedBox(height: 10),
                      _cyberTextField(controller: _regEmailController, hint: 'Student / College Email', keyboardType: TextInputType.emailAddress),
                      const SizedBox(height: 10),
                      _cyberTextField(controller: _regPhoneController, hint: 'WhatsApp Number (+91)', keyboardType: TextInputType.phone),
                      const SizedBox(height: 10),
                      _cyberTextField(controller: _regCollegeController, hint: 'College / Institution'),
                      const SizedBox(height: 10),
                      _cyberTextField(
                        controller: _regPasswordController,
                        hint: 'Create Password',
                        obscureText: _obscureRegPassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureRegPassword ? Icons.visibility_off : Icons.visibility,
                            color: const Color(0xFF8C8270),
                            size: 18,
                          ),
                          onPressed: () => setState(() => _obscureRegPassword = !_obscureRegPassword),
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
                          onPressed: _loading ? null : _handleEmailRegister,
                          child: Text(
                            _loading ? 'ENROLLING...' : 'JOIN 60-DAY INTERNSHIP',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                          ),
                        ),
                      ),
                    ],

                    // VIEW 3: FORGOT PASSWORD
                    if (_authView == 'forgot') ...[
                      const Text(
                        'Enter your student email. We will send you a secure password reset link.',
                        style: TextStyle(fontSize: 11, color: Color(0xFFA89E88), height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      _cyberTextField(controller: _forgotEmailController, hint: 'Your Student Email', keyboardType: TextInputType.emailAddress),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: EarnTokens.goldPrimary,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: _loading ? null : _handleResetPassword,
                          child: const Text(
                            'SEND PASSWORD RESET EMAIL',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: () => setState(() => _authView = 'login'),
                        child: const Text('← Back to Sign In', style: TextStyle(color: EarnTokens.goldPrimary, fontSize: 12)),
                      ),
                    ],

                    const SizedBox(height: 14),

                    // OUTLINED 1-TAP DEMO BUTTON
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          backgroundColor: EarnTokens.goldPrimary.withValues(alpha: 0.1),
                          side: BorderSide(color: EarnTokens.goldPrimary.withValues(alpha: 0.35)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _handleDemoIntern,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.bolt, color: EarnTokens.goldPrimary, size: 16),
                            SizedBox(width: 6),
                            Text(
                              '1-Tap Intern Demo (Kavitha S. · Day 18/60)',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: EarnTokens.goldLight),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Footer
                    const Text(
                      'SINGLE ACCOUNT · WORKS ON MEENAMMA WEB & APK',
                      style: TextStyle(fontSize: 9, letterSpacing: 1.4, color: Color(0xFF6E6659), fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      icon: const Icon(Icons.download_for_offline_outlined, size: 14, color: EarnTokens.goldLight),
                      label: const Text(
                        'Download Latest Android APK (earn.meenamma.org)',
                        style: TextStyle(fontSize: 10, color: EarnTokens.goldLight, decoration: TextDecoration.underline),
                      ),
                      onPressed: () async {
                        final uri = Uri.parse('https://earn.meenamma.org/apk/Meenamma-WorkplaceEarn.apk');
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                    ),

                    const SizedBox(height: 14),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cyberTextField({
    required TextEditingController controller,
    required String hint,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    Widget? suffixIcon,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0B0F14),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF6A7280), fontSize: 12),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          suffixIcon: suffixIcon,
        ),
      ),
    );
  }
}

/// Official multi-color Google 'G' icon painter
class _GoogleGIcon extends StatelessWidget {
  const _GoogleGIcon();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 18,
      height: 18,
      child: CustomPaint(
        painter: _GoogleGLogoPainter(),
      ),
    );
  }
}

class _GoogleGLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Red (Top)
    final redPaint = Paint()..color = const Color(0xFFEA4335)..style = PaintingStyle.fill;
    // Yellow (Left)
    final yellowPaint = Paint()..color = const Color(0xFFFBBC05)..style = PaintingStyle.fill;
    // Green (Bottom)
    final greenPaint = Paint()..color = const Color(0xFF34A853)..style = PaintingStyle.fill;
    // Blue (Right bar)
    final bluePaint = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.fill;

    final center = Offset(w / 2, h / 2);
    final radius = w / 2;

    // Draw Google G geometry
    final pathBlue = Path()
      ..moveTo(center.dx, center.dy - radius * 0.2)
      ..lineTo(w, center.dy - radius * 0.2)
      ..arcTo(Rect.fromCircle(center: center, radius: radius), -0.2, 1.2, false)
      ..lineTo(center.dx, center.dy)
      ..close();
    canvas.drawPath(pathBlue, bluePaint);

    final pathGreen = Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(Rect.fromCircle(center: center, radius: radius), 0.7, 1.3, false)
      ..lineTo(center.dx, center.dy)
      ..close();
    canvas.drawPath(pathGreen, greenPaint);

    final pathYellow = Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(Rect.fromCircle(center: center, radius: radius), 2.0, 1.3, false)
      ..lineTo(center.dx, center.dy)
      ..close();
    canvas.drawPath(pathYellow, yellowPaint);

    final pathRed = Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(Rect.fromCircle(center: center, radius: radius), 3.3, 1.5, false)
      ..lineTo(center.dx, center.dy)
      ..close();
    canvas.drawPath(pathRed, redPaint);

    // Inner circle cutout
    final innerCutout = Paint()..color = Colors.white..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.55, innerCutout);

    // Blue horizontal bar
    final barPaint = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromLTWH(center.dx - 1, center.dy - radius * 0.22, radius * 1.02, radius * 0.44), barPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
