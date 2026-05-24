import 'package:flutter/material.dart';
import 'package:mobile_client/utils/server_options_storage.dart';

class SettingIPAddressPage extends StatefulWidget {
  const SettingIPAddressPage({super.key});

  @override
  _SettingIPAddressPageState createState() => _SettingIPAddressPageState();
}

class _SettingIPAddressPageState extends State<SettingIPAddressPage> {
  late TextEditingController ipController;
  late TextEditingController portController;

  @override
  void initState() {
    super.initState();
    ipController = TextEditingController();
    portController = TextEditingController();
    _loadIPAddressAndPort();
  }

  @override
  void dispose() {
    ipController.dispose();
    portController.dispose();
    super.dispose();
  }

  Future<void> _loadIPAddressAndPort() async {
    String? ipAddress = await ServerOptionsStorage.getIpAddress();
    List<String> components = ipAddress!.split(":");

    setState(() {
      ipController.text = components[1].substring(2);
      portController.text = components[2];
    });
  }

  Future<void> _saveIPAddressAndPort() async {
    await ServerOptionsStorage.storeIpPort(ipController.text, portController.text);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("IP Address and Port saved!")),
      );
    }
  }

   @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Set IP Address'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: ipController,
              decoration: const InputDecoration(
                labelText: 'IP Address',
                hintText: 'Enter IP Address',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: portController,
              decoration: const InputDecoration(
                labelText: 'Port',
                hintText: 'Enter Port',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _saveIPAddressAndPort,
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}