# Kgotla - Discussion Forum App

## Overview

Kgotla is a modern, cross-platform discussion forum application designed for Southern African communities. It's built as a full-stack web application with a mobile-first approach, combining traditional cultural values with modern social media features. The app serves as a "traditional meeting place for modern voices" where users can engage in discussions, share wisdom, and build community connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Framework**: Tailwind CSS with shadcn/ui components for modern, accessible design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices with PWA capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express session with PostgreSQL session store
- **Real-time Features**: WebSocket support for live updates and notifications

### Database Design
The application uses PostgreSQL with the following key entities:
- Users (Replit Auth integration)
- Posts (with support for text, images, polls, and questions)
- Comments (with nested replies)
- Votes (upvotes/downvotes for posts and comments)
- Groups/Tribes (community organization)
- Notifications (real-time user alerts)
- Bookmarks (saved content)

## Key Components

### Authentication System
- **Integration**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with automatic cleanup
- **User Profiles**: Rich profile system with reputation, verification badges, and cultural elements

### Content Management
- **Post Types**: Support for text posts, images, polls, and questions
- **Voting System**: Reddit-style upvote/downvote mechanism
- **Comment System**: Nested comments with threading support
- **Tagging**: Content categorization with predefined and custom tags

### Real-time Features
- **WebSocket Integration**: Live updates for new posts, comments, and votes
- **Notifications**: Real-time alerts for user interactions
- **Live Discussions**: Instant comment updates and reactions

### Mobile Experience
- **PWA Support**: Progressive Web App with offline capabilities
- **Bottom Navigation**: Mobile-optimized navigation pattern
- **Responsive Design**: Adaptive layout for different screen sizes
- **Touch-Friendly**: Optimized for mobile interactions

## Data Flow

1. **User Authentication**: Replit Auth → Session Creation → User Profile Sync
2. **Content Creation**: Form Submission → Validation → Database Storage → Real-time Broadcast
3. **Content Consumption**: Database Query → React Query Cache → Component Rendering
4. **Real-time Updates**: WebSocket Connection → Event Broadcasting → UI Updates
5. **Voting/Interactions**: User Action → Database Update → Cache Invalidation → UI Refresh

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation utilities

### Authentication
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: PostgreSQL with Drizzle migrations
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS

### Production Deployment
- **Build Process**: Vite build for frontend, esbuild for backend
- **Static Assets**: Served from dist/public directory
- **Database**: PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed sessions
- **WebSocket**: Integrated with HTTP server

### Key Features for Deployment
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Optimized queries and caching strategies
- **Security**: Session-based authentication with secure cookies
- **Scalability**: Connection pooling and efficient database queries
- **Monitoring**: Built-in request logging and error tracking