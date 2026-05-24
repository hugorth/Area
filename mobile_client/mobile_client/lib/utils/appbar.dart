import 'package:flutter/material.dart';
import 'package:mobile_client/screens/login_page.dart';
import 'package:mobile_client/screens/setting_ip_address_page.dart';
import 'package:mobile_client/utils/auth_storage.dart';
import 'package:provider/provider.dart';
import 'mode_switcher.dart';

void showLogoutDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        title: Text('Are you sure you want to logout?'),
        actions: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                child: Text('No'),
              ),
              TextButton(
                onPressed: () {
                  AuthStorage.clearAuthCredential();
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (context) => LoginPage()),
                  );
                },
                child: Text('Yes'),
              ),
            ],
          ),
        ],
      );
    },
  );
}

PreferredSizeWidget buildCustomAppBar(BuildContext context, String caption) {
  final iconColor = Theme.of(context).iconTheme.color;
  final textColor = Theme.of(context).textTheme.titleLarge?.color;

  return AppBar(
    backgroundColor: Colors.transparent,
    elevation: 0,
    title: Text(
      caption,
      style: TextStyle(color: textColor),
    ),
    iconTheme: IconThemeData(color: iconColor),
    actions: [
      IconButton(
        icon: Icon(Icons.home),
        color: iconColor,
        onPressed: () {
          Navigator.popUntil(context, (route) => route.isFirst);
        },
      ),
      IconButton(
        icon: Icon(Icons.settings),
        color: iconColor,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const SettingIPAddressPage()), 
          );
        },
      ),
      IconButton(
        icon: Icon(Icons.logout),
        color: iconColor,
        onPressed: () {
          showLogoutDialog(context);
        },
      ),
      Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) => Switch(
          value: themeProvider.themeMode == ThemeMode.dark,
          onChanged: (value) {
            themeProvider.toggleTheme(value);
          },
        ),
      ),
    ],
  );
}
