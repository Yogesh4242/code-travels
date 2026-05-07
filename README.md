# VOID.

**Void** is a minimalist, ephemeral code-sharing application. It is designed for developers who need to instantly pass code snippets, logs, or large payloads across devices or to peers without the friction of databases, logins, or permanent storage.

When the server sleeps, the rooms dissolve. No logs. No trace.

### Features
* **Ephemeral Architecture:** Built entirely on in-memory storage. When the Node.js process ends or restarts, all data is permanently wiped.
* **Frictionless Entry:** No accounts or links required. Just a randomly generated 4-digit PIN.
* **Massive Payloads:** Configured to easily accept and render up to 10,000+ lines of code instantly.
* **Luxe-Minimalist UI:** A distraction-free, dark-mode-native interface designed to get out of your way.
* **History Log:** Keeps track of everything pasted in the room during the active session, with one-click copying.

### Tech Stack
* **Backend:** Node.js, Express.js (Single-file server setup)
* **Frontend:** Vanilla HTML, CSS, and JavaScript
* **Database:** None (In-memory `RAM` storage)

---

### Run it Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/void-code-share.git](https://github.com/your-username/void-code-share.git)
   cd void-code-share
