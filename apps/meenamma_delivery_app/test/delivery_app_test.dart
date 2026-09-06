import 'package:flutter_test/flutter_test.dart';
import 'package:meenamma_delivery_app/models/delivery_models.dart';

void main() {
  group('Delivery Models & Routing Tests', () {
    test('DeliveryRider serialization roundtrip', () {
      const rider = DeliveryRider(
        id: 'rider_arun_600028',
        name: 'Arun Kumar',
        pincode: '600028',
        phone: '+91 97910 11223',
        vehicle: 'Electric Scooter',
        active: true,
      );

      final json = rider.toJson();
      expect(json['id'], 'rider_arun_600028');
      expect(json['pincode'], '600028');

      final fromJson = DeliveryRider.fromJson(json);
      expect(fromJson.name, 'Arun Kumar');
      expect(fromJson.pincode, '600028');
    });

    test('Strict PIN code matching between Rider and Customer', () {
      const order1 = DeliveryOrder(
        id: 'order_ORD-204',
        orderId: 'ORD-204',
        customerName: 'Kavitha S.',
        customerPhone: '+91 98410 44882',
        deliveryAddress: 'Mandaveli, Chennai',
        pincode: '600028',
        hubId: 'hub_ramesh_600028',
        hubName: 'Ramesh Seafood Hub',
        items: [
          DeliveryOrderItem(fishName: 'Vanjaram', count: 1, kg: 1.5, price: 1275.0),
        ],
        totalAmount: 1275.0,
        status: 'pending_pickup',
      );

      // Arun is in 600028 -> MATCH
      expect(order1.matchesRiderPincode('600028'), isTrue);

      // Vignesh is in 600004 -> NO MATCH
      expect(order1.matchesRiderPincode('600004'), isFalse);
    });

    test('Order pickup transitions state and attaches notification', () {
      const order = DeliveryOrder(
        id: 'order_ORD-204',
        orderId: 'ORD-204',
        customerName: 'Kavitha S.',
        customerPhone: '+91 98410 44882',
        deliveryAddress: 'Mandaveli, Chennai',
        pincode: '600028',
        hubId: 'hub_ramesh_600028',
        hubName: 'Ramesh Seafood Hub',
        items: [
          DeliveryOrderItem(fishName: 'Vanjaram', count: 1, kg: 1.5, price: 1275.0),
        ],
        totalAmount: 1275.0,
        status: 'pending_pickup',
      );

      const pickupNotification = "Here the fishes are picked up. You'll get your order today.";
      final pickedUp = order.copyWith(
        status: 'picked_up',
        riderId: 'rider_arun_600028',
        customerNotification: pickupNotification,
        pickedUpAt: DateTime(2026, 9, 6, 11, 0),
      );

      expect(pickedUp.status, 'picked_up');
      expect(pickedUp.riderId, 'rider_arun_600028');
      expect(pickedUp.customerNotification, pickupNotification);
    });

    test('Order delivery transitions to delivered and notifies customer', () {
      const order = DeliveryOrder(
        id: 'order_ORD-204',
        orderId: 'ORD-204',
        customerName: 'Kavitha S.',
        customerPhone: '+91 98410 44882',
        deliveryAddress: 'Mandaveli, Chennai',
        pincode: '600028',
        hubId: 'hub_ramesh_600028',
        hubName: 'Ramesh Seafood Hub',
        items: [
          DeliveryOrderItem(fishName: 'Vanjaram', count: 1, kg: 1.5, price: 1275.0),
        ],
        totalAmount: 1275.0,
        status: 'picked_up',
      );

      const deliveryNotification = 'You received the order.';
      final delivered = order.copyWith(
        status: 'delivered',
        customerNotification: deliveryNotification,
        deliveredAt: DateTime(2026, 9, 6, 11, 30),
      );

      expect(delivered.status, 'delivered');
      expect(delivered.customerNotification, deliveryNotification);
      expect(delivered.deliveredAt, isNotNull);
    });
  });
}
