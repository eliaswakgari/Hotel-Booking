import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const faqQuestions = [
  "Hi", "Hello", "How do I book a room?", "What payment methods do you accept?",
  "Can I cancel my booking?", "Do you offer discounts?", "What amenities are included?",
  "Is breakfast included?", "Do you allow pets?", "What are the check-in/check-out times?",
  "Do you have parking?", "Is there Wi-Fi available?", "Can I change my booking?",
  "Do you offer airport pickup?", "Are children allowed?", "What is your refund policy?",
  "Are the rooms accessible?", "Do you have a pool?", "Are pets allowed?",
  "Can I get a late checkout?", "Do you have a gym?", "Do you provide toiletries?",
  "Is there a restaurant?", "Can I request a specific room?", "Do you offer group discounts?",
  "Is room service available?", "Do you have a loyalty program?"
];

const faqResponses = {
  "hi": "Hello! How can I assist you with your hotel booking today?",
  "hello": "Hi there! What can I help you with regarding your stay at Grands Hotel?",
  "how do i book a room?": `Sure! Here's how you can book a room at our hotel:

1. First, log in to the hotel booking page. If you don't have an account yet, sign up for a new account.
2. Once logged in, browse through our available rooms. You can scroll down or select the room type that suits you.
3. Click on the hotel card or room to see detailed information, including amenities, images, and pricing.
4. When you find a room you like, click the "Book" button.
5. Fill in the required booking details, such as check-in and check-out dates, number of guests, and any special requests.
6. Click "Confirm" to process your booking. Once confirmed, you'll receive a booking confirmation with your reservation details.
Enjoy your stay!`,
  "what is your refund policy?": `Here’s how you can request a refund:

1. Log in to your account on our hotel booking page.
2. Navigate to your bookings or reservation history.
3. Select the booking you want to cancel or request a refund for.
4. Click the "Cancel Booking" button.
5. Follow the prompts to confirm your cancellation. Depending on the booking policy, you may receive a partial or full refund.
6. After confirmation, your refund will be processed, and you will receive a notification once completed.
Please note that cancellations made less than 24 hours before check-in may not be eligible for a full refund.`,
  "what payment methods do you accept?": "We use Stripe for payments. You can pay with credit/debit cards or other Stripe-supported methods.",
  "can i cancel my booking?": "Yes, you can cancel your booking up to 24 hours before check-in. Partial and full refunds are supported.",
  "do you offer discounts?": "We sometimes offer seasonal promotions. Check our promotions page for current deals.",
  "what amenities are included?": "All bedrooms include free Wi-Fi, shower, clean towels, and access to our hotel facilities.",
  "is breakfast included?": "Breakfast is available at Grands Hotel. Check your booking package for details.",
  "do you allow pets?": "Pets are not allowed in our bedrooms.",
  "what are the check-in/check-out times?": "Check-in: 2 PM, Check-out: 12 PM.",
  "do you have parking?": "Yes, free parking is available for all guests.",
  "is there wi-fi available?": "Yes, free Wi-Fi is available in all rooms and hotel areas.",
  "can i change my booking?": "Yes, you can modify your booking up to 24 hours before check-in.",
  "do you offer airport pickup?": "Airport pickup is available on request.",
  "are children allowed?": "Yes, children are welcome.",
  "are the rooms accessible?": "Yes, we have accessible rooms. Contact us for details.",
  "do you have a pool?": "Yes, we have a pool for guest use.",
  "can i get a late checkout?": "Late checkout is possible on request, subject to availability.",
  "do you have a gym?": "Yes, guests can use our fitness center.",
  "do you provide toiletries?": "Yes, we provide basic toiletries in all rooms.",
  "is there a restaurant?": "Yes, Grands Hotel has an on-site restaurant.",
  "can i request a specific room?": "Yes, subject to availability.",
  "do you offer group discounts?": "Yes, contact us for details.",
  "is room service available?": "Room service is available during hotel operating hours.",
  "do you have a loyalty program?": "Currently, we do not have a loyalty program."
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const chatRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setShowChat(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendMessage = (msg) => {
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: msg }]);
    setInput("");

    const key = msg.toLowerCase().trim();
    if (faqResponses[key]) {
      typeBotMessage(faqResponses[key]);
    } else {
      typeBotMessage("For now, your question is not available, but it will be available in the future.");
    }
  };

  const typeBotMessage = (text) => {
    const botMsgId = Date.now();
    setMessages(prev => [...prev, { sender: "bot", text: "", id: botMsgId, typing: true }]);
    let i = 0;
    const interval = setInterval(() => {
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: text.slice(0, i+1) } : m));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, typing: false } : m));
      }
    }, 25);
  };

  const handleQuickQuestion = (question) => sendMessage(question);
  const displayedFaqs = showAllFaqs ? faqQuestions : faqQuestions.slice(0, 6);

  return (
    <>
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 z-50"
      >
        {showChat ? "×" : "Chat"}
      </button>

      {showChat && (
        <div
          ref={chatRef}
          className={`fixed bottom-6 right-6 h-[90vh] rounded-xl shadow-xl flex flex-col z-50 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
          style={{ width: "65vw" }}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-lg flex justify-between items-center">
            Hotel Assistant
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {darkMode ? "Light" : "Dark"}
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3" style={{ overflow: "hidden" }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "ml-auto justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 mr-2 flex items-center justify-center text-white font-bold">
                    B
                  </div>
                )}
                <div className={`break-words px-4 py-2 rounded-2xl shadow-md transition-all max-w-[90%] ${msg.sender === "user" ? "bg-blue-500 text-white text-right" : darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}>
                  {msg.text}
                  {msg.typing && <span className="animate-blink">|</span>}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex flex-wrap gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            {displayedFaqs.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q)}
                className={`text-xs px-3 py-1 rounded hover:underline ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                {q}
              </button>
            ))}
            {faqQuestions.length > 6 && (
              <button
                onClick={() => setShowAllFaqs(!showAllFaqs)}
                className={`text-xs px-3 py-1 rounded font-semibold ${darkMode ? "text-blue-400" : "text-blue-500"} hover:underline`}
              >
                {showAllFaqs ? "Show Less" : "Show More"}
              </button>
            )}
          </div>

          <div className="relative p-4 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              className={`w-full p-3 pr-20 rounded-full border focus:outline-none focus:ring-2 ${darkMode ? "border-gray-600 focus:ring-blue-400 bg-gray-900 text-white" : "border-gray-300 focus:ring-blue-400 bg-white text-black"}`}
            />
            <button
              onClick={() => sendMessage(input)}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 shadow-md"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          .animate-blink {
            animation: blink 1s step-start infinite;
          }
          @keyframes blink {
            50% { opacity: 0; }
          }
        `}
      </style>
    </>
  );
};

export default Chatbot;
