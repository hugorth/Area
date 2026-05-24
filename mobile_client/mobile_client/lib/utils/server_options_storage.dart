import 'package:shared_preferences/shared_preferences.dart';

class ServerOptionsStorage {
  static const String _ipAddress = 'ip_address';
  static const String _port = 'port';

  // Store IP and Port
  static Future<void> storeIpPort(String ip, String port) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_ipAddress, ip);
    await prefs.setString(_port, port);
  }

  // Retrieve IP address (http://ip:port/)
  static Future<String?> getIpAddress() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    String? ip = prefs.getString(_ipAddress);
    String? port = prefs.getString(_port);
    return "http://$ip:$port";
  }

  // Check if there's IP and Port
  static Future<bool> hasIpAndPort() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_ipAddress) && prefs.containsKey(_port);
  }
}
