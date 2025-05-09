// src/components/Chatbot.jsx
import { useState, useEffect, useRef } from 'react';
import { BsChatDotsFill } from 'react-icons/bs';
import { IoClose, IoSend } from "react-icons/io5";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today with AI, Cloud, or Kubernetes?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const getBotResponse = (message) => {
    setIsBotTyping(true);
    const lowerCaseMessage = message.toLowerCase();
    let reply = "Sorry, I didn't understand that. Can you rephrase or ask something else about AI or Cloud?";

    if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
      reply = "Hi there! How can I assist you with AI or Cloud today?";
    } else if (lowerCaseMessage.includes("kubernetes") || lowerCaseMessage.includes("k8s")) {
      reply = "Kubernetes is an open-source container orchestration system. Would you like to see articles about it?";
    } else if (lowerCaseMessage.includes("ai") || lowerCaseMessage.includes("artificial intelligence")) {
      reply = "AI is a broad field! Are you interested in Machine Learning, Deep Learning, or specific applications?";
    } else if (lowerCaseMessage.includes("cloud") || lowerCaseMessage.includes("aws") || lowerCaseMessage.includes("azure") || lowerCaseMessage.includes("gcp")) {
       reply = "Cloud computing offers many services. Which provider or service are you interested in? We have articles on AWS, Azure, and more.";
    } else if (lowerCaseMessage.includes("thank")) {
       reply = "You're welcome! Let me know if you have more questions.";
    } else if (lowerCaseMessage.includes("post") && lowerCaseMessage.includes("create")) {
        reply = "Currently, only administrators can create posts on KubeCloudAI.";
    }

    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: reply }]);
      setIsBotTyping(false);
    }, 1000 + Math.random() * 800);
  };

  const handleSendMessage = async (e) => { 
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isBotTyping) return;
  
  
    const userMessage = { sender: 'user', text: trimmedInput };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    setIsBotTyping(true); 
  
    try {
    
      const res = await fetch('/api/chat', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedInput }), 
      });
  
      if (!res.ok) {
  
        const errorData = await res.json();
        throw new Error(errorData.message || 'Server error');
      }
  
      const data = await res.json();
      const botReply = data.reply; 
 
      setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: botReply }]);
  
    } catch (error) {
      console.error("Error communicating with chatbot backend:", error);
      setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsBotTyping(false); 
    }
  };
  

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end">
  
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ease-in-out mb-3
          ${isOpen ? 'opacity-100 translate-y-0 w-[90vw] h-[75vh] max-w-md md:w-96 md:h-[500px]' : 'opacity-0 translate-y-10 w-0 h-0 pointer-events-none'}
        `}
      >
   
        <div className="bg-gradient-to-r from-blue-500 to-teal-400 text-white p-4 flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-lg">KubeCloudAI Assistant</h3>
          <button onClick={toggleChat} className="text-white hover:text-gray-200 transition-colors">
            <IoClose size={26} />
          </button>
        </div>

    
        <div className="flex-1 p-4 overflow-y-auto text-sm space-y-3">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
              <p className={`p-3 rounded-lg max-w-[80%] ${
                msg.sender === 'bot'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  : 'bg-blue-500 text-white rounded-br-none'
              }`}>
                {msg.text}
              </p>
            </div>
          ))}
          {isBotTyping && (
            <div className="flex justify-start">
               <p className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg rounded-bl-none max-w-[80%] italic text-gray-500 dark:text-gray-400">
                  Typing...
               </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>


        <form onSubmit={handleSendMessage} className="p-3 border-t dark:border-gray-700 flex gap-2 items-center bg-gray-50 dark:bg-gray-700">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 dark:placeholder-gray-400"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isBotTyping}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-full p-2.5 hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            disabled={!userInput.trim() || isBotTyping}
            aria-label="Send Message"
          >
             <IoSend size={18} />
          </button>
        </form>
      </div>


      <button
        onClick={toggleChat}
        className={`
          bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-full p-4 shadow-xl
          hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all duration-300 ease-in-out transform
          ${isOpen ? 'rotate-90 scale-90 opacity-75' : 'hover:scale-110'}
        `}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? <IoClose size={28} /> : <BsChatDotsFill size={26} />}
      </button>
    </div>
  );
}