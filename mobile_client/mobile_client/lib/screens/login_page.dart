import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_web_auth/flutter_web_auth.dart';
import 'dart:convert';
import 'package:provider/provider.dart';

import '../utils/auth_storage.dart';
import '../utils/server_options_storage.dart';
import '../utils/mode_switcher.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  final String googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  final String githubAuthUrl = 'https://github.com/login/oauth/authorize';
  final String microsoftAuthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

  String? callbackUrl = "";

  @override
  void initState() {
    super.initState();
    getCallbackIpAddress();
  }

  Future<void> getCallbackIpAddress() async {
    String? ip = await ServerOptionsStorage.getIpAddress();
    callbackUrl = "$ip/auth/callback";
  }

  Future<void> goToProfile(String token, String userId) async {
    AuthStorage.storeAuthCredential(token, userId);
    Navigator.pushReplacementNamed(context, '/profile');
  }

  Future<void> signInWithGoogle() async {
    try {
      final url =
          '$googleAuthUrl?client_id=${dotenv.env["GOOGLE_CLIENT_ID"]}&redirect_uri=$callbackUrl&response_type=code&scope=email profile&state=google';

      final result = await FlutterWebAuth.authenticate(
        url: url,
        callbackUrlScheme: 'mobileclient',
      );

      final token = Uri.parse(result).queryParameters['token'];
      final userId = Uri.parse(result).queryParameters['userId'];

      if (token != null && userId != null) {
        goToProfile(token, userId);
      } else {
        print("error");
      }
    } catch (e) {
      print('Error during Google login: $e');
    }
  }

  Future<void> signInWithGithub() async {
    try {
      final url =
          '$githubAuthUrl?client_id=${dotenv.env["GITHUB_CLIENT_ID"]}&redirect_uri=$callbackUrl&response_type=code&scope=user:email&state=github';

      final result = await FlutterWebAuth.authenticate(
        url: url,
        callbackUrlScheme: 'mobileclient',
      );

      final token = Uri.parse(result).queryParameters['token'];
      final userId = Uri.parse(result).queryParameters['userId'];

      if (token != null && userId != null) {
        goToProfile(token, userId);
      } else {
        print("error");
      }
    } catch (e) {
      print('Error during GitHub login: $e');
    }
  }

  Future<void> signInWithMicrosoft() async {
    try {
      final url =
          '$microsoftAuthUrl?client_id=${dotenv.env["MICROSOFT_CLIENT_ID"]}&redirect_uri=$callbackUrl&response_type=code&scope=user.read&state=microsoft';

      final result = await FlutterWebAuth.authenticate(
        url: url,
        callbackUrlScheme: 'mobileclient',
      );

      final token = Uri.parse(result).queryParameters['token'];
      final userId = Uri.parse(result).queryParameters['userId'];

      if (token != null && userId != null) {
        goToProfile(token, userId);
      } else {
        print("error");
      }
    } catch (e) {
      print('Error during Microsoft login: $e');
    }
  }

  Future<void> _login() async {
    String email = _emailController.text;
    String password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill out both fields')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      String? ip = await ServerOptionsStorage.getIpAddress();

      final response = await http.post(
          Uri.parse('$ip/user/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'password': password
          }
        ));
      
      var responseBody = json.decode(response.body);
      if (response.statusCode == 200) {
        goToProfile(responseBody['token'], responseBody['userId']);
      } else {
        print("error ${response.statusCode} : $responseBody");
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.settings),
          onPressed: () {
            Navigator.pushNamed(context, '/ip-setting');
          },
        ),
        actions: [
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) => Switch(
              value: themeProvider.themeMode == ThemeMode.dark,
              onChanged: (value) {
                themeProvider.toggleTheme(value);
              },
            ),
          ),
        ],
      ),
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                // Logo
                Image.asset(
                  'assets/area_logo.png',
                  height: 100,
                ),
                SizedBox(height: 20),
                // Title
                Text(
                  'CONNECT',
                 style: GoogleFonts.anton(
                        textStyle:  const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          fontFamilyFallback: ['Sans-serif'], // Fallback fonts
                        )
                    ),
                ),
                SizedBox(height: 20),
                // Email TextField
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                ),
                SizedBox(height: 20),
                // Password TextField
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
                SizedBox(height: 10),
                // Forgot Password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      // Add forgot password functionality
                    },
                    child: Text('Forgotten password?'),
                  ),
                ),
                SizedBox(height: 20),
                // Login Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _login, // Disable button if loading
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50), // Full-width button
                    backgroundColor: Colors.purple, // Button color
                  ),
                  child: _isLoading
                      ? CircularProgressIndicator(color: Colors.white) // Show a loading spinner
                      : Text('Log in'),
                ),
                SizedBox(height: 20),
                // Or Divider
                Text('or'),
                SizedBox(height: 20),
                // Social Login Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    IconButton(
                      icon: Image.asset('assets/google_logo.png', 
                        height: 30.0, 
                        width: 30.0, 
                        fit: BoxFit.contain),
                      onPressed: _isLoading ? null : signInWithGoogle,
                    ),
                    IconButton(
                      icon: Image.asset('assets/github_logo.png',
                        height: 30.0, 
                        width: 30.0, 
                        fit: BoxFit.contain),
                      iconSize: 20.0,
                      onPressed: _isLoading ? null : signInWithGithub,
                    ),
                    IconButton(
                      icon: Image.asset('assets/microsoft_logo.png',
                        height: 30.0, 
                        width: 30.0, 
                        fit: BoxFit.contain),
                      iconSize: 20.0,
                      onPressed: _isLoading ? null : signInWithMicrosoft,
                    ),
                  ],
                ),
                SizedBox(height: 20),
                // Registration Option
                const Text("Don't have an account on AREA yet?"),
                TextButton(onPressed: () {
                    Navigator.pushNamed(context, '/register');
                  }, 
                  child: const Text("Register"))
              ],
            ),
          ),
        ),
      ),
    );
  }
}