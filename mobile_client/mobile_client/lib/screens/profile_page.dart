import 'package:flutter/material.dart';
import 'package:mobile_client/utils/auth_storage.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'dart:io';
import 'package:mobile_client/screens/change_password.dart';
import 'package:mobile_client/utils/appbar.dart';
import 'package:mobile_client/utils/server_options_storage.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? userInfo;
  bool isLoading = true;

  String? serverAddress = "";

  @override
  void initState() {
    super.initState();
    fetchUserInfo();
  }

  Future<void> fetchUserInfo() async {
    serverAddress = await ServerOptionsStorage.getIpAddress();

    try {
      final String? token = await AuthStorage.getAccessToken();
      final response = await http.get(
        Uri.parse('$serverAddress/user/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        setState(() {
          userInfo = json.decode(response.body);
          userInfo?.remove('password');
          isLoading = false;
        });
      } else {
        print('Failed to load user info: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching user info: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: buildCustomAppBar(context, "Profile Page"),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    return Scaffold(
      appBar: buildCustomAppBar(context, "Profile Page"),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            child: Center(
              child: Container(
                width: constraints.maxWidth > 600 ? 400 : constraints.maxWidth * 0.8,
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundImage: NetworkImage(
                          '$serverAddress${userInfo!['profilePic']}'),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${userInfo!['firstName']} ${userInfo!['lastName']}',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        Text(
                          "Email: ${userInfo!['email']}", 
                          textAlign: TextAlign.left,
                          style: TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Gender: ${userInfo!['identity']}', 
                          textAlign: TextAlign.left,
                          style: TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Birthdate: ${userInfo!['birthday']}',
                          textAlign: TextAlign.left,
                          style: TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () { 
                          Navigator.push(
                            context, 
                            MaterialPageRoute(builder: (context) => EditProfilePage(userInfo: userInfo,)),
                          );
                        },
                        icon: const Icon(Icons.edit),
                        label: const Text('Edit Profile'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => ChangePasswordPage()),
                          );
                        },
                        child: const Text('Change Password'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const ActionsServicesPage()),
                          );
                        },
                        child: const Text('Go to Actions & Services'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            '/mix-match'
                          );
                        },
                        child: const Text('Create your own AREA'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class EditProfilePage extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const EditProfilePage({super.key, required this.userInfo});

  @override
  _EditProfilePageState createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = false;
  String _message = '';
  File? _selectedImage;

  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController(); 
  final ImagePicker _picker = ImagePicker();

  String? serverAddress = "";

  @override
  void initState() {
    super.initState();
    getServerAddress();
    _firstNameController.text = widget.userInfo!['firstName'];
    _lastNameController.text = widget.userInfo!['lastName'];
  }

  Future<void> getServerAddress() async {
    serverAddress = await ServerOptionsStorage.getIpAddress();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
      });
    }
  }

  Future<void> saveProfile() async {
    setState(() {
      _isLoading = true;
      _message = '';
    });

    try {
       var request = http.MultipartRequest(
          'POST',
          Uri.parse('$serverAddress/user/update'),
        );
        request.fields['email'] = widget.userInfo!['email'];
        request.fields['firstName'] = _firstNameController.text;
        request.fields['lastName'] = _lastNameController.text;

        if (_selectedImage != null) {
          request.files.add(await http.MultipartFile.fromPath(
            'file',
            _selectedImage!.path,
          ));
        }

        final response = await request.send();
        final responseData = await http.Response.fromStream(response);

      if (responseData.statusCode == 200) {
          setState(() {
            _message = 'Profile updated successfully!';
          });
      } else {
        setState(() {
          _message = 'Failed to update profile: ${responseData.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        _message = 'Error updating profile: $e';
      });
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
        title: Text('Edit Profile'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              GestureDetector(
                onTap: _pickImage,
                child: CircleAvatar(
                  radius: 50,
                  backgroundImage: _selectedImage != null
                      ? FileImage(_selectedImage!)
                      : NetworkImage("$serverAddress${widget.userInfo!['profilePic']}") as ImageProvider<Object>,
                  child: _selectedImage == null
                      ? Icon(Icons.camera_alt, size: 30, color: Colors.white)
                      : null,
                ),
              ),
              SizedBox(height: 16),

              TextFormField(
                controller: _firstNameController,
                decoration: InputDecoration(
                  labelText: 'First Name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              
              TextFormField(
                controller: _lastNameController,
                decoration: InputDecoration(
                  labelText: 'Last Name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              
              ElevatedButton(
                onPressed: _isLoading ? null : saveProfile,
                child: _isLoading
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(
                            value: null,
                            strokeWidth: 2.0,
                            color: Colors.white,
                          ),
                          SizedBox(width: 10),
                          Text('Saving...'),
                        ],
                      )
                    : Text('Save Changes'),
              ),
              SizedBox(height: 16),
              
              if (_message.isNotEmpty)
                Text(
                  _message,
                  style: TextStyle(
                    color: _message.startsWith('Error') || _message.startsWith('Failed')
                        ? Colors.red
                        : Colors.green,
                  ),
                ),

              OutlinedButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: Text('Cancel'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }
}

class ActionsServicesPage extends StatelessWidget {
  const ActionsServicesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: buildCustomAppBar(context, "Actions & Services"),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Actions & Services',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/actions');
                },
                child: const Text('Actions & Reactions'),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/services');
                },
                child: const Text('Services'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}