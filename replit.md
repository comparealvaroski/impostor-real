# Overview

Fútbol Impostor is a real-time multiplayer social deduction game inspired by Among Us, but with a football (soccer) theme. Players join rooms where they must identify the "impostors" who don't know information about randomly selected football players. The game features multiple rounds of role assignment, discussion, and voting phases, with real-time communication through WebSockets.

The application is built as a full-stack TypeScript application with a React frontend and Express.js backend, designed for mobile-first gameplay with a focus on Spanish-speaking users.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server. The application follows a component-based architecture with:

- **Routing**: Client-side routing implemented with Wouter (lightweight React router)
- **State Management**: React Query (TanStack Query) for server state management and caching, with local component state for UI interactions
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **Real-time Communication**: Custom WebSocket hook (`useWebSocket`) for bidirectional communication with the server
- **Mobile-First Design**: Responsive design optimized for mobile devices with touch interactions

The frontend is organized into logical modules:
- `/pages` - Route components for different game states (home, lobby, game, stats)
- `/components` - Reusable UI components, including game-specific components for voting and role assignment
- `/hooks` - Custom React hooks for WebSocket communication and device detection
- `/lib` - Utilities for game logic, API communication, and data formatting

## Backend Architecture

**Framework**: Express.js with TypeScript, running on Node.js with hybrid WebSocket/HTTP architecture:

- **HTTP API**: Traditional REST endpoints for non-real-time operations (stats, player data)
- **WebSocket Server**: Real-time game state synchronization, player actions, and live updates
- **Storage Layer**: Pluggable storage interface with in-memory implementation (MemStorage) supporting future database integration
- **Game Logic**: Server-side game state management ensuring fair play and preventing cheating

The backend uses a message-based architecture for WebSocket communication, handling:
- Room creation and joining
- Role assignment (impostor/innocent)
- Real-time voting
- Game state transitions
- Player disconnection handling

## Data Storage Solutions

**Current Implementation**: In-memory storage (MemStorage class) for development and testing
**Future Ready**: Database-agnostic storage interface supporting PostgreSQL integration

**Database Schema** (prepared for PostgreSQL via Drizzle):
- `players` - User sessions and identity
- `rooms` - Game room configuration and state
- `room_players` - Player participation in rooms with roles
- `votes` - Voting history for game rounds
- `game_stats` - Player performance statistics

The storage layer abstracts database operations through a clean interface, making it easy to switch from in-memory to persistent storage.

## Authentication and Authorization

**Session Management**: Simple session-based authentication using generated session IDs stored in localStorage
**Player Identity**: Players are identified by session tokens, allowing reconnection after disconnects
**Room Access**: Room codes provide access control for private games

The current authentication is designed for casual gameplay without requiring account creation, while being extensible for future user account systems.

# External Dependencies

## Frontend Dependencies
- **@tanstack/react-query** - Server state management and caching
- **wouter** - Lightweight client-side routing
- **@radix-ui/react-*** - Accessible headless UI components (modals, dropdowns, form controls)
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant styling
- **embla-carousel-react** - Touch-friendly carousels for mobile

## Backend Dependencies
- **ws** - WebSocket server implementation
- **drizzle-orm** - Type-safe database ORM with PostgreSQL support
- **@neondatabase/serverless** - Serverless PostgreSQL driver for production deployment
- **connect-pg-simple** - PostgreSQL session store for Express sessions

## Development Tools
- **vite** - Fast build tool and development server
- **tsx** - TypeScript execution for development
- **esbuild** - Fast bundling for production builds
- **@replit/vite-plugin-cartographer** - Replit-specific development enhancements

## Database Integration
- **drizzle-kit** - Database migration and schema management tool
- **PostgreSQL** - Production database (configured for Neon serverless)
- **Drizzle-Zod** - Runtime schema validation

The application is configured for seamless deployment on Replit with automatic environment detection and includes fallback development tools for local development.