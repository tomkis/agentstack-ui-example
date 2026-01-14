import {
  buildApiClient,
  handleAgentCard,
  buildLLMExtensionFulfillmentResolver,
  type Fulfillments,
} from 'agentstack-sdk';
import { ClientFactory, type Client } from '@a2a-js/sdk/client';
import type { Message, TaskArtifactUpdateEvent } from '@a2a-js/sdk';

const CHAT_AGENT_ID = '2158c059-e10a-4c85-aece-a33c15e52fd6';

function getApiBaseUrl(): string {
  return `${window.location.origin}/api`;
}

interface AgentSetup {
  client: Client;
  metadata: Record<string, unknown>;
}

let agentSetup: AgentSetup | null = null;

export async function initializeAgent(): Promise<AgentSetup> {
  if (agentSetup) return agentSetup;

  const apiBaseUrl = getApiBaseUrl();
  const api = buildApiClient({ baseUrl: apiBaseUrl });

  const agentUrl = `${apiBaseUrl}/v1/a2a/${CHAT_AGENT_ID}`;

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
  };

  if (demands.llmDemands) {
    fulfillments.llm = buildLLMExtensionFulfillmentResolver(api, token);
  }

  const metadata = await resolveMetadata(fulfillments as Fulfillments);

  agentSetup = { client, metadata };
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

export async function* sendMessage(
  content: string
): AsyncGenerator<{ type: 'text'; text: string } | { type: 'done' }> {
  const { client, metadata } = await initializeAgent();

  const message: Message = {
    messageId: crypto.randomUUID(),
    role: 'user',
    parts: [{ kind: 'text', text: content }],
    kind: 'message',
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
  }

  yield { type: 'done' };
}
