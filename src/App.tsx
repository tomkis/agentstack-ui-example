import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendMessage } from '@/services/agent';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
      data-testid={`chat-bubble-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const agentMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: agentMessageId, role: 'agent', content: '' },
    ]);

    try {
      for await (const event of sendMessage(userMessage.content)) {
        if (event.type === 'text') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMessageId ? { ...m, content: event.text } : m
            )
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessageId
            ? { ...m, content: `Error: ${errorMessage}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-semibold">AgentStack Chat</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="border-t p-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            data-testid="chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading}
            data-testid="send-button"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default App;
