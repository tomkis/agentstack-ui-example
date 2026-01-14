import {
  buildApiClient,
  handleAgentCard,
  buildLLMExtensionFulfillmentResolver,
  type Fulfillments,
} from 'agentstack-sdk';
import { ClientFactory, type Client } from '@a2a-js/sdk/client';
import type {
  Message,
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
} from '@a2a-js/sdk';

const CHAT_AGENT_ID = '2158c059-e10a-4c85-aece-a33c15e52fd6';

function getApiBaseUrl(): string {
  return `${window.location.origin}`;
}

interface AgentSetup {
  client: Client;
  metadata: Record<string, unknown>;
  contextId: string;
}

let agentSetup: AgentSetup | null = null;

export async function initializeAgent(): Promise<AgentSetup> {
  if (agentSetup) return agentSetup;

  const apiBaseUrl = getApiBaseUrl();
  const api = buildApiClient({ baseUrl: apiBaseUrl });

  const agentUrl = `${apiBaseUrl}/api/v1/a2a/${CHAT_AGENT_ID}/agent-card.json`;

  const factory = new ClientFactory();
  const client = await factory.createFromUrl(agentUrl);
  const agentCard = await client.getAgentCard();

  const context = await api.createContext(CHAT_AGENT_ID);
  const { token } = await api.createContextToken({
    contextId: context.id,
    globalPermissions: { llm: ['*'], a2a_proxy: ['*'] },
    contextPermissions: { files: ['*'], vector_stores: ['*'] },
  });

  const { resolveMetadata, demands } = handleAgentCard(agentCard);

  const fulfillments: Partial<Fulfillments> = {
    getContextToken: () => token,
    oauthRedirectUri: () => null,
  };

  if (demands.llmDemands) {
    fulfillments.llm = buildLLMExtensionFulfillmentResolver(api, token);
  }

  const metadata = await resolveMetadata(fulfillments as Fulfillments);

  agentSetup = { client, metadata, contextId: context.id };
  return agentSetup;
}

function isArtifactUpdate(event: unknown): event is TaskArtifactUpdateEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'kind' in event &&
    (event as { kind: string }).kind === 'artifact-update'
  );
}

function isMessage(event: unknown): event is Message {
  return (
    typeof event === 'object' &&
    event !== null &&
    'kind' in event &&
    (event as { kind: string }).kind === 'message'
  );
}

function isStatusUpdate(event: unknown): event is TaskStatusUpdateEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'kind' in event &&
    (event as { kind: string }).kind === 'status-update'
  );
}

export async function* sendMessage(
  content: string
): AsyncGenerator<{ type: 'text'; text: string } | { type: 'done' }> {
  const { client, metadata, contextId } = await initializeAgent();

  const message: Message = {
    messageId: crypto.randomUUID(),
    role: 'user',
    parts: [{ kind: 'text', text: content }],
    kind: 'message',
    contextId,
    metadata,
  };

  const stream = client.sendMessageStream({ message });

  for await (const event of stream) {
    if (isArtifactUpdate(event) && event.artifact?.parts) {
      for (const part of event.artifact.parts) {
        if (part.kind === 'text') {
          yield { type: 'text', text: part.text };
        }
      }
    }
    if (isMessage(event) && event.parts) {
      for (const part of event.parts) {
        if (part.kind === 'text') {
          yield { type: 'text', text: part.text };
        }
      }
    }
    if (isStatusUpdate(event) && event.status?.message?.parts) {
      for (const part of event.status.message.parts) {
        if (part.kind === 'text') {
          yield { type: 'text', text: part.text };
        }
      }
    }
  }

  yield { type: 'done' };
}
