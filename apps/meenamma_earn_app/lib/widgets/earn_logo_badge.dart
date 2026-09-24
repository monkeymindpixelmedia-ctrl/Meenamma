import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../tokens/design_tokens.dart';

/// Distinctive visual badge for Meenamma Earn (Workplace & Internships)
/// Features official Meenamma logo with gold glow and subtle breathing animation.
class EarnLogoBadge extends StatelessWidget {
  final double size;
  final bool showSubtitle;

  const EarnLogoBadge({
    super.key,
    this.size = 38,
    this.showSubtitle = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Official Meenamma Glowing Logo Badge
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF13181E),
            border: Border.all(
              color: EarnTokens.goldPrimary.withValues(alpha: 0.45),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: EarnTokens.goldPrimary.withValues(alpha: 0.35),
                blurRadius: 14,
                spreadRadius: 1,
              ),
            ],
          ),
          padding: const EdgeInsets.all(4),
          child: Image.asset(
            'assets/images/meenamma_logo.png',
            fit: BoxFit.contain,
          ),
        ).animate(onPlay: (controller) => controller.repeat(reverse: true))
         .scaleXY(begin: 1.0, end: 1.05, duration: 1600.ms),
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
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.2,
                    color: EarnTokens.goldPrimary,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: EarnTokens.goldPrimary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: EarnTokens.goldPrimary.withValues(alpha: 0.5), width: 0.6),
                  ),
                  child: const Text(
                    'EARN',
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                      color: EarnTokens.goldPrimary,
                    ),
                  ),
                ),
              ],
            ),
            if (showSubtitle)
              const Text(
                'மாணவர் வாய்ப்பு மையம்',
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
