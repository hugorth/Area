import 'package:flutter/material.dart';
import 'package:flutter_web_auth/flutter_web_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_client/utils/appbar.dart';
import 'package:mobile_client/utils/auth_storage.dart';
import 'package:mobile_client/utils/server_options_storage.dart';

class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});

  @override
  _ServicesPageState createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage> {
  List<dynamic> services = [];
  List<dynamic> subscribedServices = [];
  String? serverAddress = "";
  bool isLoading = true;

  final googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  final microsoftAuthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  final githubAuthUrl = 'https://github.com/login/oauth/authorize';
  final dropboxAuthUrl = 'https://www.dropbox.com/oauth2/authorize';
  final spotifyAuthUrl = 'https://accounts.spotify.com/authorize';
  final xAuthUrl = 'https://twitter.com/i/oauth2/authorize';
  final discordAuthUrl = 'https://discord.com/api/oauth2/authorize';
  final boxAuthUrl = 'https://account.box.com/api/oauth2/authorize';

  @override
  void initState() {
    super.initState();
    getServices().whenComplete(getSubscribedServices);
  }

  Future<void> getServices() async {
    serverAddress = await ServerOptionsStorage.getIpAddress();

    try {
      final response = await http.get(
        Uri.parse('$serverAddress/services'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        services = json.decode(response.body);
      } else {
        print('Error ${response.statusCode}: ${response.body}');
      }
    }
    catch (e) {
      print('There was an error during loading: $e');
    }
  }

  Future<void> getSubscribedServices() async {
     try {
      final token = await AuthStorage.getAccessToken();
      final response = await http.get(
        Uri.parse('$serverAddress/services/subscribed-services'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        subscribedServices = json.decode(response.body).map((service) => service['service_id']).toList();
      } else {
        print('Error ${response.statusCode}: ${response.body}');
      }
    }
    catch (e) {
      print('There was an error during loading: $e');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> subscribe(String serviceName, int pos) async {
    String url;

    switch(serviceName) {
      case "Gmail":
        url = "$googleAuthUrl?client_id=${dotenv.env['GMAIL_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email&state=gmail&prompt=consent";
        break;
      case "Teams":
        url = "$microsoftAuthUrl?client_id=${dotenv.env['TEAMS_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&scope=user.read&state=teams";
        break;
      case "DropBox":
        url = "$githubAuthUrl?client_id=${dotenv.env['DROPBOX_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&state=dropbox";
        break;
      case "Github":
        url = "$dropboxAuthUrl?client_id=${dotenv.env['GITHUB_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&scope=user&state=github";
        break;
      case "Spotify":
        url = "$spotifyAuthUrl?client_id=${dotenv.env['SPOTIFY_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&state=spotify&scope=user-read-currently-playing%20user-read-playback-state";
        break;
      case "X":
        url = "$xAuthUrl?client_id=${dotenv.env['X_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&state=x";
        break;
      case "Discord":
        url = "$discordAuthUrl?client_id=${dotenv.env['DISCORD_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&scope=identify email&state=discord";
        break;
      case "Box":
      url = "$boxAuthUrl?client_id=${dotenv.env['BOX_SERVICE_CLIENT_ID']}&redirect_uri=$serverAddress/auth/services/callback&response_type=code&state=box";
      default:
        print("There's no such service");
        return;
    }

    try {
      final token = await AuthStorage.getAccessToken();
      
      final authentication = await FlutterWebAuth.authenticate(
        url: url,
        callbackUrlScheme: 'mobileclient',
      );
      
      final service = Uri.parse(authentication).queryParameters['connected'];
      
      if (service != null) {
        final subscription = await http.post(
          Uri.parse('$serverAddress/services/subscribe'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'service_id': services[pos]['_id']
          })
        );
        if (subscription.statusCode == 201) {
          setState(() {
            isLoading = false;
            subscribedServices.add(services[pos]);
            print("Subscribed to $serviceName service");
          });
        } else {
            print("error ${subscription.statusCode} : ${json.decode(subscription.body)}");
        }
      } else {
        print("error could not connect to service");
      }
    } catch (e) {
      print('there was an error: $e');
    }
  }

  Future<void> unsubscribe(String serviceName, int pos) async {
    try {
      final token = await AuthStorage.getAccessToken();
      final subscription = await http.post(
        Uri.parse('$serverAddress/services/unsubscribe'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'service_id': services[pos]['_id']
        })
      );

      if (subscription.statusCode == 200) {
        setState(() {
          isLoading = false;
          subscribedServices.removeWhere((service) => service['name'] == serviceName);
          print("Unsubscribed from $serviceName service");
        });
      }
    } catch (e) {
      print('there was an error: $e');
    } 
  }

  Future<void> handleSubscription(String serviceName, int pos) async {
    setState(() {
      isLoading = true;
    });
    
    if (isSubscribed(serviceName)) {
      await unsubscribe(serviceName, pos);
    } else {
      await subscribe(serviceName, pos);
    }
  }

  Image getAssetImage(String name) {
    String assetPath = "assets/";
    
    switch(name) {
      case "Gmail":
        assetPath += "gmail_logo.png";
        break;
      case "Teams":
        assetPath += "teams_logo.png";
        break;
      case "DropBox":
        assetPath += "dropbox_logo.png";
        break;
      case "Github":
        assetPath += "github_logo.png";
        break;
      case "Spotify":
        assetPath += "spotify_logo.png";
        break;
      case "X":
        assetPath += "x_logo.png";
        break;
      case "Discord":
        assetPath += "discord_logo.png";
        break;
      case "Box":
        assetPath += "box_logo.png";
        break;
      default:
        assetPath += "area_logo.png";
    }
    return Image.asset(assetPath, width: 50, height: 50);
  }

  bool isSubscribed(String serviceName) {
    return subscribedServices.any((service) => service['name'] == serviceName);
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: buildCustomAppBar(context, "Services"),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: buildCustomAppBar(context, "Available Services"),
      body: Padding(
        padding: const EdgeInsets.all(10.0),
        child: Column(
          children: [
            Expanded(
              child: GridView.builder(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.8,
                ),
                itemCount: services.length,
                itemBuilder: (context, index) {
                  String serviceName = services[index]['name']!;

                  bool subscribed = isSubscribed(serviceName);

                  return Card(
                    elevation: 4,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        getAssetImage(serviceName),
                        SizedBox(height: 10),
                        Text(serviceName),
                        SizedBox(height: 10),
                        ElevatedButton(
                          onPressed: () {
                            handleSubscription(serviceName, index);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: subscribed ? Colors.grey : Color(0xFF095cfc),
                          ),
                          child: Text(
                            subscribed ? "Unsubscribe" : "Subscribe",
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
