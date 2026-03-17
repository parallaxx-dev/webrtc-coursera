# 🚀 WebRTC Peer-to-Peer Video Chat  
### Real-Time Communication using WebRTC + WebSockets

🌐 **Live Demo:** https://webrtc-coursera.onrender.com

---

## 📌 Overview

This project is a **real-time peer-to-peer video communication system** built using **WebRTC** for media exchange and **WebSockets** for signaling.

It allows two users to:
- Create or join a private room  
- Establish a direct P2P connection  
- Exchange audio, video, and messages in real time  

Unlike traditional server-heavy systems, media flows **directly between peers**, ensuring **low latency and efficiency**.

---

## ✨ Features

- 🎥 Real-time video & audio streaming  
- 🔗 Peer-to-peer communication (WebRTC)  
- 🌐 WebSocket-based signaling server  
- 🧊 ICE Candidate exchange (STUN + TURN support)  
- 🏠 Room creation, join, and destroy system  
- 💬 DataChannel messaging support  
- 🔄 Automatic reconnection handling  
- 🌍 Deployed and accessible online  

---

## 🧠 How It Works
User A ──────┐
│ (WebSocket Signaling)
▼
Node.js Server
▲
│
User B ──────┘

After signaling:

User A ⇄⇄⇄ User B
(Direct WebRTC P2P connection)

---

## 🔑 Key Concepts Used

- WebRTC (RTCPeerConnection)
- ICE Candidates (STUN/TURN servers)
- SDP Offer/Answer Model
- Data Channels (for messaging)
- WebSockets (signaling)
- NAT traversal

---


📦 Installation
```bash
git clone https://github.com/parallaxx-dev/webrtc-coursera.git
cd webrtc-coursera
npm install
```
▶️ Run Locally
```bash
node server.js
```
Then open:

http://localhost:8080
🌐 Deployment

Live project is deployed on Render:

👉 https://webrtc-coursera.onrender.com

🔐 ICE Configuration

The project uses:

STUN Servers

Google STUN servers

Metered STUN

TURN Servers (for NAT traversal)

Metered TURN (TCP + UDP + TLS)


🔄 WebRTC Flow
Offerer:

Create PeerConnection

Add media tracks

Create Offer

Send via WebSocket

Answerer:

Receive Offer

Set Remote Description

Create Answer

Send back

Both:

Exchange ICE candidates

Establish connection

💬 Data Channel

Used for messaging between peers

Runs alongside media streams

Fully peer-to-peer

⚠️ Important Notes

Requires HTTPS in production for WebRTC

TURN server ensures connectivity behind NAT/firewalls

Only 2 users per room supported (by design)

🛣️ Roadmap

 WebRTC connection setup

 Video/audio streaming

 Room system

 DataChannel messaging

 Multi-user support (SFU upgrade)

 Screen sharing

 Chat UI improvements

 Recording feature

🚀 Why This Project Stands Out

🔥 Full WebRTC implementation (not just demo APIs)

🔥 Handles NAT traversal using TURN

🔥 Clean modular architecture

🔥 Real-world deployable system

🔥 Demonstrates deep networking knowledge
