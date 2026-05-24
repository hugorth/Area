import 'package:shared_preferences/shared_preferences.dart';

class AuthStorage {
  static const String _accessTokenKey = 'access_token';
  static const String _userIdKey = 'user_id';

  // Store access token
  static Future<void> storeAuthCredential(String token, String userId) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, token);
    await prefs.setString(_userIdKey, userId);
  }

  // Check if access token exists
  static Future<bool> hasAccessToken() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString(_accessTokenKey);
    return token != null;
  }

  // Retrieve access token
  static Future<String?> getAccessToken() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  static Future<String?> getUserId() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  // Clear access token (logout)
  static Future<void> clearAuthCredential() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_userIdKey);
  }
}
