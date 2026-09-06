import 'package:flutter/material.dart';
import '../tokens/design_tokens.dart';

/// Distinctive visual badge for Meenamma Earn (Workplace & Internships)
/// Features a gold laurel / diamond workplace emblem with subtle glow.
class EarnLogoBadge extends StatefulWidget {
  final double size;
  final bool showSubtitle;

  const EarnLogoBadge({
    super.key,
    this.size = 38,
    this.showSubtitle = true,
  });

  @override
  State<EarnLogoBadge> createState() => _EarnLogoBadgeState();
}

class _EarnLogoBadgeState extends State<EarnLogoBadge> with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _pulseCtrl,
          builder: (context, child) {
            final glowAlpha = 0.2 + (_pulseCtrl.value * 0.25);
            return Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF2A200B),
                    Color(0xFF141006),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(
                  color: EarnTokens.goldPrimary.withValues(alpha: 0.6),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: EarnTokens.goldPrimary.withValues(alpha: glowAlpha),
                    blurRadius: 10,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    Icons.workspace_premium,
                    size: widget.size * 0.58,
                    color: EarnTokens.goldPrimary,
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      width: 5,
                      height: 5,
                      decoration: const BoxDecoration(
                        color: EarnTokens.goldLight,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Text(
                  'MEENAMMA',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 5),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: EarnTokens.goldPrimary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.5), width: 0.8),
                  ),
                  child: const Text(
                    'WORK',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                      color: EarnTokens.goldPrimary,
                    ),
                  ),
                ),
              ],
            ),
            if (widget.showSubtitle)
              const Text(
                'Stipend & Careers Hub',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.2,
                  color: EarnTokens.textMuted,
                ),
              ),
          ],
        ),
      ],
    );
  }
}
