import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_client/utils/server_options_storage.dart';
import 'dart:convert';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  _RegisterPageState createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  bool passwordVisible = false;
  final _formKey = GlobalKey<FormState>();
  String firstName = '';
  String lastName = '';
  String email = '';
  String password = '';
  String birthday = '';
  String identity = '';
  String errorMessage = '';

  String? serverAddress = "";

  @override
  void initState() {
    super.initState();
    getServerAddress();
  }

  Future<void> getServerAddress() async {
    serverAddress = await ServerOptionsStorage.getIpAddress();
  }

  void togglePasswordVisibility() {
    setState(() {
      passwordVisible = !passwordVisible;
    });
  }

  bool validateName(String value) {
    return RegExp(r'^[a-zA-Z\s]*$').hasMatch(value);
  }

  Future<void> handleSubmit() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      try {
        final response = await http.post(
          Uri.parse('$serverAddress/user/register'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'password': password,
            'firstName': firstName,
            'lastName': lastName,
            'birthday': birthday,
            'identity': identity,
          }),
        );

        if (response.statusCode == 200) {
          Navigator.pushNamed(context, '/login');
        } else {
          final data = jsonDecode(response.body);
          setState(() {
            errorMessage = data['message'] ?? 'An error occurred';
          });
        }
      } catch (e) {
        setState(() {
          errorMessage = 'Server error';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Sign up for free', style: TextStyle(fontFamily: 'Anton', fontSize: 30)),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF3F3D56),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            children: [
              Image.asset('assets/logo.png', height: 100),

              const SizedBox(height: 20),

              // Form Title
              const Text(
                'Sign up for free',
                style: TextStyle(
                  fontFamily: 'Anton',
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF3F3D56),
                ),
              ),

              const SizedBox(height: 40),

              // Social Media Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  socialButton('assets/google_logo.png'),
                  const SizedBox(width: 20),
                  socialButton('assets/github_logo.png'),
                  const SizedBox(width: 20),
                  socialButton('assets/microsoft_logo.png'),
                ],
              ),
              const SizedBox(height: 20),
              const Text('or', style: TextStyle(fontSize: 18)),

              const SizedBox(height: 20),

              // Registration Form
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    inputField(
                      label: 'Email',
                      onSaved: (value) => email = value ?? '',
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your email';
                        }
                        return null;
                      },
                      keyboardType: TextInputType.emailAddress,
                    ),
                    passwordField(
                      label: 'Password',
                      onSaved: (value) => password = value ?? '',
                      obscureText: !passwordVisible,
                      toggleVisibility: togglePasswordVisibility,
                      passwordVisible: passwordVisible,
                    ),
                    inputField(
                      label: 'First Name',
                      onSaved: (value) => firstName = value ?? '',
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your first name';
                        } else if (!validateName(value)) {
                          return 'Invalid characters in name';
                        }
                        return null;
                      },
                    ),
                    inputField(
                      label: 'Last Name',
                      onSaved: (value) => lastName = value ?? '',
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your last name';
                        } else if (!validateName(value)) {
                          return 'Invalid characters in name';
                        }
                        return null;
                      },
                    ),
                    inputField(
                      label: 'Birthday',
                      onSaved: (value) => birthday = value ?? '',
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your birthday';
                        }
                        // Optional: Check if the entered date is valid and not in the future
                        DateTime? parsedDate = DateTime.tryParse(value);
                        if (parsedDate == null) {
                          return 'Please enter a valid date';
                        }
                        if (parsedDate.isAfter(DateTime.now())) {
                          return 'Birthday cannot be in the future';
                        }
                        return null; // Return null if valid
                      },
                      keyboardType: TextInputType.datetime,
                    ),
                    identityDropdown(),
                    const SizedBox(height: 20),
                    if (errorMessage.isNotEmpty)
                      Text(
                        errorMessage,
                        style: const TextStyle(color: Colors.red),
                      ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7E3FF2),
                        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 100),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: const Text(
                        'Register',
                        style: TextStyle(fontSize: 18, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 200),
                    // Sign-in link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Already have an account? ',
                          style: TextStyle(fontSize: 16),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const Text(
                            'Login',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF7E3FF2),
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget socialButton(String logoPath) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFDDDDDD), width: 2),
        ),
        width: 60,
        height: 60,
        child: Center(
          child: Image.asset(logoPath, width: 30, height: 30),
        ),
      ),
    );
  }

  Widget inputField({
    required String label,
    required Function(String?) onSaved,
    required FormFieldValidator<String>? validator, // Ensure correct type for validator
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: TextFormField(
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(fontSize: 16, color: Color(0xFF3F3D56)),
          contentPadding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        keyboardType: keyboardType,
        onSaved: onSaved,
        validator: validator, // Pass the correct validator
      ),
    );
  }
  Widget passwordField({
    required String label,
    required Function(String?) onSaved,
    required bool obscureText,
    required Function() toggleVisibility,
    required bool passwordVisible,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: TextFormField(
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(fontSize: 16, color: Color(0xFF3F3D56)),
          contentPadding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          suffixIcon: IconButton(
            icon: Icon(passwordVisible ? Icons.visibility : Icons.visibility_off),
            onPressed: toggleVisibility,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        obscureText: obscureText,
        onSaved: onSaved,
      ),
    );
  }

  Widget identityDropdown() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: 'Identity',
          labelStyle: const TextStyle(fontSize: 16, color: Color(0xFF3F3D56)),
          contentPadding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        items: const [
          DropdownMenuItem(value: 'Female', child: Text('Female')),
          DropdownMenuItem(value: 'Male', child: Text('Male')),
          DropdownMenuItem(value: 'Other', child: Text('Other')),
        ],
        onChanged: (value) {
          setState(() {
            identity = value ?? '';
          });
        },
        onSaved: (value) => identity = value ?? '',
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Please select an identity';
          }
          return null;
        },
      ),
    );
  }
}