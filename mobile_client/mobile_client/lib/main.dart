import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_client/utils/server_options_storage.dart';
import 'utils/auth_storage.dart';
import 'screens/login_page.dart';
import 'screens/register_page.dart';
import 'screens/profile_page.dart';
import 'screens/services_page.dart';
import 'screens/actions_reactions_page.dart';
import 'screens/change_password.dart';
import 'screens/setting_ip_address_page.dart';
import 'screens/mix_match_page.dart';
import 'package:provider/provider.dart';
import 'utils/mode_switcher.dart';

final RouteObserver<PageRoute> routeObserver = RouteObserver<PageRoute>();

void main() async {
  await dotenv.load();
  if (!await ServerOptionsStorage.hasIpAndPort()) {
    await ServerOptionsStorage.storeIpPort("localhost", "8080");
  }
  runApp(
    ChangeNotifierProvider(
      create: (context) => ThemeProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context); 
    return MaterialApp(
      themeMode: themeProvider.themeMode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: SplashScreen(),
      navigatorObservers: [routeObserver],
      routes: {
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/profile': (context) => const ProfilePage(),
        '/services': (context) => const ServicesPage(),
        '/actions': (context) => const ActionsPage(),
        '/change-password': (context) => ChangePasswordPage(),
        '/ip-setting': (context) => SettingIPAddressPage(),
        '/mix-match' : (context) => MixMatchPage(),
      },
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: AuthStorage.hasAccessToken(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasData && snapshot.data == true) {
          return ProfilePage();
        } else {
          return LoginPage();
        }
      },
    );
  }
}


