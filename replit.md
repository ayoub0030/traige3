# Overview

MIRAGE is a 3D trivia game built with React Three Fiber that combines immersive 3D environments with AI-generated questions. The application features a modern web interface with 3D graphics, multi-language support (English and Arabic), and integrates with OpenAI's GPT-5 for dynamic question generation. Players can enjoy single-player experiences or multiplayer matches while navigating through visually rich 3D scenes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built as a Single Page Application (SPA) using React with TypeScript and Vite as the build tool. The application leverages React Three Fiber for 3D rendering, creating an immersive gaming experience with floating geometric shapes, particle systems, and interactive 3D environments. The UI layer uses Radix UI components with Tailwind CSS for consistent styling and responsive design.

**Key Design Decisions:**
- **3D-First Approach**: Uses React Three Fiber as the primary rendering engine, allowing for complex 3D scenes and animations
- **Component-Based UI**: Separates 2D UI elements from 3D scenes, overlaying game interface elements on top of the Canvas
- **Responsive Design**: Implements mobile-first design principles with adaptive layouts for different screen sizes

## State Management
The application uses Zustand for state management, organizing state into focused stores:
- **useTriviaGame**: Manages game logic, questions, scoring, and game phases
- **useLanguage**: Handles internationalization between English and Arabic
- **useAudio**: Controls sound effects and background music
- **useGame**: Manages overall game phases (ready, playing, ended)

**Rationale**: Zustand was chosen over Redux for its simplicity and TypeScript support, reducing boilerplate while maintaining type safety.

## Backend Architecture
The backend follows a RESTful Express.js architecture with TypeScript, implementing a modular route structure. The server handles API endpoints for trivia question generation, user management, and health checks.

**Key Components:**
- **Express Server**: Handles HTTP requests with comprehensive logging and error handling
- **Route Organization**: Separates concerns with dedicated route files for different features
- **Storage Layer**: Implements an abstraction layer (IStorage interface) with in-memory storage for development

## Data Layer
**Database**: Uses Drizzle ORM with PostgreSQL for type-safe database operations. The schema defines user entities with proper validation using Zod schemas.

**Storage Strategy**: Implements a storage interface pattern allowing for easy switching between storage backends (currently using MemStorage for development, with PostgreSQL ready for production).

## Authentication & Security
The application currently implements a basic user system with username/password authentication. Session management is handled through Express sessions with PostgreSQL session storage.

**Security Measures:**
- Input validation using Zod schemas
- Environment variable protection for sensitive data
- CORS configuration for cross-origin requests

## AI Integration
**OpenAI Integration**: Uses GPT-5 for dynamic trivia question generation with structured prompts to ensure consistent question formats and quality.

**Implementation**: 
- Server-side generation to protect API keys
- Structured prompts with specific formatting requirements
- Category and difficulty-based question generation
- Support for multiple languages in question generation

# External Dependencies

## Core Technologies
- **React Three Fiber**: 3D rendering and scene management in React
- **@react-three/drei**: Helper components and utilities for Three.js
- **@react-three/postprocessing**: Post-processing effects for enhanced visuals
- **Express.js**: Web server framework for API endpoints
- **TypeScript**: Type safety across frontend and backend

## Database & ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **connect-pg-simple**: PostgreSQL session store for Express

## UI Framework
- **Radix UI**: Accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool and development server
- **TSX**: TypeScript execution for server development
- **ESBuild**: Fast JavaScript bundler for production builds

## AI & External APIs
- **OpenAI**: GPT-5 integration for question generation
- **Zustand**: Lightweight state management
- **React Query (@tanstack/react-query)**: Server state management and caching

## Audio & Media
- **GLSL Shader Support**: Custom shader support for advanced visual effects
- **Audio API**: Web Audio API integration for sound effects and background music

## Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class management
- **zod**: Runtime type validation and schema definition