import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
      data-testid={`chat-bubble-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', content: 'Hello! How can I help you today?' }
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (!inputValue.trim()) return
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    }
    setMessages(prev => [...prev, newMessage])
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-semibold">AgentStack Chat</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map(message => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      </main>
      <footer className="border-t p-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="chat-input"
          />
          <Button onClick={handleSend} data-testid="send-button">
            Send
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default App
