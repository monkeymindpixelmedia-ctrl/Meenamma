class StockPoint {
  final String id;
  final String name;
  final String ownerName;
  final String pincode;
  final String phone;
  final String address;
  final bool active;

  const StockPoint({
    required this.id,
    required this.name,
    required this.ownerName,
    required this.pincode,
    required this.phone,
    required this.address,
    this.active = true,
  });

  factory StockPoint.fromJson(Map<String, dynamic> json) {
    return StockPoint(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      ownerName: json['owner_name'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      address: json['address'] as String? ?? '',
      active: json['active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'owner_name': ownerName,
    'pincode': pincode,
    'phone': phone,
    'address': address,
    'active': active,
  };
}

class StockItem {
  final String fishName;
  final int count;
  final double kg;
  final double pricePerKg;

  const StockItem({
    required this.fishName,
    required this.count,
    required this.kg,
    this.pricePerKg = 0.0,
  });

  factory StockItem.fromJson(Map<String, dynamic> json) {
    return StockItem(
      fishName: json['fish_name'] as String? ?? '',
      count: (json['count'] as num?)?.toInt() ?? 1,
      kg: (json['kg'] as num?)?.toDouble() ?? 1.0,
      pricePerKg: (json['price_per_kg'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'fish_name': fishName,
    'count': count,
    'kg': kg,
    'price_per_kg': pricePerKg,
  };
}

class StockShipment {
  final String id;
  final String shipmentId;
  final String hubId;
  final String ownerName;
  final String pincode;
  final List<StockItem> items;
  final String status; // in_transit | received_at_hub
  final String notes;
  final DateTime? dispatchedAt;
  final DateTime? receivedAt;

  const StockShipment({
    required this.id,
    required this.shipmentId,
    required this.hubId,
    required this.ownerName,
    required this.pincode,
    required this.items,
    required this.status,
    this.notes = '',
    this.dispatchedAt,
    this.receivedAt,
  });

  factory StockShipment.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return StockShipment(
      id: json['id'] as String? ?? '',
      shipmentId: json['shipment_id'] as String? ?? json['id'] as String? ?? '',
      hubId: json['hub_id'] as String? ?? '',
      ownerName: json['owner_name'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      items: rawItems.map((e) => StockItem.fromJson(e as Map<String, dynamic>)).toList(),
      status: json['status'] as String? ?? 'in_transit',
      notes: json['notes'] as String? ?? '',
      dispatchedAt: json['dispatched_at'] != null ? DateTime.tryParse(json['dispatched_at'] as String) : null,
      receivedAt: json['received_at'] != null ? DateTime.tryParse(json['received_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'shipment_id': shipmentId,
    'hub_id': hubId,
    'owner_name': ownerName,
    'pincode': pincode,
    'items': items.map((i) => i.toJson()).toList(),
    'status': status,
    'notes': notes,
    'dispatched_at': dispatchedAt?.toIso8601String(),
    'received_at': receivedAt?.toIso8601String(),
  };

  StockShipment copyWith({
    String? status,
    DateTime? receivedAt,
  }) {
    return StockShipment(
      id: id,
      shipmentId: shipmentId,
      hubId: hubId,
      ownerName: ownerName,
      pincode: pincode,
      items: items,
      status: status ?? this.status,
      notes: notes,
      dispatchedAt: dispatchedAt,
      receivedAt: receivedAt ?? this.receivedAt,
    );
  }
}

class HubInventory {
  final String hubId;
  final String pincode;
  final String ownerName;
  final List<StockItem> items;
  final DateTime? updatedAt;

  const HubInventory({
    required this.hubId,
    required this.pincode,
    required this.ownerName,
    required this.items,
    this.updatedAt,
  });

  factory HubInventory.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return HubInventory(
      hubId: json['hub_id'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      ownerName: json['owner_name'] as String? ?? '',
      items: rawItems.map((e) => StockItem.fromJson(e as Map<String, dynamic>)).toList(),
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'hub_id': hubId,
    'pincode': pincode,
    'owner_name': ownerName,
    'items': items.map((i) => i.toJson()).toList(),
    'updated_at': updatedAt?.toIso8601String(),
  };
}
