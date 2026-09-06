import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'models/stock_models.dart';
import 'services/stock_api_service.dart';
import 'tokens/design_tokens.dart';
import 'widgets/stock_logo_badge.dart';

void main() {
  runApp(const MeenammaStockApp());
}

class MeenammaStockApp extends StatelessWidget {
  const MeenammaStockApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Meenamma Stock Hub',
      debugShowCheckedModeBanner: false,
      theme: DesignTokens.theme,
      home: const StockHomeScreen(),
    );
  }
}

class StockHomeScreen extends StatefulWidget {
  const StockHomeScreen({super.key});

  @override
  State<StockHomeScreen> createState() => _StockHomeScreenState();
}

class _StockHomeScreenState extends State<StockHomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<StockPoint> _hubs = [];
  StockPoint? _selectedHub;
  List<StockShipment> _shipments = [];
  HubInventory? _inventory;
  bool _loading = true;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _initializeData() async {
    setState(() => _loading = true);
    final hubs = await StockApiService.fetchStockHubs();
    if (!mounted) return;
    setState(() {
      _hubs = hubs;
      _selectedHub = hubs.isNotEmpty ? hubs.first : null;
    });
    if (_selectedHub != null) {
      await _loadHubData(_selectedHub!.id);
    }
  }

  Future<void> _loadHubData(String hubId) async {
    setState(() => _loading = true);
    final shipments = await StockApiService.fetchShipmentsForHub(hubId);
    final inventory = await StockApiService.fetchHubInventory(hubId);
    if (!mounted) return;
    setState(() {
      _shipments = shipments;
      _inventory = inventory;
      _loading = false;
    });
  }

  Future<void> _onAcknowledgeFoodReceipt(StockShipment shipment) async {
    if (_selectedHub == null) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: DesignTokens.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: DesignTokens.cardBorder),
        ),
        title: const Text(
          'Confirm Food Receipt',
          style: TextStyle(color: DesignTokens.gold, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Acknowledge delivery of Shipment #${shipment.shipmentId}?\nThis will automatically update your shop inventory and notify Admin.',
          style: const TextStyle(color: DesignTokens.textLight, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: DesignTokens.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: DesignTokens.gold,
              foregroundColor: Colors.black,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Yes, I got the food'),
          ),
        ],
      ),
    );

    if (confirm != true) return;
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loading = true);
    final success = await StockApiService.acknowledgeReceipt(
      shipment: shipment,
      hub: _selectedHub!,
    );

    if (!mounted) return;
    setState(() {
      _statusMessage = success
          ? 'Shipment received! Shop inventory is updated.'
          : 'Could not sync receipt. Please retry.';
    });

    await _loadHubData(_selectedHub!.id);

    messenger.showSnackBar(
      SnackBar(
        content: Text(_statusMessage ?? ''),
        backgroundColor: success ? DesignTokens.emerald : DesignTokens.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const StockLogoBadge(),
        actions: [
          if (_selectedHub != null)
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: DesignTokens.emeraldBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: DesignTokens.emerald.withValues(alpha: 0.4)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on, color: DesignTokens.emerald, size: 12),
                  const SizedBox(width: 4),
                  Text(
                    'PIN ${_selectedHub!.pincode}',
                    style: const TextStyle(
                      color: DesignTokens.emerald,
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
          indicatorColor: DesignTokens.gold,
          labelColor: DesignTokens.gold,
          unselectedLabelColor: DesignTokens.textMuted,
          labelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
          tabs: const [
            Tab(icon: Icon(Icons.local_shipping, size: 18), text: 'INCOMING SHIPMENTS'),
            Tab(icon: Icon(Icons.inventory_2, size: 18), text: 'LIVE INVENTORY'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Hub Switcher bar
          _buildHubSelector(),

          // Main Tabs
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: DesignTokens.gold),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildShipmentsTab(),
                      _buildInventoryTab(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildHubSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: DesignTokens.surface,
        border: Border(bottom: BorderSide(color: DesignTokens.cardBorder)),
      ),
      child: Row(
        children: [
          const Icon(Icons.storefront, color: DesignTokens.gold, size: 16),
          const SizedBox(width: 8),
          const Text(
            'Active Hub:',
            style: TextStyle(
              fontSize: 11,
              color: DesignTokens.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedHub?.id,
                dropdownColor: DesignTokens.card,
                isDense: true,
                icon: const Icon(Icons.arrow_drop_down, color: DesignTokens.gold),
                style: const TextStyle(
                  color: DesignTokens.textLight,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
                items: _hubs.map((h) {
                  return DropdownMenuItem<String>(
                    value: h.id,
                    child: Text('${h.ownerName} (${h.pincode})'),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val == null) return;
                  final chosen = _hubs.firstWhere((h) => h.id == val);
                  setState(() => _selectedHub = chosen);
                  _loadHubData(chosen.id);
                },
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 18, color: DesignTokens.gold),
            onPressed: () {
              if (_selectedHub != null) _loadHubData(_selectedHub!.id);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildShipmentsTab() {
    if (_shipments.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.inbox, size: 48, color: DesignTokens.textDim),
              SizedBox(height: 12),
              Text(
                'No Incoming Shipments',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: DesignTokens.textLight,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'When Admin dispatches fish shipments for your PIN code, they will appear here.',
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
      itemCount: _shipments.length,
      itemBuilder: (ctx, idx) {
        final s = _shipments[idx];
        final isReceived = s.status == 'received_at_hub';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: DesignTokens.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isReceived
                  ? DesignTokens.emerald.withValues(alpha: 0.3)
                  : DesignTokens.gold.withValues(alpha: 0.4),
            ),
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
                      Icon(
                        isReceived ? Icons.check_circle : Icons.local_shipping,
                        color: isReceived ? DesignTokens.emerald : DesignTokens.gold,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Shipment #${s.shipmentId}',
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
                      color: isReceived ? DesignTokens.emeraldBg : DesignTokens.amberBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isReceived ? DesignTokens.emerald : DesignTokens.amber,
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      isReceived ? 'IN STOCK' : 'IN TRANSIT',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: isReceived ? DesignTokens.emerald : DesignTokens.amber,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: DesignTokens.cardBorder, height: 1),
              const SizedBox(height: 12),
              const Text(
                'ALLOCATED FISH:',
                style: TextStyle(
                  fontSize: 10,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.bold,
                  color: DesignTokens.textMuted,
                ),
              ),
              const SizedBox(height: 8),
              ...s.items.map((it) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        it.fishName,
                        style: const TextStyle(
                          color: DesignTokens.textLight,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '${it.count} nos · ${it.kg} kg',
                        style: const TextStyle(
                          color: DesignTokens.gold,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              if (s.notes.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  'Note: ${s.notes}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontStyle: FontStyle.italic,
                    color: DesignTokens.textMuted,
                  ),
                ),
              ],
              const SizedBox(height: 14),

              // Prominent Action Button: "Yes, I got the food"
              if (!isReceived)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: DesignTokens.gold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () => _onAcknowledgeFoodReceipt(s),
                    icon: const Icon(Icons.check_circle_outline, size: 20),
                    label: const Text(
                      'YES, I GOT THE FOOD',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: DesignTokens.emeraldBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Received and added to shop inventory',
                    style: TextStyle(
                      color: DesignTokens.emerald,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05, end: 0);
      },
    );
  }

  Widget _buildInventoryTab() {
    final items = _inventory?.items ?? [];

    if (items.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.set_meal, size: 48, color: DesignTokens.textDim),
              SizedBox(height: 12),
              Text(
                'No Fish in Stock',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: DesignTokens.textLight,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'When you click "Yes, I got the food" on incoming shipments, fresh catch will immediately appear here.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: DesignTokens.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: DesignTokens.gold.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: DesignTokens.gold.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.verified, color: DesignTokens.gold, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Shop Inventory for PIN ${_selectedHub?.pincode}',
                      style: const TextStyle(
                        color: DesignTokens.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const Text(
                      'Ready for hyperlocal customer orders and rider pickups',
                      style: TextStyle(color: DesignTokens.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...items.map((it) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: DesignTokens.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: DesignTokens.cardBorder),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      it.fishName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: DesignTokens.textLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Fresh Harbor Catch · Ready for Dispatch',
                      style: TextStyle(fontSize: 10, color: DesignTokens.emerald),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${it.count} pcs',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: DesignTokens.gold,
                      ),
                    ),
                    Text(
                      '${it.kg.toStringAsFixed(1)} kg',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: DesignTokens.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 250.ms);
        }),
      ],
    );
  }
}
