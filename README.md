# Technewity Labs — Enterprise CRM & Chat-Driven Project Management System

**Technewity Labs CRM** is an enterprise-grade, high-performance workspace platform built for modern development teams, agencies, and fast-growing organizations. It seamlessly merges **WhatsApp-style conversational CRM**, **AI-driven command automation**, **Kanban & structured list tracking**, **team collaboration**, **automated project reporting**, and **real-time video meetings** into a unified, mobile-first workspace.

Official Website: [https://technewity.com](https://technewity.com)

---

## ✨ Features Overview

### 💬 Conversational Chat CRM (WhatsApp-Style Interface)
- **Mobile-First Default Flow**: When accessing any organization on mobile devices, the mobile-friendly **Chat CRM opens as the primary default view**.
- **1-Tap View Switcher**: Instant mobile navigation from Chat CRM to **Kanban Board**, **Task List Table**, **My Works**, **Dashboard**, **AI Agent Hub**, and **Project Switcher**.
- **Dual-Pane Desktop Layout**: Left pane displays contact projects with real-time unread/TODO badge counters; right pane hosts the full-screen interactive project chat.
- **Embedded Chat Drawer**: Accessible from within any project view (Kanban Board, List, Calendar, Timeline) via the top-right header button without leaving the active view.

### 🤖 AI Bot Command Orchestrator
Integrated with Google Gemini AI (`gemini-2.5-flash`) and BullMQ queue processing for instant conversational task and CRM management:
- **`/task @bot <instructions> [lead: @Name] [#tags] [priority: high|normal|low|urgent] [points: N] [due: date]`**: Parses structured tasks with automatic checklist generation, lead assignment, and project tag resolution.
- **`/bug @bot <description> [priority: urgent] [lead: @Name]`**: Automatically logs defects with priority classification and assigns lead engineers.
- **`/feature @bot <requirements> [lead: @Name]`**: Logs feature requests, creates dynamic project tags, and assigns owners.
- **`/improvement @bot <enhancements>`**: Captures technical optimizations and system enhancements.
- **`/report @bot [weekly|monthly] [email to user@example.com]`**: Computes project completion metrics, member performance breakdowns, and optionally emails formatted reports.
- **`/schedule @bot <action> every <day|weekday|hour> at <time>`**: Creates persistent cron scheduler rules in MongoDB and triggers automated notification actions.
- **`/email @bot Send <message> to <email|@Name> with subject: <subject>`**: Drafts and dispatches emails via Resend with delivery logging and security auditing.
- **`@bot <question>`**: General contextual AI assistant answering workspace queries.

### 📋 Project & Workspace Management
- **Kanban Board View**: Drag-and-drop task boards with custom status columns and real-time synchronization.
- **List & Grid Views**: Structured table views with inline editing and customizable field columns.
- **Calendar & Timeline Views**: Visual roadmap planning across days, weeks, and months.
- **Multi-Tenant Organizations**: Granular permissions (Admin, Manager, Member, Guest), invitations, and multi-org switching.
- **Personalized Workspaces**: Dedicated "My Works" task aggregation and organization activity dashboards.

### ⚡ Real-Time Engine & Event Architecture
- **Pusher Channels**: Real-time broadcast for chat messages, task creation, status column transitions, and board updates without page reloads.
- **Upstash Redis Pub/Sub**: Inter-service event messaging for scheduler executions, cache invalidation, and background workers.
- **LiveKit Video Meetings**: Built-in online room collaboration and video meetings.
- **Resend Email Delivery**: Transactional email notifications for task assignments, weekly reports, and direct dispatch.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js (App Router), React 18, TailwindCSS, Framer Motion, Radix UI, TipTap Editor.
- **Backend API**: Node.js, Express, BullMQ, Prisma ORM (v5.2.0).
- **Database**: MongoDB Atlas (Cloud) / MongoDB Replica Set.
- **Cache & Queue**: Upstash Redis (TLS) / Redis Server.
- **AI Engine**: Google Gemini API (`@google/generative-ai`).
- **Real-Time Push**: Pusher Channels.
- **Email Service**: Resend API.
- **Video Collaboration**: LiveKit Cloud.
- **Authentication**: Firebase Authentication (Google OAuth) + JWT Refresh Tokens.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v22.x
- **Yarn**: `npm install -g yarn`

### 2. Installation
```bash
# Clone the repository
$ git clone https://github.com/Vpandey-tech/CRM-Technewity.git
$ cd "CRM TECHNEWITY"

# Install all workspace dependencies
$ yarn install

# Generate Prisma Client
$ yarn generate2

# Synchronize Database Collections & Indexes
$ yarn pushdb2

# Seed Default Database Data
$ yarn seed2
```

### 3. Running Local Development
```bash
# Start Backend API (Port 3333)
$ yarn backend

# Start Next.js Frontend (Port 4200)
$ yarn frontend
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 🧪 Testing & Automated Regression Suite

The project includes an end-to-end regression test suite verifying all AI commands, database operations, notifications, and email deliveries:

```bash
# Execute Full CRM Command & Notification Regression Suite
$ node scripts/regression_test_crm.js

# Test Resend Email Dispatch
$ node scripts/test_email.js
```

### Verified Test Cases:
- `[CMD-1] /task`: Lead assignment, checklist extraction, tag linking, and priority assignment.
- `[CMD-2] /bug`: Urgent defect creation and assignee notification.
- `[CMD-3] /feature`: Feature creation with dynamic project tag creation (`#voice #ai`).
- `[CMD-4] /improvement`: System optimization tracking.
- `[CMD-5] /report`: Project progress metric computation and email delivery.
- `[CMD-6] /schedule`: Cron-based automated report scheduler configuration.
- `[CMD-7] /email`: Outbound transactional email dispatch via Resend.
- `[CMD-8] @bot`: Conversational AI query processing.

---

## ⚙️ Environment Configuration (`.env`)

```env
# Application Settings
DEV_MODE=0
NEXT_PUBLIC_APP_NAME=Technewity Labs
NEXT_PUBLIC_FE_GATEWAY=http://localhost:4200/
NEXT_PUBLIC_BE_GATEWAY=http://localhost:3333/
NEXT_PUBLIC_DISABLE_REGISTRATION=0

# Database & Cache
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/technewity?retryWrites=true&w=majority
REDIS_HOST=rediss://<user>:<pass>@shining-anchovy-172866.upstash.io:6379

# Authentication Secrets
JWT_SECRET_KEY=your_secure_jwt_secret_key_here
JWT_REFRESH_KEY=your_secure_jwt_refresh_key_here
JWT_TOKEN_EXPIRED=30m
JWT_REFRESH_EXPIRED=4h

# Pusher Channels
NEXT_PUBLIC_PUSHER_CHANNEL_APP_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CHANNEL_APP_CLUSTER=ap2
PUSHER_CHANNEL_APP_ID=your_app_id
PUSHER_CHANNEL_SECRET=your_pusher_secret

# AI & Bot Orchestrator
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key
BOT_RATE_LIMIT_PER_USER_PER_DAY=50

# Resend Email Delivery
RESEND_TOKEN=re_your_resend_token
RESEND_EMAIL_DOMAIN=technewity.com
RESEND_EMAIL_FROM=noreply@technewity.com
RESEND_EMAIL_NAME=Technewity Labs

# LiveKit Video Collaboration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
```

---

## 📄 License & Credits

Maintained and developed by **Technewity Labs**.  
Website: [https://technewity.com](https://technewity.com)  
Contact: [contact@technewity.com](mailto:contact@technewity.com)
