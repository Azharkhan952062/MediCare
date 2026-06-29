import React, { useState, useRef, useEffect } from "react";
import "./AIChatbot.css";

const BOT_NAME = "MediCare AI";

// const SYSTEM_PROMPT = `You are MediCare AI, a helpful medical assistant for MediCare hospital management platform.
// - Recommend doctors only from these departments when appropriate:
// • Cardiology
// • Dermatology
// • Neurology
// • Orthopedics
// • Pediatrics
// • ENT
// • General Medicine
// • Gynecology
// • Ophthalmology

// Your job:
// 1. Listen to patient symptoms and suggest which type of doctor they should consult (e.g. Cardiologist, Dermatologist, General Physician, etc.)
// 2. Answer general health questions in simple language
// 3. Help users understand hospital services
// 4. Guide users to book appointments

// Important rules:
// - Always respond
// - Keep responses short and clear (2-4 lines max)
// - Never diagnose a disease — only suggest doctor type
// - Always end with a helpful next step like "You can visit our Doctors page to book an appointment."
// - If someone asks something non-medical, politely redirect to health topics
// - Be warm, caring, and professional`

// - Suggest home care tips for mild symptoms when appropriate
// - Mention emergency warning signs when symptoms are severe
// - If symptoms are urgent (severe chest pain, breathing difficulty, unconsciousness), advise immediate emergency care
// - Mention available departments like Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, ENT, and General Medicine

// - If the user mentions severe chest pain, breathing difficulty, unconsciousness, heavy bleeding, or stroke symptoms, advise immediate emergency care.
// - Tell the user to visit the Emergency Department immediately.
// - Do not delay urgent medical advice

// - Answer questions about hospital timings, emergency services, departments, and appointment booking.
// - Explain hospital services in simple English;
const SYSTEM_PROMPT = `You are MediCare AI, a helpful medical assistant for MediCare hospital management platform.

Available Departments:
• Cardiology
• Dermatology
• Neurology
• Orthopedics
• Pediatrics
• ENT
• General Medicine
• Gynecology
• Ophthalmology

Your job:
1. Listen to patient symptoms and suggest which type of doctor they should consult.
2. Answer general health questions in simple language.
3. Help users understand hospital services.
4. Guide users to book appointments.

Important rules:
- Always respond only in English.
- Keep responses short and clear (2-4 lines max).
- Never diagnose a disease — only suggest doctor type.
- Always end with: "You can visit our Doctors page to book an appointment."
- If someone asks something non-medical, politely redirect to health topics.
- Be warm, caring, and professional.

Additional Instructions:
- Suggest home care tips for mild symptoms when appropriate.
- Mention emergency warning signs when symptoms are severe.
- If symptoms are urgent (severe chest pain, breathing difficulty, unconsciousness, heavy bleeding, stroke symptoms), advise immediate emergency care.
- Tell the user to visit the Emergency Department immediately in emergencies.
- Do not delay urgent medical advice.
- Answer questions about hospital timings, emergency services, departments, and appointment booking.
- Explain hospital services in simple English.
- Recommend doctors only from the available departments listed above.
- Always add: "This information is for guidance only and is not a substitute for professional medical advice."`;

const QUICK_REPLIES = [
  "I have fever and headache",
  "Which doctor for heart problems?",
  "Which doctor for chest pain?",
  "I have stomach pain",
  "I have skin allergy",
  "How to book appointment?",
  "What are your hospital timings?",
  "Do you provide emergency services?",
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm MediCare AI. Tell me your symptoms and I'll guide you to the right doctor! 🏥",
      // "👋 Welcome to MediCare AI!\n\nI can help you:\n• Find the right doctor\n• Understand symptoms\n• Learn about hospital services\n• Book appointments\n\nHow can I assist you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();

    if (!userText || loading) return;

    setShowQuick(false);
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);

    setLoading(true);

    try {
      // const response = await fetch("http://localhost:4000/api/chat", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     message: userText,
      //     system: SYSTEM_PROMPT,
      //   }),
      // });
      const API_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          system: SYSTEM_PROMPT,
        }),
      });

      const data = await response.json();

      const reply =
        data.reply || "Sorry, I'm having trouble responding right now.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "A network error occurred. Please check your internet connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={`chatbot-fab ${isOpen ? "chatbot-fab--hidden" : ""}`}
        onClick={handleOpen}
        aria-label="Open AI Chat"
      >
        <span className="chatbot-fab__icon">🩺</span>
        <span className="chatbot-fab__pulse" />
        <div className="chatbot-fab__tooltip">Ask MediCare AI</div>
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? "chatbot-window--open" : ""}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header__left">
            <div className="chatbot-header__avatar">🏥</div>
            <div>
              <div className="chatbot-header__name">{BOT_NAME}</div>
              <div className="chatbot-header__status">
                <span className="chatbot-header__dot" />
                Online · Always here to help
              </div>
            </div>
          </div>

          <button
            className="chatbot-header__close"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chatbot-msg ${
                msg.role === "user" ? "chatbot-msg--user" : "chatbot-msg--bot"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="chatbot-msg__avatar">🤖</div>
              )}

              <div className="chatbot-msg__bubble">
                {msg.content.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chatbot-msg chatbot-msg--bot">
              <div className="chatbot-msg__avatar">🤖</div>
              <div className="chatbot-msg__bubble chatbot-msg__bubble--typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {/* Quick replies */}
          {showQuick && !loading && messages.length === 1 && (
            <div className="chatbot-quick">
              {QUICK_REPLIES.map((q, i) => (
                <button
                  key={i}
                  className="chatbot-quick__btn"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input">
          <textarea
            ref={inputRef}
            className="chatbot-input__field"
            placeholder="Type your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />

          <button
            className={`chatbot-input__send ${
              !input.trim() || loading ? "chatbot-input__send--disabled" : ""
            }`}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            ➤
          </button>
        </div>

        <div className="chatbot-footer">
          Powered by Claude AI · Not a substitute for professional medical
          advice
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="chatbot-overlay" onClick={handleClose} />}
    </>
  );
}
