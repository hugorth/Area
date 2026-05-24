![AREA](uploads/area_readme.png)

# **🌪 - ACTION - REACTION**

## **🤠 - Introduction**

This project aims to explore and implement a complete software platform through the creation of a business application, drawing inspiration from platforms like IFTTT or Zapier. 

__The application suite is divided into three main components:__

- Application Server: This will handle all core business logic and features as outlined in the specifications.

- Web Client: A browser-based interface that interacts with the application server to provide a user-friendly experience.

- Mobile Client: A mobile app allowing users to access and interact with the application server from their phones.

Both the web and mobile clients act as interfaces and perform no business logic; they simply send and receive requests to and from the application server. Throughout development, accessibility guidelines and best practices will be prioritized to ensure the application is usable by as many people as possible, including those with disabilities.

## **📱 - General Considerations**

As part of this project, the team will assume the role of a Software Architect. 

The focus is not on writing excessive amounts of code but rather on selecting, understanding, and integrating a variety of existing libraries and technologies. 

The core development task will be to implement the business logic and act as the "glue" that connects various software components.

Before starting the implementation, careful analysis of the required components will be conducted to ensure the correct architecture is chosen. This involves two key steps:

- **State of the Art:** Researching different potential solutions and selecting the right components based on project requirements.

- **Proof of Concept (POC):** Building small demo programs to validate that each component or algorithm works as expected.

Given the scope of this project, effective project management will be crucial to its success. It is important to avoid rushing into development and instead take the time to properly plan and organize tasks.

## **💡 - Functions**

The application will provide the following functionalities:

**1. User Registration:** Users can register on the application to create an account (see User Management).

**2. User Confirmation:** Once registered, users must confirm their enrollment on the platform before being able to use it (see Authentication/Identification).

**3. Service Subscription:** After authentication, users are prompted to subscribe to various services (see Services).

**4. Service Components:** Each service consists of the following components:

  - **Action Type:** Defines the actions available (see Action Components).
   - **REAction Type:** Defines the reactions to actions (see REAction Components).

**5. AREA Composition:** Authenticated users can create an AREA by connecting an Action to a previously configured REAction (see AREA).

**6. Triggering AREA:** The application automatically triggers AREA based on specific triggers (see Trigger).

The application server serves both web and mobile clients and exposes all functionalities via a REST API.

## **📚 - Technologies**

The following technologies will be used in the project:

**- Frontend:** React.js for the web client.

**- Backend:** Node.js for the application server.

**- Mobile:** Flutter for the mobile client.

## **🚩 - Work Group**

This project is to be completed as a group. The validation of the associated module will depend not only on the quality of the work delivered but also on the number of available features. The minimum expected configuration for a group of X students is as follows:

- **NBS:** The number of services supported by the application server and accessible from the clients.

- **NBA:** The total number of Actions supported by all services and available to the clients.

- **NBR:** The total number of REActions supported by all services and available to the clients.

**__Expected Requirements:__**

- **NBS ≥ 1 + X:** The application must support at least 1 plus the number of students in the group.

- **NBA + NBR ≥ 3 * X:** The sum of Actions and REActions must be at least three times the number of students in the group.

In cases where one of the clients (either web or mobile) offers fewer features than the other, the validation will be based on the client with the least number of available features.

## **✅ - Action and Reaction**

Each service in the application can offer both Action and REAction components.

**Action Components:** These components trigger specific actions when a certain condition is met. 

For example:

- **Social Media (Google, Facebook, Instagram, etc.):** A new post is made, a message is received, or the user gains a follower.

- **Cloud Services (OneDrive, Dropbox):** A new file is added or shared.

- **Email (Outlook, Gmail):** A message is received from a specific user or contains certain keywords.

- **Timer:** Specific date or time conditions are met.

**REAction Components:** These components define tasks to be performed in response to an action trigger. 

For example:

- **Social Media:** The user posts a message or adds a new person.
- **Cloud Services:** The user adds or shares a file.

- **Email:** The user sends a message to a recipient.

- **Scripting:** The user performs custom tasks, like checking project permissions.

In summary, Action Components detect and trigger specific events, while REAction Components define the responses to those triggers.

## **📅 - Schedule**

The project will be divided into several phases:

- **Phase 1:** Project setup and initial research.
- **Phase 2:** Proof of Concept (POC) for each component.
- **Phase 3:** Implementation of the application server.
- **Phase 4:** Implementation of the web client.
- **Phase 5:** Implementation of the mobile client.
- **Phase 6:** Integration and testing.
- **Phase 7:** Finalization and delivery.
- **Phase 8:** Presentation and defense.

## **📋 - Subject**

**_The subject of the project :_** [AREA](uploads/B-DEV-500_AREA.pdf)
