# Dread & Decay: Descent into the Abyss
*(Inspired by Fear & Hunger)*

**Dread & Decay** is a brutal, dark-fantasy dungeon crawler RPG featuring real-time multiplayer, procedural ambient audio, and an unforgiving survival system. Players must manage their hunger, fear, and torchlight while navigating a deadly labyrinth filled with traps, lore, and horrifying monstrosities.

## 🩸 Core Features
- **Real-Time Multiplayer Co-op**: Built on WebSockets, explore the dungeon seamlessly with other players. Watch them move, fight, and survive in real-time.
- **Unforgiving Survival Mechanics**: Manage your Hunger and Fear. If your torch burns out, the darkness will consume you.
- **Brutal Body-Part Combat System**: Target specific limbs on enemies to disarm, cripple, or instantly execute them—but beware, enemies can do the same to you.
- **Procedural Dark Ambient Audio**: The game dynamically generates cavernous, terrifying ambient music and visceral combat sound effects in your browser using the Web Audio API. 
- **Dynamic Visuals**: Features CRT scanline overlays, breathing enemy sprites, wobbling dynamic lighting, and punchy Clash Royale-inspired floating combat text.
- **Crafting & Alchemy**: Scavenge materials to craft life-saving bandages, explosive smoke bombs, and potent elixirs.

## 🛠️ Technology Stack
This game is built as a modern **Turborepo** monorepo containing:
- **Frontend (`apps/web`)**: React 18, Vite, and HTML5 Canvas API for raw, high-performance pixel-art rendering.
- **Backend (`apps/api`)**: Node.js, Fastify, and Socket.io for handling the real-time multiplayer states.
- **Database (`packages/db`)**: Drizzle ORM and PostgreSQL for persistent player stats, inventory, and progression.
- **Game Engine (`packages/game-core`)**: Shared TypeScript game logic to ensure the client and server simulate combat and movement identically.

---

## 🚀 Running the Game Locally

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Running locally)

### Setup Instructions
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in `apps/api` and add your local Postgres database connection string:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/fear_and_dark
   ```

3. **Initialize the Database:**
   Push the database schema so the game can save players:
   ```bash
   npm run db:push
   ```

4. **Start the Development Server:**
   Launch both the React frontend and the Node.js backend simultaneously:
   ```bash
   npm run dev
   ```

5. **Play the Game!**
   Open your browser and navigate to `http://localhost:5173`. Open a second tab to see the multiplayer in action!

---

## 📜 License
This project is licensed under the MIT License.
