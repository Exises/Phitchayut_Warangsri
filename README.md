# 🐉 D&D Companion

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)

**D&D Companion** is a comprehensive, interactive web application designed for Dungeons & Dragons (5e) players and Dungeon Masters. It streamlines character creation, gameplay mechanics, and rules referencing, while introducing AI-powered narrative tools to enhance the tabletop RPG experience.

---

## ✨ Key Features

- **🛡️ Character Workshop:** A step-by-step interactive character builder handling classes, races, abilities, and equipment.
- **📜 Character Vault:** Save, manage, and edit your active character sheets securely.
- **🎲 3D Physics Dice Roller:** Integrated interactive 3D dice physics (powered by `@3d-dice/dice-box`) for an immersive rolling experience.
- **📚 Rules Compendium:** A fully searchable database for 5e SRD rules, spells, monsters, and items.
- **🤖 AI DM Class Test:** An interactive, narrative-driven psychological test powered by **Google Gemini 1.5 Flash** that acts as a Dungeon Master to determine your perfect D&D class.
- **🔒 Secure Authentication:** Complete user registration, login, profile management, and SMTP-based password recovery.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** Custom CSS with CSS Variables (Dark Fantasy Theme)
- **3D Graphics:** `@3d-dice/dice-box`
- **UI Components:** SweetAlert2 for polished alerts and modals

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (via `mysql2/promise`)
- **AI Integration:** `@google/generative-ai` (Gemini API)
- **Authentication:** `bcryptjs` for password hashing
- **Mailing:** `nodemailer` for password reset functionality

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
- Node.js (v16+ recommended)
- XAMPP / MySQL Server
- A Google Gemini API Key
- A Gmail account with an App Password (for the password reset feature)

### 1. Database Setup
1. Open XAMPP and start the **MySQL** module.
2. Open phpMyAdmin (usually `http://localhost/phpmyadmin`).
3. Create a new database named `dnd_project`.
4. Import the provided SQL dump file (`dnd_project.sql`) into the `dnd_project` database.

### 2. Backend Setup
Navigate to the Backend directory and install dependencies:
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory with the following variables:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
SMTP_USER=your_email@example.com
SMTP_PASS=your_16_digit_app_password
```

Start the backend server:
```bash
node server.js
```
*The server should now be running on `http://localhost:5000`.*

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd dungeon-companion
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The application should now be accessible at `http://localhost:5173`.*

### 📦 Production Build
To create a highly optimized production build:
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```text
dnd-companion/
├── Backend/                 # Node.js API Server
│   ├── routes/              # Express API Routes (Auth, Characters, AI DM)
│   ├── server.js            # Main Server Entry Point
│   ├── db.js                # MySQL Connection Pool
│   └── .env                 # Environment Variables (Not included in Git)
│
├── dungeon-companion/       # React Frontend
│   ├── public/              # Static Assets & llms.txt
│   ├── src/                 
│   │   ├── components/      # Reusable React Components (Navbar, Dice3D)
│   │   ├── pages/           # Main Views (Workshop, Compendium, AI DM)
│   │   ├── App.jsx          # Router & Context Providers
│   │   └── main.jsx         # React DOM Entry
│   ├── index.html           # HTML Template (SEO Optimized)
│   └── package.json         # Frontend Dependencies
│
├── dnd_project.sql          # Database Schema & Initial Data
└── README.md                # Project Documentation
```

---

## ⚖️ Legal Notice

This project is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

The application utilizes content from the System Reference Document 5.1 (SRD5) licensed under the Creative Commons Attribution 4.0 International License (CC-BY-4.0).
