import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_client/utils/appbar.dart'; 
import 'package:mobile_client/utils/server_options_storage.dart';
import 'package:mobile_client/utils/auth_storage.dart';

class ActionsPage extends StatefulWidget {
  const ActionsPage({super.key});

  @override
  _ActionsPageState createState() => _ActionsPageState();
}

class _ActionsPageState extends State<ActionsPage> {
  final List<Map<String, dynamic>> applets = [
    {
      'services': ['Gmail', 'Teams'],
      'description': 'Send a Teams message when an email with an attachment is received in Gmail.',
      'logo1': 'assets/gmail_logo.png',
      'logo2': 'assets/teams_logo.png',
      'actionName': 'gmail_teams_action',
      'activated' : false
    },
    {
      'services': ['Gmail', 'Teams'],
      'description': 'Send a Teams message when an email matching specific filters (sender, subject) is received in Gmail.',
      'logo1': 'assets/gmail_logo.png',
      'logo2': 'assets/teams_logo.png',
      'actionName': 'filtered_gmail_teams_notification',
      'filters': { 'from': '', 'subject': '', 'keywords': '' },
      'activated' : false
    },
    {
      'services': ['Gmail', 'Teams'],
      'description': 'Send a Teams message when an email from a specific sender is received in Gmail.',
      'logo1': 'assets/gmail_logo.png',
      'logo2': 'assets/teams_logo.png',
      'actionName': 'filtered_email_notification',
      'filters': { 'specificSenderEmail': '' },
      'activated' : false
    },
    {
      'services': ['Gmail', 'Teams'],
      'description': 'Display the list of contacts in Gmail in a Teams message. when you do the command /contacts.',
      'logo1': 'assets/gmail_logo.png',
      'logo2': 'assets/teams_logo.png',
      'actionName': '1',
      'activated' : false
    },
    {
      'services': ['Gmail', 'Teams'],
      'description': 'If an email with the keyword "Urgent" in the subject is received automatically start a meeting in Microsoft Teams with the necessary participants.',
      'logo1': 'assets/gmail_logo.png',
      'logo2': 'assets/teams_logo.png',
      'actionName': '2',
      'activated' : false
    },
    {
      'services': ['Gmail', 'Teams'],
      'description': 'Reception of an email with a “report” type file (Excel or PDF file). Automatically share the file in a Teams channel and notify channel members.',
      'logo1': 'assets/gmail_logo.png',
      'logo2': 'assets/teams_logo.png',
      'actionName': '3',
      'activated' : false
    },
    {
      'services': ['Spotify', 'Discord'],
      'description': 'Send a Discord message when a song is played on Spotify.',
      'logo1': 'assets/spotify_logo.png',
      'logo2': 'assets/discord_logo.png',
      'actionName': 'spotify_discord_action',
      'activated' : false
    },
    {
      'services': ['Spotify', 'Discord'],
      'description': 'Display the list of songs in Spotify playlist in a Discord message when you do the command /playlist "name of the playlist".',
      'logo1': 'assets/spotify_logo.png',
      'logo2': 'assets/discord_logo.png',
      'actionName': '5',
      'playlistName': '',
      'activated' : false
    },
    {
      'services': ['Spotify', 'Discord'],
      'description': 'When you likes a song on Spotify. Share a message in Discord with a link to the song to invite other members to listen to it.',
      'logo1': 'assets/spotify_logo.png',
      'logo2': 'assets/discord_logo.png',
      'actionName': '6',
      'activated' : false
    },
    {
      'services': ['Spotify', 'Discord'],
      'description': 'When a song reaches a certain number of plays on Spotify. Create an announcement on Discord to celebrate the popularity of the song in the server.',
      'logo1': 'assets/spotify_logo.png',
      'logo2': 'assets/discord_logo.png',
      'actionName': '7',
      'activated' : false
    },
    {
      'services': ['Spotify', 'Discord'],
      'description': 'Displays all the songs of an artist in a teams conversation when you do /artist “artist name”',
      'logo1': 'assets/spotify_logo.png',
      'logo2': 'assets/discord_logo.png',
      'actionName': '8',
      'singerName': '',
      'activated' : false
    },
    {
      'services': ['Box', 'Github'],
      'description': 'A file is added or updated in a specific Box folder. Create an issue in a GitHub repository to notify developers of new changes in Box.',
      'logo1': 'assets/box_logo.png',
      'logo2': 'assets/github_logo.png',
      'actionName': '9',
      'activated' : false
    },
    {
      'services': ['Box', 'Github'],
      'description': 'A Box folder is shared with a new user. Create a new private GitHub repository containing files from the shared Box folder.',
      'logo1': 'assets/box_logo.png',
      'logo2': 'assets/github_logo.png',
      'actionName': '10',
      'activated' : false
    },
    {
      'services': ['Box', 'Github'],
      'description': 'A file is deleted from Box. Open a pull request on a GitHub repository to delete the corresponding files in the project.',
      'logo1': 'assets/box_logo.png',
      'logo2': 'assets/github_logo.png',
      'actionName': '11',
      'activated' : false
    },
    {
      'services': ['Box', 'Github'],
      'description': 'A change is detected in a Box file used in a GitHub project. Create a branch in the GitHub repository to reflect the changes made on Box.',
      'logo1': 'assets/box_logo.png',
      'logo2': 'assets/github_logo.png',
      'actionName': '12',
      'activated' : false
    },
    {
      'services': ['Box', 'Github'],
      'description': 'A document is uploaded to a collaborative work folder on Box. Automatically update the README.md of the corresponding GitHub project to include the link to the Box document.',
      'logo1': 'assets/box_logo.png',
      'logo2': 'assets/github_logo.png',
      'actionName': '13',
      'activated' : false
    },
  ];
  List<dynamic> subscribedServices = [];

  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchSubscribedServices().whenComplete(fetchSubscribedActions);
  }
  Future<void> fetchSubscribedServices() async {
    try {
      final token = await AuthStorage.getAccessToken();
      final ip = await ServerOptionsStorage.getIpAddress();
      final response = await http.get(
        Uri.parse('$ip/services/subscribed-services'),
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
    }
  }

  Future<void> fetchSubscribedActions() async {
    try {
      final userId = await AuthStorage.getUserId();
      final ip = await ServerOptionsStorage.getIpAddress();

      final response = await http.get(
        Uri.parse('$ip/actions/subscriptions/$userId'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> subbedActions = json.decode(response.body);
        for (dynamic subbedAction in subbedActions) {
          for (Map<String, dynamic> applet in applets) {
            if (applet['actionName'] == subbedAction['actionName']) {
              subbedAction['activated'] = true;
              break;
            }
          }
        }
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch (e) {
      print("error: $e");
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> subscribeService(Map<String, dynamic> applet) async {
    try {
      final ip = await ServerOptionsStorage.getIpAddress();
      final userId = await AuthStorage.getUserId();

      final data = {
        'userId': userId,
        'actionName': applet['actionName'],
        'filters': applet['filters'] ?? {},
        'playlistName': applet['actionName'] == '5' ? applet['playlistName'] : null,
        'singerName': applet['actionName'] == '8' ? applet['singerName'] : null
      };

      final response = await http.post(
        Uri.parse("$ip/actions/subscribe"),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(data)
      );

      if (response.statusCode == 200) {
        await fetchSubscribedActions();
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch (e) {
      print("error: $e");
    }
  }

  Future<void> unsubscribeService(Map<String, dynamic> applet) async {
     try {
      final ip = await ServerOptionsStorage.getIpAddress();
      final userId = await AuthStorage.getUserId();

      final data = {
        'userId': userId,
        'actionName': applet['actionName'],
      };

      final response = await http.post(
        Uri.parse("$ip/actions/unsubscribe"),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(data)
      );

      if (response.statusCode == 200) {
        await fetchSubscribedActions();
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch (e) {
      print("error: $e");
    }
  }

  void handleToggle(int index) {
    setState(() {
      isLoading = true;
      applets[index]['activated'] = !applets[index]['activated'];
    });

    if (applets[index]['activated']) {
      subscribeService(applets[index]);
    } else {
      unsubscribeService(applets[index]);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: buildCustomAppBar(context, "Action & Reaction"),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: buildCustomAppBar(context, "Actions & Reactions"),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ListView.builder(
          itemCount: applets.length,
          itemBuilder: (context, index) {
            String service1 = applets[index]['services'][0];
            String service2 = applets[index]['services'][1];
            String description = applets[index]['description'];
            String logo1 = applets[index]['logo1'];
            String logo2 = applets[index]['logo2'];
            bool activated = applets[index]['activated'];

            if (!(subscribedServices.any((service) => service['name'] == service1) &&
                subscribedServices.any((service) => service['name'] == service2))) {
              return SizedBox.shrink();
            }

            return Card(
              elevation: 4,
              margin: const EdgeInsets.symmetric(vertical: 10),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Image.asset(
                          logo1,
                          height: 50,
                          width: 50,
                          semanticLabel: service1,
                        ),
                        Image.asset(
                          "assets/arrows.png", 
                          height: 50,
                          width: 50,
                        ),
                        Image.asset(
                          logo2,
                          height: 50,
                          width: 50,
                          semanticLabel: service2,
                        ),
                      ],
                    ),
                    SizedBox(height: 10),
                    Text(
                      description,
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 10),
                    if (applets[index].containsKey('filters'))
                      for (var entry in (applets[index]['filters'] as Map<String, String>).entries) ... [
                        TextField(
                          decoration: InputDecoration(
                            labelText: entry.key
                          ),
                          onChanged: (value) => applets[index]['filters'][entry.key] = value,
                        ),
                        SizedBox(height: 10)
                      ],
                    if (applets[index].containsKey('playlistName')) ... [
                      TextField(
                        decoration: InputDecoration(
                          labelText: "Playlist Name"
                        ),
                        onChanged: (value) => applets[index]['playlistName'] = value
                      ),
                      SizedBox(height: 10)
                    ],
                    if (applets[index].containsKey('singerName')) ... [
                      TextField(
                        decoration: InputDecoration(
                          labelText: "Singer Name"
                        ),
                        onChanged: (value) => applets[index]['singerName'] = value
                      ),
                      SizedBox(height: 10)
                    ],
                    ElevatedButton(
                      onPressed: () => handleToggle(index),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: activated ? Colors.grey : Colors.blue,
                      ),
                      child: Text(
                        activated ? 'Activated' : 'Activate',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
