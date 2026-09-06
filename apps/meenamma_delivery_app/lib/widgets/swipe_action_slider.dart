import 'package:flutter/material.dart';
import '../tokens/design_tokens.dart';

class SwipeActionSlider extends StatefulWidget {
  final String label;
  final IconData icon;
  final Color actionColor;
  final VoidCallback onConfirmed;

  const SwipeActionSlider({
    super.key,
    required this.label,
    required this.icon,
    required this.actionColor,
    required this.onConfirmed,
  });

  @override
  State<SwipeActionSlider> createState() => _SwipeActionSliderState();
}

class _SwipeActionSliderState extends State<SwipeActionSlider> {
  double _position = 0.0;
  bool _confirmed = false;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxDrag = constraints.maxWidth - 56.0;

        return Container(
          height: 56,
          decoration: BoxDecoration(
            color: DesignTokens.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: widget.actionColor.withValues(alpha: 0.3)),
          ),
          child: Stack(
            children: [
              // Progress fill
              Container(
                width: _position + 56,
                decoration: BoxDecoration(
                  color: widget.actionColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(28),
                ),
              ),

              // Center label
              Center(
                child: Text(
                  widget.label,
                  style: TextStyle(
                    color: widget.actionColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
              ),

              // Draggable thumb button
              Positioned(
                left: _position,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) {
                    if (_confirmed) return;
                    setState(() {
                      _position = (_position + details.delta.dx).clamp(0.0, maxDrag);
                    });
                  },
                  onHorizontalDragEnd: (details) {
                    if (_confirmed) return;
                    if (_position >= maxDrag * 0.85) {
                      setState(() {
                        _position = maxDrag;
                        _confirmed = true;
                      });
                      widget.onConfirmed();
                      // Reset after delay
                      Future.delayed(const Duration(seconds: 2), () {
                        if (mounted) {
                          setState(() {
                            _position = 0.0;
                            _confirmed = false;
                          });
                        }
                      });
                    } else {
                      setState(() {
                        _position = 0.0;
                      });
                    }
                  },
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: widget.actionColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: widget.actionColor.withValues(alpha: 0.5),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      _confirmed ? Icons.check : widget.icon,
                      color: Colors.black,
                      size: 24,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
