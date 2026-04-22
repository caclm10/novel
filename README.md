# 📚 The Digital Book-Binder

A mobile-first, distraction-free **Novel Writing and Reading** web application designed primarily for personal productivity and immersive consumption. 

Transformed from a client-only mock-data prototype into a fully persistent local-first powerhouse, this app serves as a safe haven to draft, organize, and binge-read your own written fiction.

---

## 🚀 Core Features

### 📖 For The Reader:
- **Immersive Reading Mode**: Seamlessly enter a swipe-to-navigate reading experience. Tap the bottom edge to reveal the settings drawer, or double-tap to enter true distraction-free fullscreen mode.
- **Dynamic Visual Themes**: Highly customizable on-the-fly variables. Instantly switch between **Light**, **OLED Dark**, or **Sepia** mode to reduce eye strain depending on your surroundings.
- **Micro-Tuning Settings**: Adjust Line Spacing and Font Size using responsive modal sliders to build your perfect reading typography.
- **Contextual "Continue Reading"**:
  - Global *(Hero Card)*: The app remembers the absolute last chapter you read across all books and presents it beautifully in the Bookshelf banner to one-click jump back in.
  - Isolated *(Per-Book)*: Every single novel keeps track of its own distinct reading position. A "Lanjutkan" (Continue) badge tracks exactly the chapter and specific scroll Y-axis placement where you left off. 

### ✍️ For The Writer:
- **Distraction-free Editor**: An isolated typing canvas that dominates the screen. Equipped with a floating text-formatting toolbar that stays out of your way.
- **Auto-Save Infrastructure**: Forget `Ctrl + S`. Every pause in your keystrokes (debounced at roughly half-a-second) executes an asynchronous Next.js Server Action to seamlessly push your rich-text progress to the local database securely.
- **Volume & Chapter Management**: Effortlessly group chapters inside Arcs/Volumes. Re-order, add, or delete chapters via native lightweight prompts resulting in zero context switching. 
- **Cover Image Library System**: Brand your fictional worlds! Paste a direct URL, or directly **upload local images/files**, which are securely parsed via Node.js natively into your static `/public/uploads` system and garbage-collected automatically when deleted or overridden.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Database Architecture**: [SQLite](https://sqlite.org/) via [LibSQL](https://turso.tech/libsql) local files (`local.db`), future-proofed for effortless migration to Turso (Cloud).
- **ORM Interface**: [Drizzle ORM](https://orm.drizzle.team/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation Ecosystem**: [Framer Motion](https://www.framer.com/motion/)
- **Iconography**: [Lucide React](https://lucide.dev/)

---

## 🖥️ Local Installation
Ensure you have [Bun](https://bun.sh/) (or Node/NPM) installed.

### 1. Clone & Install
```bash
git clone <repository-url>
cd novel
bun install
```

### 2. Database Preparation
We use Drizzle to sync our data blueprints to SQLite:
```bash
bunx drizzle-kit push
```

### 3. Run Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) and start writing your epic saga!

---

*“To write is human, to edit is divine, and to auto-save is simply good engineering.”*
