import 'dart:convert';
import 'package:mobile_client/main.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_client/utils/appbar.dart';
import 'package:mobile_client/utils/auth_storage.dart';
import 'package:mobile_client/utils/server_options_storage.dart';

class MixMatchPage extends StatefulWidget {
  const MixMatchPage({super.key});

  @override
  _MixMatchPageState createState() => _MixMatchPageState();
}

class _MixMatchPageState extends State<MixMatchPage> with RouteAware {
  List<Map<String, dynamic>> savedAreas = [];

  bool isLoading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    routeObserver.subscribe(this, ModalRoute.of(context) as PageRoute);
  }

  @override
  void initState() {
    super.initState();
    _fetchSavedAreas();
  }

  @override
  void dispose() {
    routeObserver.unsubscribe(this);
    super.dispose();
  }

  @override
  void didPopNext() {
    setState(() {
      isLoading = true;
    _fetchSavedAreas();
    });
  }

  Future<void> _fetchSavedAreas() async {
    try {
      final userId = await AuthStorage.getUserId();
      final ip = await ServerOptionsStorage.getIpAddress();

      final response = await http.get(
        Uri.parse("$ip/api/saved-automations?userId=$userId"),
        headers: {
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        savedAreas = (json.decode(response.body) as List).map((item) => item as Map<String, dynamic>).toList();
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch(e) {
      print("error: $e");
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _updateArea(int index) async {
    setState(() {
      savedAreas[index]['isActive'] = !savedAreas[index]['isActive'];
      isLoading = true;
    });
    
    try {
      final ip = await ServerOptionsStorage.getIpAddress();

      final response = await http.put(
        Uri.parse("$ip/api/saved-automations/${savedAreas[index]['_id']}"),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(savedAreas[index])
      );

      if (response.statusCode == 200) {
        print('saved');
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch(e) {
      print("error: $e");
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _deleteArea(int index) async {
    setState(() {
      isLoading = true;
    });

    try {
      final ip = await ServerOptionsStorage.getIpAddress();

      final response = await http.delete(
        Uri.parse("$ip/api/saved-automations/${savedAreas[index]['_id']}"),
        headers: {
          'Content-Type': 'application/json',
        }
      );

      if (response.statusCode == 200) {
        print('deleted');
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch (e) {
      print("error $e");
    } finally {
      setState(() {
        isLoading = false;
        savedAreas.removeAt(index);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: buildCustomAppBar(context, "Your AREAs"),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: buildCustomAppBar(context, "Your AREAs"),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () { 
                  Navigator.push(
                    context, 
                    MaterialPageRoute(builder: (context) => AvailableActionsPage()),
                  );
                },
                style: ButtonStyle(
                  foregroundColor: WidgetStatePropertyAll(Colors.black)
                ),
                icon: const Icon(Icons.add),
                label: const Text('New'),
              ),
            ),
            Expanded(
              child: savedAreas.isNotEmpty
                  ? ListView.builder(
                      itemCount: savedAreas.length,
                      itemBuilder: (context, index) {
                        final area = savedAreas[index];
                        return Card(
                          margin: EdgeInsets.symmetric(vertical: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Image.asset(area['action']['logo1']!, width: 40, height: 40),
                                    SizedBox(width: 32),
                                    Image.asset(area['reaction']['logo1']!, width: 40, height: 40),
                                  ],
                                ),
                                SizedBox(height: 16),
                                Text(area['action']['description']),
                                Icon(Icons.arrow_downward),
                                Text(area['reaction']['description']),
                                SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    ElevatedButton(
                                      onPressed: () => _updateArea(index),
                                      style: area['isActive'] ? 
                                        ElevatedButton.styleFrom(backgroundColor: Colors.orange) :
                                        ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                                      child: area['isActive'] ? 
                                        Text('Deactivate', style: TextStyle(color: Colors.black)) :
                                        Text('Activate', style: TextStyle(color: Colors.black))
                                    ),
                                    ElevatedButton(
                                      onPressed: () => _deleteArea(index),
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                      child: Text('Delete', style: TextStyle(color: Colors.black))
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    )
                  : Center(
                      child: Text(
                        'No saved AREAs.\nClick "+ New" to create one.',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class AvailableActionsPage extends StatefulWidget {
  const AvailableActionsPage({super.key});

  @override
  _AvailableActionsPageState createState() => _AvailableActionsPageState();
}

class _AvailableActionsPageState extends State<AvailableActionsPage> {
  final List<Map<String, String>> actions = [
    {
      'service': 'Gmail',
      'description': 'Receive an email with a specific keyword',
      'logo1': 'assets/gmail_logo.png',
      'actionName': 'gmail_receive_email_with_keyword'
    },
    {
      'service': 'Github',
      'description': 'New commit in a repository',
      'logo1': 'assets/github_logo.png',
      'actionName' : 'github_new_commit'
    },
    {
      'service': 'Spotify',
      'description': 'Song added to a playlist',
      'logo1': 'assets/spotify_logo.png',
      'actionName' : 'spotify_new_song_added_to_playlist'
    },
    {
      'service': 'Teams',
      'description': 'New message in a channel',
      'logo1': 'assets/teams_logo.png',
      'actionName' : 'teams_new_message_in_channel'
    },
    {
      'service': 'Box',
      'description': 'New file added to a folder',
      'logo1': 'assets/box_logo.png',
      'actionName' : 'box_new_file_added_to_folder'
    },
  ];

  Map<String, dynamic> newArea = {
    'action' : {},
    'reaction' : {}
  };

  void _handleActionTap(Map<String, String> action) {
    newArea['action'] = action;
    Navigator.push(context, 
    MaterialPageRoute(builder: (context) => AvailableReactionsPage(newArea: newArea,)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Custom Action'),
      ),
      body: ListView.builder(
        itemCount: actions.length,
        itemBuilder: (context, index) {
          return ListTile(
            leading: Image.asset(actions[index]['logo1']!),
            title: Text(actions[index]['description']!),
            onTap: () => _handleActionTap(actions[index]),
            minVerticalPadding: 24,
          );
        },
      ),
    );
  }
}

class AvailableReactionsPage extends StatefulWidget {
  final Map<String, dynamic> newArea;

  const AvailableReactionsPage({super.key, required this.newArea});

  @override
  _AvailableReactionsPageState createState() => _AvailableReactionsPageState();
}

class _AvailableReactionsPageState extends State<AvailableReactionsPage> {
  final List<Map<String, String>> reactions = [
    {
      'service' : 'Discord',
      'description': 'Send a message in a channel',
      'logo1': 'assets/discord_logo.png',
      'reactionName': 'discord_send_message_in_channel'
    },
    {
      'service' : 'Teams',
      'description': 'Create an event in the calendar',
      'logo1': 'assets/teams_logo.png',
      'reactionName': 'teams_create_event_in_calendar'
    },
    {
      'service' : 'Gmail',
      'description': 'Send notification email',
      'logo1': 'assets/gmail_logo.png',
      'reactionName': 'gmail_send_notification_email'
    },
    {
      'service' : 'Box',
      'description': 'Save a file',
      'logo1': 'assets/box_logo.png',
      'reactionName': 'box_save_file'
    },
    {
      'service' : 'Spotify',
      'description': 'Add a song to a playlist',
      'logo1': 'assets/spotify_logo.png',
      'reactionName': 'spotify_add_song_to_playlist'
    },
  ];

  void _handleReactionTap(Map<String, String> reaction) {
    widget.newArea['reaction'] = reaction;
    Navigator.push(context, 
    MaterialPageRoute(builder: (context) => AreaConfirmationPage(newArea: widget.newArea)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Custom Reaction'),
      ),
      body: ListView.builder(
        itemCount: reactions.length,
        itemBuilder: (context, index) {
          return ListTile(
            leading: Image.asset(reactions[index]['logo1']!),
            title: Text(reactions[index]['description']!),
            onTap: () => _handleReactionTap(reactions[index]),
            minVerticalPadding: 24,
          );
        },
      ),
    );
  }
}

class AreaConfirmationPage extends StatefulWidget {
  final Map<String, dynamic> newArea;

  const AreaConfirmationPage({super.key, required this.newArea});

  @override
  _AreaConfirmationPageState createState() => _AreaConfirmationPageState();
}

class _AreaConfirmationPageState extends State<AreaConfirmationPage> {
  bool sent = false;

  Future<void> _saveArea() async {
    try {
      final userId = await AuthStorage.getUserId();
      final ip = await ServerOptionsStorage.getIpAddress();

      final response = await http.post(
        Uri.parse("$ip/api/saved-automations"),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'userId': userId,
          'action': widget.newArea['action'],
          'reaction': widget.newArea['reaction'],
          'isActive': true
        })
      );

      if (response.statusCode == 201) {
        print('AREA saved');
      } else {
        print("error ${response.statusCode}: ${response.body}");
      }
    } catch(e) {
      print("error: $e");
    } finally {
      setState(() {
        Navigator.of(context).popUntil((route) => route.settings.name == '/mix-match');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Confirm AREA'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text('Created AREA', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Card(
              margin: EdgeInsets.symmetric(vertical: 16),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                      Image.asset(widget.newArea['action']['logo1']!, width: 40, height: 40),
                      SizedBox(width: 32),
                      Image.asset(widget.newArea['reaction']['logo1']!, width: 40, height: 40),
                      ]
                    ),
                    SizedBox(height: 16),
                    Text(widget.newArea['action']['description']),
                    Icon(Icons.arrow_downward),
                    Text(widget.newArea['reaction']['description']),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        if (!sent) {
                          _saveArea();
                        }
                        setState(() {
                          sent = true;
                        });
                      },
                      style: ButtonStyle(
                        backgroundColor: sent ? WidgetStatePropertyAll(Colors.grey) : WidgetStatePropertyAll(Colors.blue)
                      ),
                      child: sent ? Text("Saving...", style: TextStyle(color: Colors.black54),) : Text('Save', style: TextStyle(color: Colors.black),)
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
