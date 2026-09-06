import 'package:flutter/material.dart';

class DesignTokens {
  static const Color background = Color(0xFF090A0F);
  static const Color surface = Color(0xFF12141C);
  static const Color card = Color(0xFF181B26);
  static const Color cardBorder = Color(0x3338BDF8);

  static const Color cyan = Color(0xFF38BDF8);
  static const Color cyanDim = Color(0xFF0284C7);
  static const Color gold = Color(0xFFFFD700);

  static const Color textLight = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textDim = Color(0xFF64748B);

  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldBg = Color(0x1A10B981);
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberBg = Color(0x1AF59E0B);
  static const Color red = Color(0xFFEF4444);

  static final ThemeData theme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    primaryColor: cyan,
    colorScheme: const ColorScheme.dark(
      primary: cyan,
      secondary: cyanDim,
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
