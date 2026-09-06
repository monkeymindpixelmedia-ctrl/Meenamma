class EarnMember {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String trackId;
  final String trackTitle;
  final int monthlySalary;
  final String organization;
  final String status;
  final String upiId;
  final int totalSalaryPaid;
  final int currentAccruedSalary;
  final List<DeliverableTask> tasks;

  const EarnMember({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.trackId,
    required this.trackTitle,
    required this.monthlySalary,
    required this.organization,
    required this.status,
    required this.upiId,
    required this.totalSalaryPaid,
    required this.currentAccruedSalary,
    required this.tasks,
  });

  factory EarnMember.fromContentEntry(Map<String, dynamic> entry) {
    final body = entry['body'] is Map<String, dynamic>
        ? entry['body'] as Map<String, dynamic>
        : <String, dynamic>{};

    final rawTasks = body['tasks'] is List ? body['tasks'] as List : [];
    final tasks = rawTasks
        .map((t) => DeliverableTask.fromJson(Map<String, dynamic>.from(t as Map)))
        .toList();

    return EarnMember(
      id: entry['id']?.toString() ?? '',
      name: body['name']?.toString() ?? entry['title']?.toString() ?? 'Member',
      email: body['email']?.toString() ?? '',
      phone: body['phone']?.toString() ?? '',
      trackId: body['track_id']?.toString() ?? 'student',
      trackTitle: body['track_title']?.toString() ?? 'Student Intern',
      monthlySalary: (body['monthly_salary'] as num?)?.toInt() ?? 5000,
      organization: body['organization']?.toString() ?? 'Anna University',
      status: body['status']?.toString() ?? 'Active',
      upiId: body['upi_id']?.toString() ?? 'member@upi',
      totalSalaryPaid: (body['total_paid'] as num?)?.toInt() ?? 5000,
      currentAccruedSalary: (body['current_accrued'] as num?)?.toInt() ?? 2500,
      tasks: tasks.isNotEmpty ? tasks : DeliverableTask.defaultStudentTasks,
    );
  }
}

class DeliverableTask {
  final String id;
  final String title;
  final String week;
  final int stipendCredit;
  final String status; // 'todo', 'submitted', 'verified'
  final String? proof;

  const DeliverableTask({
    required this.id,
    required this.title,
    required this.week,
    required this.stipendCredit,
    required this.status,
    this.proof,
  });

  factory DeliverableTask.fromJson(Map<String, dynamic> json) {
    return DeliverableTask(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      week: json['week']?.toString() ?? 'Week 1',
      stipendCredit: (json['stipendCredit'] as num?)?.toInt() ?? 1250,
      status: json['status']?.toString() ?? 'todo',
      proof: json['proof']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'week': week,
        'stipendCredit': stipendCredit,
        'status': status,
        if (proof != null) 'proof': proof,
      };

  static const List<DeliverableTask> defaultStudentTasks = [
    DeliverableTask(id: 't1', title: 'Host campus awareness booth for 100-Day savings', stipendCredit: 1250, week: 'Week 1', status: 'verified'),
    DeliverableTask(id: 't2', title: 'Onboard 5 student hostel flats for weekend hauls', stipendCredit: 1250, week: 'Week 2', status: 'verified'),
    DeliverableTask(id: 't3', title: 'Submit weekly campus dining feedback report', stipendCredit: 1250, week: 'Week 3', status: 'submitted'),
    DeliverableTask(id: 't4', title: 'Conduct survey on Kasimedu seafood consumption', stipendCredit: 1250, week: 'Week 4', status: 'todo'),
  ];

  static const List<DeliverableTask> defaultHousewifeTasks = [
    DeliverableTask(id: 't1', title: 'Organize residential group fresh catch order run', stipendCredit: 1750, week: 'Week 1', status: 'verified'),
    DeliverableTask(id: 't2', title: 'Manage Saturday morning delivery distribution', stipendCredit: 1750, week: 'Week 2', status: 'verified'),
    DeliverableTask(id: 't3', title: 'Enroll 4 apartment families into Daily Kudam savings', stipendCredit: 1750, week: 'Week 3', status: 'submitted'),
    DeliverableTask(id: 't4', title: 'Weekly community hygiene & freshness audit', stipendCredit: 1750, week: 'Week 4', status: 'todo'),
  ];
}
