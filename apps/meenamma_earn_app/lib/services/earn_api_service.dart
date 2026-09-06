import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/earn_models.dart';

class EarnApiService {
  static const String supabaseUrl = 'https://sejfusqyxtmejbwppexe.supabase.co';
  static const String serviceRoleKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlamZ1c3F5eHRtZWpid3BwZXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU1ODczNywiZXhwIjoyMTAyMTM0NzM3fQ.JB1JpGkTiRblnc2EDoqpZTcWgASorF6XJeTYE2QrWLc';

  static Map<String, String> get _headers => {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer $serviceRoleKey',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

  /// Fetch member work record from Supabase content_entries (Two-Way Sync)
  static Future<EarnMember> fetchMember(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?content_type=eq.earn_membership&created_by=eq.$userId&limit=1'),
        headers: _headers,
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body);
        if (list is List && list.isNotEmpty) {
          return EarnMember.fromContentEntry(Map<String, dynamic>.from(list.first));
        }
      }
    } catch (_) {}

    // Fallback seed member for demonstration
    return const EarnMember(
      id: 'mem_demo',
      name: 'Kavitha S.',
      email: 'kavitha.intern@meenamma.org',
      phone: '+91 98401 23456',
      trackId: 'student',
      trackTitle: 'Student Intern',
      monthlySalary: 5000,
      organization: 'Anna University, Chennai',
      status: 'Active',
      upiId: 'kavitha@okhdfcbank',
      totalSalaryPaid: 5000,
      currentAccruedSalary: 2500,
      tasks: DeliverableTask.defaultStudentTasks,
    );
  }

  /// Register or update member in Supabase (Two-Way Sync)
  static Future<bool> registerMember({
    required String userId,
    required String name,
    required String email,
    required String phone,
    required String trackId,
    required String organization,
    required String upiId,
  }) async {
    try {
      final isStudent = trackId == 'student';
      final salary = isStudent ? 5000 : 7000;
      final trackTitle = isStudent ? 'Student Intern' : 'Housewife / Community Lead';
      final tasks = isStudent ? DeliverableTask.defaultStudentTasks : DeliverableTask.defaultHousewifeTasks;
      final nowStr = DateTime.now().toIso8601String().substring(0, 10);

      final payload = {
        'content_type': 'earn_membership',
        'slug': 'earn_${userId.substring(0, 8)}',
        'locale': 'en',
        'status': 'published',
        'title': 'Earn Member - $name',
        'created_by': userId,
        'body': {
          'user_id': userId,
          'name': name,
          'email': email,
          'phone': phone,
          'track_id': trackId,
          'track_title': trackTitle,
          'monthly_salary': salary,
          'organization': organization,
          'upi_id': upiId,
          'joined_date': nowStr,
          'status': 'Active',
          'total_paid': 0,
          'current_accrued': (salary ~/ 2),
          'tasks': tasks.map((t) => t.toJson()).toList(),
        }
      };

      final res = await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 201 || res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Submit milestone deliverable proof
  static Future<bool> submitTaskProof({
    required String membershipId,
    required String userId,
    required String taskId,
    required String proofText,
  }) async {
    try {
      final payload = {
        'content_type': 'earn_task_submission',
        'slug': 'sub_${taskId}_${DateTime.now().millisecondsSinceEpoch}',
        'locale': 'en',
        'status': 'published',
        'title': 'Task Submission $taskId',
        'created_by': userId,
        'body': {
          'membership_id': membershipId,
          'task_id': taskId,
          'proof': proofText,
          'submitted_at': DateTime.now().toIso8601String(),
          'status': 'submitted',
        }
      };

      final res = await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 5));

      return res.statusCode == 201 || res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Request UPI salary disbursement
  static Future<bool> requestSalaryDisbursement({
    required String userId,
    required int amountInr,
    required String upiId,
    required String trackTitle,
  }) async {
    try {
      final payload = {
        'content_type': 'salary_disbursement',
        'slug': 'sal_${userId.substring(0, 8)}_${DateTime.now().millisecondsSinceEpoch}',
        'locale': 'en',
        'status': 'published',
        'title': 'Salary Disbursement ₹$amountInr - $trackTitle',
        'created_by': userId,
        'body': {
          'user_id': userId,
          'amount_inr': amountInr,
          'upi_id': upiId,
          'track': trackTitle,
          'status': 'processing',
          'requested_at': DateTime.now().toIso8601String(),
        }
      };

      final res = await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 5));

      return res.statusCode == 201 || res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
