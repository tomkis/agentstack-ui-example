# Project Goal

The goal of this project is to demonstrate how to build custom GUI in TypeScript for agent built and exposed in [Agent Stack](https://agentstack.beeai.dev/llms.txt).

The project needs to demonstrate basic Chat capability of the agent (no extra extensions) with support of LLM through extension.

The running instance of the Agenstack is on local machine and Chat agent is available.

The idea is to demonstrate classical chat interface that would allow to chat with Chat agent, leverging the AgentStack TS SDK.


## Technical Constraints

- Front-end only application
- Using React with Vite to easy dev server
- UI should supply LLM extension resolved via default LLM extension resolver in the SDK
- UI should properly generate Context Token
- Figure out the ID of the Chat agent via agentstack API
- Vite should setup proxy to avoid CORS problem with the agent (agenstack is running on http://localhost:8334/api/v1/a2a/ID_OF_CHAT_AGENT)
- Minimalistic UI with chat bubbles, send message and working streaming mechanism


## Development rules

- always ensure the repo is fully functional by running `pnpm check` and `pnpm test`