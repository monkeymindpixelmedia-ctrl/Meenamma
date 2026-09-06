import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../tokens/design_tokens.dart';

class StockLogoBadge extends StatelessWidget {
  const StockLogoBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Custom Harbor Crate & Scales Emblem
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [DesignTokens.gold, DesignTokens.goldDim],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: DesignTokens.gold.withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(
            Icons.inventory_2,
            color: Colors.black,
            size: 20,
          ),
        ).animate(onPlay: (controller) => controller.repeat(reverse: true))
         .scaleXY(begin: 1.0, end: 1.05, duration: 1800.ms),
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
                    color: DesignTokens.gold,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: DesignTokens.gold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: DesignTokens.gold.withValues(alpha: 0.5), width: 0.6),
                  ),
                  child: const Text(
                    'HUB',
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                      color: DesignTokens.gold,
                    ),
                  ),
                ),
              ],
            ),
            const Text(
              'மீனம்மை இருப்பு மையம்',
              style: TextStyle(fontSize: 10, color: DesignTokens.textMuted),
            ),
          ],
        ),
      ],
    );
  }
}
