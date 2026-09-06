class DeliveryRider {
  final String id;
  final String name;
  final String pincode;
  final String phone;
  final String vehicle;
  final bool active;

  const DeliveryRider({
    required this.id,
    required this.name,
    required this.pincode,
    required this.phone,
    required this.vehicle,
    this.active = true,
  });

  factory DeliveryRider.fromJson(Map<String, dynamic> json) {
    return DeliveryRider(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      vehicle: json['vehicle'] as String? ?? '',
      active: json['active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'pincode': pincode,
    'phone': phone,
    'vehicle': vehicle,
    'active': active,
  };
}

class DeliveryOrderItem {
  final String fishName;
  final int count;
  final double kg;
  final double price;

  const DeliveryOrderItem({
    required this.fishName,
    required this.count,
    required this.kg,
    this.price = 0.0,
  });

  factory DeliveryOrderItem.fromJson(Map<String, dynamic> json) {
    return DeliveryOrderItem(
      fishName: json['fish_name'] as String? ?? '',
      count: (json['count'] as num?)?.toInt() ?? 1,
      kg: (json['kg'] as num?)?.toDouble() ?? 1.0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'fish_name': fishName,
    'count': count,
    'kg': kg,
    'price': price,
  };
}

class DeliveryOrder {
  final String id;
  final String orderId;
  final String customerName;
  final String customerPhone;
  final String deliveryAddress;
  final String pincode;
  final String hubId;
  final String hubName;
  final String? riderId;
  final List<DeliveryOrderItem> items;
  final double totalAmount;
  final String status; // pending_pickup | picked_up | delivered
  final String? customerNotification;
  final DateTime? createdAt;
  final DateTime? pickedUpAt;
  final DateTime? deliveredAt;

  const DeliveryOrder({
    required this.id,
    required this.orderId,
    required this.customerName,
    required this.customerPhone,
    required this.deliveryAddress,
    required this.pincode,
    required this.hubId,
    required this.hubName,
    this.riderId,
    required this.items,
    required this.totalAmount,
    required this.status,
    this.customerNotification,
    this.createdAt,
    this.pickedUpAt,
    this.deliveredAt,
  });

  /// The critical business rule: Rider PIN code must match Customer and Hub PIN code
  bool matchesRiderPincode(String riderPincode) => pincode.trim() == riderPincode.trim();

  factory DeliveryOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return DeliveryOrder(
      id: json['id'] as String? ?? '',
      orderId: json['order_id'] as String? ?? json['id'] as String? ?? '',
      customerName: json['customer_name'] as String? ?? '',
      customerPhone: json['customer_phone'] as String? ?? '',
      deliveryAddress: json['delivery_address'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      hubId: json['hub_id'] as String? ?? '',
      hubName: json['hub_name'] as String? ?? '',
      riderId: json['rider_id'] as String?,
      items: rawItems.map((e) => DeliveryOrderItem.fromJson(e as Map<String, dynamic>)).toList(),
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'pending_pickup',
      customerNotification: json['customer_notification'] as String?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : null,
      pickedUpAt: json['picked_up_at'] != null ? DateTime.tryParse(json['picked_up_at'] as String) : null,
      deliveredAt: json['delivered_at'] != null ? DateTime.tryParse(json['delivered_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'order_id': orderId,
    'customer_name': customerName,
    'customer_phone': customerPhone,
    'delivery_address': deliveryAddress,
    'pincode': pincode,
    'hub_id': hubId,
    'hub_name': hubName,
    'rider_id': riderId,
    'items': items.map((i) => i.toJson()).toList(),
    'total_amount': totalAmount,
    'status': status,
    'customer_notification': customerNotification,
    'created_at': createdAt?.toIso8601String(),
    'picked_up_at': pickedUpAt?.toIso8601String(),
    'delivered_at': deliveredAt?.toIso8601String(),
  };

  DeliveryOrder copyWith({
    String? status,
    String? riderId,
    String? customerNotification,
    DateTime? pickedUpAt,
    DateTime? deliveredAt,
  }) {
    return DeliveryOrder(
      id: id,
      orderId: orderId,
      customerName: customerName,
      customerPhone: customerPhone,
      deliveryAddress: deliveryAddress,
      pincode: pincode,
      hubId: hubId,
      hubName: hubName,
      riderId: riderId ?? this.riderId,
      items: items,
      totalAmount: totalAmount,
      status: status ?? this.status,
      customerNotification: customerNotification ?? this.customerNotification,
      createdAt: createdAt,
      pickedUpAt: pickedUpAt ?? this.pickedUpAt,
      deliveredAt: deliveredAt ?? this.deliveredAt,
    );
  }
}
