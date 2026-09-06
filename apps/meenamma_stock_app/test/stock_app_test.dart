import 'package:flutter_test/flutter_test.dart';
import 'package:meenamma_stock_app/models/stock_models.dart';

void main() {
  group('Stock Models Tests', () {
    test('StockPoint serialization roundtrip', () {
      const point = StockPoint(
        id: 'hub_ramesh_600028',
        name: 'Ramesh Seafood Hub',
        ownerName: 'Ramesh K.',
        pincode: '600028',
        phone: '+91 98401 22345',
        address: 'Mandaveli, Chennai',
        active: true,
      );

      final json = point.toJson();
      expect(json['id'], 'hub_ramesh_600028');
      expect(json['owner_name'], 'Ramesh K.');
      expect(json['pincode'], '600028');

      final fromJson = StockPoint.fromJson(json);
      expect(fromJson.id, point.id);
      expect(fromJson.ownerName, point.ownerName);
      expect(fromJson.pincode, '600028');
    });

    test('StockItem serialization roundtrip', () {
      const item = StockItem(
        fishName: 'Vanjaram (Seer Fish)',
        count: 1,
        kg: 2.5,
        pricePerKg: 850.0,
      );

      final json = item.toJson();
      expect(json['fish_name'], 'Vanjaram (Seer Fish)');
      expect(json['count'], 1);
      expect(json['kg'], 2.5);

      final fromJson = StockItem.fromJson(json);
      expect(fromJson.fishName, item.fishName);
      expect(fromJson.count, 1);
      expect(fromJson.kg, 2.5);
    });

    test('StockShipment model status transitions correctly', () {
      final shipment = StockShipment(
        id: 'shipment_SH-101',
        shipmentId: 'SH-101',
        hubId: 'hub_ramesh_600028',
        ownerName: 'Ramesh K.',
        pincode: '600028',
        items: const [
          StockItem(fishName: 'Vanjaram', count: 1, kg: 2.5),
          StockItem(fishName: 'Pomfret', count: 2, kg: 4.0),
        ],
        status: 'in_transit',
        dispatchedAt: DateTime(2026, 9, 6, 8, 30),
      );

      expect(shipment.status, 'in_transit');
      expect(shipment.items.length, 2);

      // Transition to received
      final received = shipment.copyWith(
        status: 'received_at_hub',
        receivedAt: DateTime(2026, 9, 6, 9, 15),
      );

      expect(received.status, 'received_at_hub');
      expect(received.receivedAt, isNotNull);
      expect(received.shipmentId, 'SH-101');
    });

    test('HubInventory correctly stores items per PIN code', () {
      final inventory = HubInventory(
        hubId: 'hub_suresh_600004',
        pincode: '600004',
        ownerName: 'Suresh M.',
        items: const [
          StockItem(fishName: 'White Pomfret', count: 2, kg: 4.0),
        ],
        updatedAt: DateTime(2026, 9, 6, 9, 30),
      );

      final json = inventory.toJson();
      expect(json['hub_id'], 'hub_suresh_600004');
      expect(json['pincode'], '600004');
      expect((json['items'] as List).length, 1);

      final fromJson = HubInventory.fromJson(json);
      expect(fromJson.pincode, '600004');
      expect(fromJson.items.first.fishName, 'White Pomfret');
      expect(fromJson.items.first.count, 2);
    });
  });
}
