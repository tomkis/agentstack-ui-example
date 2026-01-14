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

## AgentStack SDK Reference

### Packages

- `agentstack-sdk` - TypeScript SDK for AgentStack platform API and A2A extensions
- `@a2a-js/sdk` - A2A protocol client for sending messages to agents

### Core SDK Functions

#### API Client (`buildApiClient`)

```ts
import { buildApiClient } from 'agentstack-sdk';

const api = buildApiClient({ baseUrl: 'http://localhost:8334' });

// Create context for agent workspace
const context = await api.createContext(providerId);

// Create token with permissions
const { token, contextId } = await api.createContextToken({
  contextId: context.id,
  globalPermissions: { llm: ['*'], a2a_proxy: ['*'] },
  contextPermissions: { files: ['*'], vector_stores: ['*'] },
});

// Match LLM providers
const providers = await api.matchProviders({
  suggestedModels: ['model-name'],
  capability: 'llm',
  scoreCutoff: 0.4,
});
```

#### Agent Card Handling (`handleAgentCard`)

```ts
import { handleAgentCard } from 'agentstack-sdk';

const { resolveMetadata, demands } = handleAgentCard(agentCard);
const metadata = await resolveMetadata(fulfillments);
```

#### LLM Extension Resolver

```ts
import { buildLLMExtensionFulfillmentResolver } from 'agentstack-sdk';

const llmResolver = buildLLMExtensionFulfillmentResolver(api, token);
// Use in fulfillments.llm
```

### A2A Client Usage

```ts
import { ClientFactory } from '@a2a-js/sdk';

const factory = new ClientFactory();
const client = await factory.createFromUrl(
  'http://localhost:8334/api/v1/a2a/AGENT_ID'
);

// Send message
const response = await client.sendMessage({
  message: {
    messageId: uuidv4(),
    role: 'user',
    parts: [{ kind: 'text', text: 'Hello' }],
    kind: 'message',
  },
});

// Streaming
const stream = client.sendMessageStream(params);
for await (const event of stream) {
  if (event.kind === 'status-update') console.log(event.status.state);
  if (event.kind === 'artifact-update') console.log(event.artifact);
}
```

### Extension Pattern

Agents declare demands via agent card extensions. Client fulfills demands using dependency injection:

1. Fetch agent card from `/.well-known/agent-card.json`
2. Call `handleAgentCard(agentCard)` to extract demands
3. Build fulfillments (use `buildLLMExtensionFulfillmentResolver` for LLM)
4. Call `resolveMetadata(fulfillments)` to get metadata for requests

### Context Token

Token grants permissions for LLM access, file ops, A2A proxy. Pass token via authenticated fetch or message metadata.
