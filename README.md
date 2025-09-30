# EchoNest AI Therapy

An AI-powered therapy chatbot built with Next.js, featuring advanced conversation capabilities, voice interaction, and comprehensive mental health support tools.

## Features

- 🧩 **Browser Automation** with Playwright MCP
- 🔗 **Visual Workflows** as Custom Tools
- 🤖 **Custom Agents** for specialized therapy approaches
- 🎙️ **Realtime Voice Assistant** + MCP Tools
- ⚡️ **Quick Tool Mentions** (`@`) & Presets
- 🧭 **Tool Choice Mode** for guided interactions
- 🛠️ **Default Tools** including web search, code execution, and data visualization

## Quick Start (Local Version) 🚀

```bash
# 1. Clone the repository
git clone <repository-url>
cd EchoNest-AI-Theraphy

# 2. Install dependencies
pnpm i

# 3. Set up PostgreSQL
# Make sure PostgreSQL is running locally on port 5434
# Update the PostgreSQL URL in your .env file if needed

# 4. Enter required information in the .env file
# The .env file is created automatically. Just fill in the required values.
# For the fastest setup, provide at least one LLM provider's API key (e.g., OPENAI_API_KEY, CLAUDE_API_KEY, GEMINI_API_KEY, etc.) and the PostgreSQL URL you want to use.

# 5. Run database migrations
pnpm db:migrate

# 6. Start the server
pnpm build:local && pnpm start
# (Recommended for most cases. Ensures correct cookie settings.)
# For development mode with hot-reloading and debugging, you can use:
# pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to get started.

## Environment Variables

```bash
# === Database ===
POSTGRES_URL=postgres://postgres:db_password@localhost:5434/echonest_ai_therapy_db

# === Authentication ===
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# === AI Providers ===
OPENAI_API_KEY=your-openai-api-key-here
CLAUDE_API_KEY=your-claude-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# === Optional Tools ===
EXA_API_KEY=your-exa-api-key-here
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open database studio
- `pnpm test` - Run tests
- `pnpm test:e2e` - Run end-to-end tests

## 📘 Guides

- [🔌 MCP Server Setup & Tool Testing](./docs/tips-guides/mcp-server-setup-and-tool-testing.md)
- [▲ Vercel Hosting Guide](./docs/tips-guides/vercel.md)
- [🎯 System Prompts & Chat Customization](./docs/tips-guides/system-prompts-and-customization.md)
- [🔐 OAuth Sign-In Setup](./docs/tips-guides/oauth.md)
- [🕵🏿 Adding OpenAI-like Providers](./docs/tips-guides/adding-openAI-like-providers.md)
- [🧪 E2E Testing Guide](./docs/tips-guides/e2e-testing-guide.md)

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes, Better Auth
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI, Anthropic Claude, Google Gemini
- **Testing**: Playwright, Vitest
- **Styling**: Tailwind CSS, shadcn/ui

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details
