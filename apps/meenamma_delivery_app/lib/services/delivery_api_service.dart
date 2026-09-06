import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/delivery_models.dart';

class DeliveryApiService {
  static const String supabaseUrl = 'https://sejfusqyxtmejbwppexe.supabase.co';
  static const String serviceRoleKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlamZ1c3F5eHRtZWpid3BwZXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU1ODczNywiZXhwIjoyMTAyMTM0NzM3fQ.JB1JpGkTiRblnc2EDoqpZTcWgASorF6XJeTYE2QrWLc';
  static const String systemAdminId = '338b3361-779c-474e-83d0-ff95a4b55901';

  static Map<String, String> get _headers => {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer $serviceRoleKey',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

  static final List<DeliveryRider> defaultRiders = [
    const DeliveryRider(
      id: 'rider_arun_600028',
      name: 'Arun Kumar',
      pincode: '600028',
      phone: '+91 97910 11223',
      vehicle: 'Electric Scooter (TN-07-CS-4021)',
    ),
    const DeliveryRider(
      id: 'rider_vignesh_600004',
      name: 'Vignesh S.',
      pincode: '600004',
      phone: '+91 97910 22334',
      vehicle: 'Bike (TN-06-BQ-1198)',
    ),
  ];

  static Future<List<DeliveryRider>> fetchRiders() async {
    return defaultRiders;
  }

  /// Fetch all delivery orders matching rider's PIN code
  static Future<List<DeliveryOrder>> fetchOrdersForRider(DeliveryRider rider) async {
    try {
      final res = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?content_type=eq.delivery_order&order=created_at.desc'),
        headers: _headers,
      );

      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        if (data.isEmpty) {
          await _seedDemoOrders();
          return fetchOrdersForRider(rider);
        }

        final orders = data.map((d) {
          final body = d['body'] as Map<String, dynamic>? ?? {};
          return DeliveryOrder.fromJson({'id': d['slug'], ...body});
        }).where((ord) => ord.matchesRiderPincode(rider.pincode)).toList();

        return orders;
      }
    } catch (_) {}

    return [];
  }

  /// Rider selects & picks up order from the hub
  /// Customer receives notification: "Here the fishes are picked up. You'll get your order today."
  static Future<bool> pickupOrder({
    required DeliveryOrder order,
    required DeliveryRider rider,
  }) async {
    try {
      const notif = "Here the fishes are picked up. You'll get your order today.";
      final now = DateTime.now();

      final updated = order.copyWith(
        status: 'picked_up',
        riderId: rider.id,
        customerNotification: notif,
        pickedUpAt: now,
      );

      // 1. Update order in Supabase
      await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?slug=eq.${order.id}'),
        headers: _headers,
        body: jsonEncode({'body': updated.toJson()}),
      );

      // 2. Write immutable audit event
      final auditSlug = 'audit_${now.millisecondsSinceEpoch}';
      await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode({
          'content_type': 'logistics_audit',
          'slug': auditSlug,
          'locale': 'en',
          'status': 'published',
          'created_by': systemAdminId,
          'title': 'ORDER PICKED UP [PIN ${rider.pincode}]: ${rider.name}',
          'body': {
            'event_type': 'order_picked_up_by_rider',
            'pincode': rider.pincode,
            'actor': '${rider.name} (Rider)',
            'description': '${rider.name} picked up Order #${order.orderId} from ${order.hubName} (PIN ${order.pincode}). Customer notified: "$notif"',
            'metadata': {
              'order_id': order.orderId,
              'rider_id': rider.id,
              'hub_id': order.hubId,
              'customer_name': order.customerName,
              'notification': notif,
            },
            'timestamp': now.toIso8601String(),
          },
        }),
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Driver marks "The order has been delivered"
  /// Customer receives notification: "You received the order."
  static Future<bool> markOrderDelivered({
    required DeliveryOrder order,
    required DeliveryRider rider,
  }) async {
    try {
      const notif = 'You received the order.';
      final now = DateTime.now();

      final updated = order.copyWith(
        status: 'delivered',
        customerNotification: notif,
        deliveredAt: now,
      );

      // 1. Update order in Supabase
      await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?slug=eq.${order.id}'),
        headers: _headers,
        body: jsonEncode({'body': updated.toJson()}),
      );

      // 2. Write immutable audit event
      final auditSlug = 'audit_${now.millisecondsSinceEpoch}';
      await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode({
          'content_type': 'logistics_audit',
          'slug': auditSlug,
          'locale': 'en',
          'status': 'published',
          'created_by': systemAdminId,
          'title': 'ORDER DELIVERED [PIN ${rider.pincode}]: ${rider.name}',
          'body': {
            'event_type': 'order_delivered_by_rider',
            'pincode': rider.pincode,
            'actor': '${rider.name} (Rider)',
            'description': '${rider.name} marked Order #${order.orderId} as "The order has been delivered" to ${order.customerName}. Customer notified: "$notif"',
            'metadata': {
              'order_id': order.orderId,
              'rider_id': rider.id,
              'customer_name': order.customerName,
              'delivery_address': order.deliveryAddress,
              'notification': notif,
            },
            'timestamp': now.toIso8601String(),
          },
        }),
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Seed initial demo delivery orders linked to stock points & PIN codes
  static Future<void> _seedDemoOrders() async {
    final demoOrders = [
      {
        'content_type': 'delivery_order',
        'slug': 'order_ORD-204',
        'locale': 'en',
        'status': 'published',
        'created_by': systemAdminId,
        'title': 'Order ORD-204 (Mandaveli PIN 600028)',
        'body': {
          'order_id': 'ORD-204',
          'customer_name': 'Kavitha S.',
          'customer_phone': '+91 98410 44882',
          'delivery_address': 'Flat 3B, Pearl Towers, 4th Cross St, Mandaveli',
          'pincode': '600028',
          'hub_id': 'hub_ramesh_600028',
          'hub_name': 'Ramesh Seafood Hub',
          'rider_id': null,
          'items': [
            {'fish_name': 'Vanjaram (Seer Fish)', 'count': 1, 'kg': 1.5, 'price': 1275.0},
          ],
          'total_amount': 1275.0,
          'status': 'pending_pickup',
          'customer_notification': null,
          'created_at': DateTime.now().toIso8601String(),
        },
      },
      {
        'content_type': 'delivery_order',
        'slug': 'order_ORD-205',
        'locale': 'en',
        'status': 'published',
        'created_by': systemAdminId,
        'title': 'Order ORD-205 (Mylapore PIN 600004)',
        'body': {
          'order_id': 'ORD-205',
          'customer_name': 'Deepak R.',
          'customer_phone': '+91 98410 77119',
          'delivery_address': '12/4 North Mada Street, Mylapore',
          'pincode': '600004',
          'hub_id': 'hub_suresh_600004',
          'hub_name': 'Suresh Coastal Point',
          'rider_id': null,
          'items': [
            {'fish_name': 'White Pomfret (Vavval)', 'count': 2, 'kg': 2.0, 'price': 1500.0},
          ],
          'total_amount': 1500.0,
          'status': 'pending_pickup',
          'customer_notification': null,
          'created_at': DateTime.now().toIso8601String(),
        },
      },
    ];

    for (final ord in demoOrders) {
      await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode(ord),
      );
    }
  }
}
