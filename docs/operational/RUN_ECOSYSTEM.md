# Running the Questerix Ecosystem

Questerix consists of multiple independent applications that talk to each other.
To develop the full "User Journey", you need to run them simultaneously.

## 🏗 System Architecture

| App | Port | Tech Stack | Purpose |
|-----|------|------------|---------|
| **Landing Page** | `5175` | React / Vite | Marketing & Subject Hubs |
| **Student App** | `3000` | Flutter Web | Main Learning Interface |
| **Admin Panel** | `5173` | React / Vite | Content Management |

---

## 🚀 Quick Start Guide

### Step 1: Start the Student App (Target Destination)
This is where users land after clicking "Get Started". It needs to be running first.

```powershell
cd student-app
flutter run -d web-server --web-port=3000 --web-hostname=127.0.0.1
```
*Wait for "Listening at http://127.0.0.1:3000" before proceeding.*

### Step 2: Start the Landing Page (Entry Point)
This is where you browse subjects and click the buttons.

```powershell
cd landing-pages
npm run dev -- --port 5175 --host 127.0.0.1
```

### Step 3: Test the Flow
1. Open **http://127.0.0.1:5175** in Chrome.
2. Browse the Landing Page.
3. Click "Log in" or "Get Started".
4. You should be redirected to **http://localhost:3000** (Student App).

---

## 🔧 Troubleshooting

**"Connection Refused" on localhost:3000**
- Is the Flutter app actually running? Check the terminal.
- Did it crash? Restart it.

**Mobile Device Testing**
- `localhost` only works on YOUR computer.
- To test on a real phone, you must run both apps on your **Host IP** (e.g., `192.168.1.X`) instead of `127.0.0.1`.
- Update the links in `Header.tsx` to point to your IP address.
