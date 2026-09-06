import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/stock_models.dart';

class StockApiService {
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

  /// Fallback hubs
  static final List<StockPoint> defaultHubs = [
    const StockPoint(
      id: 'hub_ramesh_600028',
      name: 'Ramesh Seafood Hub',
      ownerName: 'Ramesh K.',
      pincode: '600028',
      phone: '+91 98401 22345',
      address: 'No. 14, R.K. Mutt Road, Mandaveli, Chennai',
    ),
    const StockPoint(
      id: 'hub_suresh_600004',
      name: 'Suresh Coastal Point',
      ownerName: 'Suresh M.',
      pincode: '600004',
      phone: '+91 98402 33456',
      address: 'Shop 8, Bazaar Road, Mylapore, Chennai',
    ),
    const StockPoint(
      id: 'hub_priya_600041',
      name: 'Priya Fresh Distribution',
      ownerName: 'Priya R.',
      pincode: '600041',
      phone: '+91 98403 44567',
      address: 'Plot 32, 1st Seaward Road, Valmiki Nagar, Thiruvanmiyur',
    ),
  ];

  /// Fetch all stock hubs
  static Future<List<StockPoint>> fetchStockHubs() async {
    try {
      final res = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?content_type=eq.stock_point&order=created_at.desc'),
        headers: _headers,
      );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        if (data.isNotEmpty) {
          return data.map((d) {
            final body = d['body'] as Map<String, dynamic>? ?? {};
            return StockPoint.fromJson({'id': d['slug'], ...body});
          }).toList();
        }
      }
    } catch (_) {}
    return defaultHubs;
  }

  /// Fetch incoming and past shipments for a specific hub
  static Future<List<StockShipment>> fetchShipmentsForHub(String hubId) async {
    try {
      final res = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?content_type=eq.stock_shipment&order=created_at.desc'),
        headers: _headers,
      );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        final list = data.map((d) {
          final body = d['body'] as Map<String, dynamic>? ?? {};
          return StockShipment.fromJson({'id': d['slug'], ...body});
        }).where((s) => s.hubId == hubId).toList();
        return list;
      }
    } catch (_) {}
    return [];
  }

  /// Stock member clicks "Yes, I got the food"
  /// Updates shipment status to received, updates hub inventory, and writes audit event.
  static Future<bool> acknowledgeReceipt({
    required StockShipment shipment,
    required StockPoint hub,
  }) async {
    try {
      final nowStr = DateTime.now().toIso8601String();

      // 1. Update shipment entry
      final updatedShipment = shipment.copyWith(
        status: 'received_at_hub',
        receivedAt: DateTime.now(),
      );

      await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?slug=eq.${shipment.id}'),
        headers: _headers,
        body: jsonEncode({
          'body': updatedShipment.toJson(),
        }),
      );

      // 2. Update/Credit Hub Inventory
      final invSlug = 'inv_${hub.id}';
      final currentInv = await fetchHubInventory(hub.id);

      final Map<String, StockItem> merged = {};
      for (final it in currentInv.items) {
        merged[it.fishName] = it;
      }
      for (final it in shipment.items) {
        if (merged.containsKey(it.fishName)) {
          final existing = merged[it.fishName]!;
          merged[it.fishName] = StockItem(
            fishName: it.fishName,
            count: existing.count + it.count,
            kg: existing.kg + it.kg,
            pricePerKg: it.pricePerKg > 0 ? it.pricePerKg : existing.pricePerKg,
          );
        } else {
          merged[it.fishName] = it;
        }
      }

      final newInventory = HubInventory(
        hubId: hub.id,
        pincode: hub.pincode,
        ownerName: hub.ownerName,
        items: merged.values.toList(),
        updatedAt: DateTime.now(),
      );

      // Upsert inventory
      final invRes = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?slug=eq.$invSlug'),
        headers: _headers,
      );
      final exists = invRes.statusCode == 200 && jsonDecode(invRes.body).isNotEmpty;

      if (exists) {
        await http.patch(
          Uri.parse('$supabaseUrl/rest/v1/content_entries?slug=eq.$invSlug'),
          headers: _headers,
          body: jsonEncode({'body': newInventory.toJson()}),
        );
      } else {
        await http.post(
          Uri.parse('$supabaseUrl/rest/v1/content_entries'),
          headers: _headers,
          body: jsonEncode({
            'content_type': 'stock_inventory',
            'slug': invSlug,
            'locale': 'en',
            'status': 'published',
            'created_by': systemAdminId,
            'title': 'Inventory: ${hub.ownerName} (${hub.pincode})',
            'body': newInventory.toJson(),
          }),
        );
      }

      // 3. Write Audit Event
      final auditSlug = 'audit_${DateTime.now().millisecondsSinceEpoch}';
      final itemsSummary = shipment.items.map((i) => '${i.count} ${i.fishName} (${i.kg}kg)').join(', ');
      await http.post(
        Uri.parse('$supabaseUrl/rest/v1/content_entries'),
        headers: _headers,
        body: jsonEncode({
          'content_type': 'logistics_audit',
          'slug': auditSlug,
          'locale': 'en',
          'status': 'published',
          'created_by': systemAdminId,
          'title': 'FOOD RECEIVED [PIN ${hub.pincode}]: ${hub.ownerName}',
          'body': {
            'event_type': 'food_received_by_stock_member',
            'pincode': hub.pincode,
            'actor': hub.ownerName,
            'description': '${hub.ownerName} confirmed "Yes, I got the food" for Shipment #${shipment.shipmentId} ($itemsSummary). Shop inventory updated.',
            'metadata': {
              'shipment_id': shipment.shipmentId,
              'hub_id': hub.id,
              'items': shipment.items.map((i) => i.toJson()).toList(),
            },
            'timestamp': nowStr,
          },
        }),
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Fetch live inventory for a specific hub
  static Future<HubInventory> fetchHubInventory(String hubId) async {
    try {
      final invSlug = 'inv_$hubId';
      final res = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/content_entries?slug=eq.$invSlug'),
        headers: _headers,
      );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        if (data.isNotEmpty) {
          final body = data.first['body'] as Map<String, dynamic>? ?? {};
          return HubInventory.fromJson(body);
        }
      }
    } catch (_) {}
    return HubInventory(
      hubId: hubId,
      pincode: '',
      ownerName: '',
      items: [],
      updatedAt: null,
    );
  }
}
