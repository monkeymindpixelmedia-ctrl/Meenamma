import 'package:flutter/material.dart';

class DesignTokens {
  static const Color background = Color(0xFF070605);
  static const Color surface = Color(0xFF0F0E0C);
  static const Color card = Color(0xFF161411);
  static const Color cardBorder = Color(0x33FFD700);

  static const Color gold = Color(0xFFFFD700);
  static const Color goldDim = Color(0xFFC59B27);
  static const Color goldLight = Color(0xFFFFF0A0);

  static const Color textLight = Color(0xFFF5F2EB);
  static const Color textMuted = Color(0xFFA8A090);
  static const Color textDim = Color(0xFF6B665C);

  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldBg = Color(0x1A10B981);
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberBg = Color(0x1AF59E0B);
  static const Color red = Color(0xFFEF4444);

  static final ThemeData theme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    primaryColor: gold,
    colorScheme: const ColorScheme.dark(
      primary: gold,
      secondary: goldDim,
      surface: surface,
    ),
    fontFamily: 'sans-serif',
    appBarTheme: const AppBarTheme(
      backgroundColor: background,
      elevation: 0,
      centerTitle: false,
    ),
  );
}
