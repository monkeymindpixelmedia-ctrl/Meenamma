class ReferralPartner {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String referralCode;
  final String upiId;

  const ReferralPartner({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.referralCode,
    required this.upiId,
  });

  factory ReferralPartner.fromJson(Map<String, dynamic> json) {
    return ReferralPartner(
      id: json['id']?.toString() ?? '',
      name: json['display_name']?.toString() ?? json['name']?.toString() ?? 'Partner',
      email: json['email']?.toString() ?? '',
      phone: json['phone_e164']?.toString() ?? json['phone']?.toString() ?? '',
      referralCode: json['referral_code']?.toString() ?? 'RATH338B',
      upiId: json['upi_id']?.toString() ?? 'partner@okhdfcbank',
    );
  }
}

class SubscriberRecord {
  final String id;
  final String name;
  final String phone;
  final int dailyPlan; // 1, 2, 5
  final String startDate;
  final int cycleDay; // 1 to 100
  final bool isCompleted;
  final int rewardAmount; // 200, 400, 600

  const SubscriberRecord({
    required this.id,
    required this.name,
    required this.phone,
    required this.dailyPlan,
    required this.startDate,
    required this.cycleDay,
    required this.isCompleted,
    required this.rewardAmount,
  });

  static int calculateReward(int plan) {
    if (plan == 1) return 200;
    if (plan == 2) return 400;
    if (plan == 5) return 600;
    return plan * 120;
  }

  factory SubscriberRecord.fromContentEntry(Map<String, dynamic> entry) {
    final body = entry['body'] is Map<String, dynamic>
        ? entry['body'] as Map<String, dynamic>
        : <String, dynamic>{};

    final plan = (body['daily_plan'] as num?)?.toInt() ?? 1;
    final reward = calculateReward(plan);
    final startDate = body['start_date']?.toString() ?? entry['created_at']?.toString().substring(0, 10) ?? '';

    int day = (body['cycle_day'] as num?)?.toInt() ?? 1;
    if (startDate.isNotEmpty) {
      try {
        final start = DateTime.parse(startDate);
        final diff = DateTime.now().difference(start).inDays;
        day = (diff + 1).clamp(1, 100);
      } catch (_) {}
    }

    final completed = day >= 100 || body['completed'] == true;

    return SubscriberRecord(
      id: entry['id']?.toString() ?? '',
      name: body['subscriber_name']?.toString() ?? entry['title']?.toString() ?? 'Subscriber',
      phone: body['subscriber_phone']?.toString() ?? '9840******',
      dailyPlan: plan,
      startDate: startDate,
      cycleDay: day,
      isCompleted: completed,
      rewardAmount: reward,
    );
  }
}
