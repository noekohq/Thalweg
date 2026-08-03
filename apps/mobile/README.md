# Thalweg Mobile

This directory is reserved for the React Native mobile edge-node application.
It is not a workspace package until its application scaffold and mobile daemon
contract are implemented.

The mobile client will keep a durable local outbox, capture text and audio,
join multiple Thalweg networks, and synchronize opportunistically through an
authenticated mobile-facing daemon transport. It will not assume that a mobile
operating system can run the desktop Go daemon continuously in the background.

Before scaffolding the app, specify the mobile transport, credential storage,
selective replication, blob transfer, and background synchronization contract.
