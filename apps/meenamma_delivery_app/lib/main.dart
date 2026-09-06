import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'models/delivery_models.dart';
import 'services/delivery_api_service.dart';
import 'tokens/design_tokens.dart';
import 'widgets/rider_logo_badge.dart';
import 'widgets/swipe_action_slider.dart';

void main() {
  runApp(const MeenammaDeliveryApp());
}

class MeenammaDeliveryApp extends StatelessWidget {
  const MeenammaDeliveryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Meenamma Delivery Partner',
      debugShowCheckedModeBanner: false,
      theme: DesignTokens.theme,
      home: const RiderHomeScreen(),
    );
  }
}

class RiderHomeScreen extends StatefulWidget {
  const RiderHomeScreen({super.key});

  @override
  State<RiderHomeScreen> createState() => _RiderHomeScreenState();
}

class _RiderHomeScreenState extends State<RiderHomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<DeliveryRider> _riders = [];
  DeliveryRider? _activeRider;
  List<DeliveryOrder> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _initializeData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _initializeData() async {
    setState(() => _loading = true);
    final riders = await DeliveryApiService.fetchRiders();
    if (!mounted) return;
    setState(() {
      _riders = riders;
      _activeRider = riders.isNotEmpty ? riders.first : null;
    });
    if (_activeRider != null) {
      await _loadOrdersForRider(_activeRider!);
    }
  }

  Future<void> _loadOrdersForRider(DeliveryRider rider) async {
    setState(() => _loading = true);
    final orders = await DeliveryApiService.fetchOrdersForRider(rider);
    if (!mounted) return;
    setState(() {
      _orders = orders;
      _loading = false;
    });
  }

  Future<void> _onPickUpOrder(DeliveryOrder order) async {
    if (_activeRider == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: DesignTokens.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: DesignTokens.cardBorder),
        ),
        title: const Text(
          'Pick Up Order',
          style: TextStyle(color: DesignTokens.cyan, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Pick up Order #${order.orderId} from ${order.hubName}?\n\nThe customer will immediately receive this notification:\n"Here the fishes are picked up. You\'ll get your order today."',
          style: const TextStyle(color: DesignTokens.textLight, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: DesignTokens.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: DesignTokens.cyan,
              foregroundColor: Colors.black,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm Pickup'),
          ),
        ],
      ),
    );

    if (confirm != true) return;
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loading = true);

    final success = await DeliveryApiService.pickupOrder(
      order: order,
      rider: _activeRider!,
    );

    if (!mounted) return;
    await _loadOrdersForRider(_activeRider!);

    messenger.showSnackBar(
      SnackBar(
        content: Text(
          success
              ? "Order #${order.orderId} picked up! Customer notified."
              : "Failed to update status. Please retry.",
        ),
        backgroundColor: success ? DesignTokens.emerald : DesignTokens.red,
        behavior: SnackBarBehavior.floating,
      ),
    );

    _tabController.animateTo(1); // Switch to Active tab
  }

  Future<void> _onDeliverOrder(DeliveryOrder order) async {
    if (_activeRider == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: DesignTokens.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: DesignTokens.cardBorder),
        ),
        title: const Text(
          'Confirm Delivery',
          style: TextStyle(color: DesignTokens.emerald, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Mark Order #${order.orderId} as delivered to ${order.customerName}?\n\nThe customer will receive confirmation:\n"You received the order."',
          style: const TextStyle(color: DesignTokens.textLight, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: DesignTokens.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: DesignTokens.emerald,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('The order has been delivered'),
          ),
        ],
      ),
    );

    if (confirm != true) return;
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loading = true);

    final success = await DeliveryApiService.markOrderDelivered(
      order: order,
      rider: _activeRider!,
    );

    if (!mounted) return;
    await _loadOrdersForRider(_activeRider!);

    messenger.showSnackBar(
      SnackBar(
        content: Text(
          success
              ? "Order #${order.orderId} delivered! Notification sent to customer."
              : "Failed to mark delivered. Please retry.",
        ),
        backgroundColor: success ? DesignTokens.emerald : DesignTokens.red,
        behavior: SnackBarBehavior.floating,
      ),
    );

    _tabController.animateTo(2); // Switch to Completed tab
  }

  @override
  Widget build(BuildContext context) {
    final available = _orders.where((o) => o.status == 'pending_pickup').toList();
    final active = _orders.where((o) => o.status == 'picked_up').toList();
    final completed = _orders.where((o) => o.status == 'delivered').toList();

    return Scaffold(
      appBar: AppBar(
        title: const RiderLogoBadge(),
        actions: [
          if (_activeRider != null)
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: DesignTokens.cyan.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: DesignTokens.cyan.withValues(alpha: 0.4)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.pin_drop, color: DesignTokens.cyan, size: 12),
                  const SizedBox(width: 4),
                  Text(
                    'PIN ${_activeRider!.pincode}',
                    style: const TextStyle(
                      color: DesignTokens.cyan,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: DesignTokens.cyan,
          labelColor: DesignTokens.cyan,
          unselectedLabelColor: DesignTokens.textMuted,
          labelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
          tabs: [
            Tab(
              icon: const Icon(Icons.notifications_active, size: 18),
              text: 'NEW (${available.length})',
            ),
            Tab(
              icon: const Icon(Icons.two_wheeler, size: 18),
              text: 'ACTIVE (${active.length})',
            ),
            Tab(
              icon: const Icon(Icons.task_alt, size: 18),
              text: 'DONE (${completed.length})',
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Rider Switcher & PIN match indicator
          _buildRiderSelector(),

          // Main Tabs View
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: DesignTokens.cyan),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildAvailableOrdersTab(available),
                      _buildActiveDeliveriesTab(active),
                      _buildCompletedOrdersTab(completed),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiderSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: DesignTokens.surface,
        border: Border(bottom: BorderSide(color: DesignTokens.cardBorder)),
      ),
      child: Row(
        children: [
          const Icon(Icons.person_pin, color: DesignTokens.cyan, size: 16),
          const SizedBox(width: 8),
          const Text(
            'Rider:',
            style: TextStyle(
              fontSize: 11,
              color: DesignTokens.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _activeRider?.id,
                dropdownColor: DesignTokens.card,
                isDense: true,
                icon: const Icon(Icons.arrow_drop_down, color: DesignTokens.cyan),
                style: const TextStyle(
                  color: DesignTokens.textLight,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
                items: _riders.map((r) {
                  return DropdownMenuItem<String>(
                    value: r.id,
                    child: Text('${r.name} · PIN ${r.pincode}'),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val == null) return;
                  final chosen = _riders.firstWhere((r) => r.id == val);
                  setState(() => _activeRider = chosen);
                  _loadOrdersForRider(chosen);
                },
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 18, color: DesignTokens.cyan),
            onPressed: () {
              if (_activeRider != null) _loadOrdersForRider(_activeRider!);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAvailableOrdersTab(List<DeliveryOrder> orders) {
    if (orders.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle_outline, size: 48, color: DesignTokens.textDim),
              SizedBox(height: 12),
              Text(
                'No Pending Orders in Your PIN Code',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: DesignTokens.textLight,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'Orders placed by customers in your assigned PIN code will appear here for pickup.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: DesignTokens.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (ctx, idx) {
        final ord = orders[idx];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: DesignTokens.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: DesignTokens.cardBorder),
            boxShadow: const [
              BoxShadow(
                color: Colors.black45,
                blurRadius: 8,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.shopping_bag, color: DesignTokens.cyan, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Order #${ord.orderId}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: DesignTokens.textLight,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: DesignTokens.amberBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: DesignTokens.amber, width: 0.8),
                    ),
                    child: const Text(
                      'READY FOR PICKUP',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: DesignTokens.amber,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: DesignTokens.cardBorder, height: 1),
              const SizedBox(height: 10),

              // PIN match badge
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: DesignTokens.cyan.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: DesignTokens.cyan.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified, color: DesignTokens.cyan, size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Hyperlocal Match: Hub PIN ${ord.pincode} = Customer PIN ${ord.pincode} = Rider PIN ${_activeRider?.pincode}',
                        style: const TextStyle(
                          color: DesignTokens.cyan,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Hub Pickup Location
              Row(
                children: [
                  const Icon(Icons.storefront, color: DesignTokens.gold, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    'Pickup Hub: ${ord.hubName}',
                    style: const TextStyle(
                      color: DesignTokens.textLight,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),

              // Delivery Address
              Row(
                children: [
                  const Icon(Icons.location_on, color: DesignTokens.emerald, size: 14),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Deliver To: ${ord.customerName} · ${ord.deliveryAddress}',
                      style: const TextStyle(
                        color: DesignTokens.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Fish items
              ...ord.items.map((it) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${it.count}x ${it.fishName}',
                        style: const TextStyle(color: DesignTokens.textLight, fontSize: 12),
                      ),
                      Text(
                        '${it.kg} kg',
                        style: const TextStyle(
                          color: DesignTokens.cyan,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 14),

              // Ergonomic bike-friendly Swipe to Pick Up
              SwipeActionSlider(
                label: 'SLIDE TO ACCEPT & PICK UP',
                icon: Icons.two_wheeler,
                actionColor: DesignTokens.cyan,
                onConfirmed: () => _onPickUpOrder(ord),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 250.ms);
      },
    );
  }

  Widget _buildActiveDeliveriesTab(List<DeliveryOrder> orders) {
    if (orders.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.two_wheeler, size: 48, color: DesignTokens.textDim),
              SizedBox(height: 12),
              Text(
                'No Active Deliveries',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: DesignTokens.textLight,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'Accept orders in the "New" tab to start delivery.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: DesignTokens.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (ctx, idx) {
        final ord = orders[idx];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: DesignTokens.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: DesignTokens.cyan.withValues(alpha: 0.4)),
            boxShadow: const [
              BoxShadow(
                color: Colors.black45,
                blurRadius: 8,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${ord.orderId}',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: DesignTokens.textLight,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: DesignTokens.cyan.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: DesignTokens.cyan, width: 0.8),
                    ),
                    child: const Text(
                      'OUT FOR DELIVERY',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: DesignTokens.cyan,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Notification banner sent to customer
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: DesignTokens.emeraldBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: DesignTokens.emerald.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.sms, color: DesignTokens.emerald, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Notification Sent to Customer:\n"Here the fishes are picked up. You\'ll get your order today."',
                        style: TextStyle(
                          color: DesignTokens.emerald,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              Text(
                'Customer: ${ord.customerName} (${ord.customerPhone})',
                style: const TextStyle(
                  color: DesignTokens.textLight,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Address: ${ord.deliveryAddress} (PIN ${ord.pincode})',
                style: const TextStyle(color: DesignTokens.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 14),

              // Ergonomic bike-friendly Swipe to Complete Delivery
              SwipeActionSlider(
                label: 'SLIDE TO COMPLETE DELIVERY',
                icon: Icons.check_circle,
                actionColor: DesignTokens.emerald,
                onConfirmed: () => _onDeliverOrder(ord),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 250.ms);
      },
    );
  }

  Widget _buildCompletedOrdersTab(List<DeliveryOrder> orders) {
    if (orders.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.history, size: 48, color: DesignTokens.textDim),
              SizedBox(height: 12),
              Text(
                'No Completed Deliveries',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: DesignTokens.textLight,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'Delivered orders with customer confirmation will appear here.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: DesignTokens.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (ctx, idx) {
        final ord = orders[idx];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: DesignTokens.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: DesignTokens.emerald.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${ord.orderId}',
                    style: const TextStyle(
                      color: DesignTokens.textLight,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: DesignTokens.emerald, size: 14),
                      SizedBox(width: 4),
                      Text(
                        'DELIVERED',
                        style: TextStyle(
                          color: DesignTokens.emerald,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Customer Confirmed: "${ord.customerNotification ?? "You received the order."}"',
                style: const TextStyle(
                  color: DesignTokens.emerald,
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Delivered to ${ord.customerName} · PIN ${ord.pincode}',
                style: const TextStyle(color: DesignTokens.textMuted, fontSize: 11),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 250.ms);
      },
    );
  }
}
