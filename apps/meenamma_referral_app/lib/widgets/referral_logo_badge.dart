import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../tokens/design_tokens.dart';

class ReferralLogoBadge extends StatelessWidget {
  const ReferralLogoBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Custom 100-Day Bounty Ring Emblem
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [RefTokens.emeraldPrimary, RefTokens.mintAccent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: RefTokens.emeraldPrimary.withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(
            Icons.stars,
            color: Colors.black,
            size: 20,
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
                    color: RefTokens.mintAccent,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: RefTokens.emeraldPrimary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: RefTokens.emeraldPrimary.withValues(alpha: 0.5), width: 0.6),
                  ),
                  child: const Text(
                    'REFERRAL',
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                      color: RefTokens.mintAccent,
                    ),
                  ),
                ),
              ],
            ),
            const Text(
              '100 நாள் சேமிப்புத் திட்டம்',
              style: TextStyle(fontSize: 10, color: RefTokens.textMuted),
            ),
          ],
        ),
      ],
    );
  }
}
