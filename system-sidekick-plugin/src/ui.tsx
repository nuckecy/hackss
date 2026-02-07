import { h, render, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { emit, on } from "@create-figma-plugin/utilities";
import "!./styles/ui.css";

const BACKEND_URL = "http://localhost:3000";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: ComponentAction | null;
}

interface ComponentAction {
  type: "place_component";
  componentName: string;
  componentKey: string;
  variant: string | null;
}

interface SelectionContext {
  nodeName: string | null;
  nodeType: string | null;
  width: number | null;
  height: number | null;
}

interface PlacementResult {
  success: boolean;
  message: string;
  componentName?: string;
}

const SUGGESTION_CHIPS = [
  "What button should I use for a destructive action?",
  "How should I show a notification?",
  "When should I use a dialog vs notification?",
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectionContext, setSelectionContext] =
    useState<SelectionContext | null>(null);
  const [placingComponent, setPlacingComponent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Listen for events from the Figma sandbox
  useEffect(() => {
    on("SELECTION_CONTEXT", (context: SelectionContext) => {
      setSelectionContext(
        context.nodeName ? context : null
      );
    });

    on("PLACEMENT_RESULT", (result: PlacementResult) => {
      setPlacingComponent(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.success
            ? `${result.message}`
            : `Placement failed: ${result.message}`,
        },
      ]);
    });
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Resize textarea back to single line
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      // Build history from existing messages (exclude actions)
      const history = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const body: any = {
        message: text.trim(),
        history: history.slice(0, -1), // History is prior messages, not including current
      };

      // Include Figma selection context if available
      if (selectionContext) {
        body.context = selectionContext;
      }

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        action: data.action || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't connect to the backend. Make sure the API server is running on ${BACKEND_URL}.\n\nError: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePlaceComponent(action: ComponentAction) {
    setPlacingComponent(action.componentName);
    emit("PLACE_COMPONENT", {
      componentKey: action.componentKey,
      componentName: action.componentName,
      variant: action.variant,
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    setInput(target.value);
    // Auto-resize
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 120) + "px";
  }

  const isEmpty = messages.length === 0;

  return (
    <div class="app">
      {/* Header */}
      <header class="header">
        <div class="header-title">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="20" height="20" rx="4" fill="#0066FF" />
            <path
              d="M6 10L9 13L14 7"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>System Sidekick</span>
        </div>
        {selectionContext && (
          <div class="context-badge" title={`${selectionContext.nodeName} (${selectionContext.nodeType}) — ${selectionContext.width}×${selectionContext.height}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            <span class="context-badge-text">{selectionContext.nodeName}</span>
          </div>
        )}
      </header>

      {/* Messages area */}
      <div class="messages">
        {isEmpty && (
          <div class="empty-state">
            <div class="empty-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="4"
                  y="4"
                  width="40"
                  height="40"
                  rx="8"
                  fill="#F0F4FF"
                />
                <path
                  d="M16 24L22 30L32 18"
                  stroke="#0066FF"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h2 class="empty-title">What are you designing?</h2>
            <p class="empty-subtitle">
              I'll recommend the right SDS component and place it in your file.
            </p>
            <div class="suggestion-chips">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  class="chip"
                  onClick={() => sendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            class={`message ${msg.role === "user" ? "message-user" : "message-assistant"}`}
          >
            <div
              class={`bubble ${msg.role === "user" ? "bubble-user" : "bubble-assistant"}`}
            >
              <div class="bubble-content">{formatMessage(msg.content)}</div>
              {msg.action && (
                <button
                  class="place-button"
                  onClick={() => handlePlaceComponent(msg.action!)}
                  disabled={placingComponent !== null}
                >
                  {placingComponent === msg.action.componentName ? (
                    <Fragment>
                      <span class="spinner" /> Placing...
                    </Fragment>
                  ) : (
                    <Fragment>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M7 1V13M1 7H13"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                      Place in Figma
                    </Fragment>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div class="message message-assistant">
            <div class="bubble bubble-assistant">
              <div class="loading-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            ref={inputRef}
            class="chat-input"
            placeholder="Describe what you're designing..."
            value={input}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            class="send-button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like formatting for bold text
function formatMessage(text: string): (string | h.JSX.Element)[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Handle line breaks
    if (part.includes("\n")) {
      return (
        <Fragment key={i}>
          {part.split("\n").map((line, j, arr) => (
            <Fragment key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </Fragment>
      );
    }
    return part;
  });
}

// Mount the app — @create-figma-plugin passes the container element
export default function (container: HTMLElement) {
  render(<App />, container);
}
