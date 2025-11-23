import React from 'react';
import GuestLayout from '../layouts/GuestLayout';
import Chatbot from '../components/Chatbot';

const ChatbotPage = () => {
  return (
    <GuestLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Virtual Booking Assistant
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get instant help with your hotel bookings, questions about amenities, 
              payment methods, and more. Our AI assistant is here to help 24/7!
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: '🤖', title: 'AI-Powered Assistance', desc: 'Smart responses to all your booking questions and concerns' },
              { icon: '⚡', title: 'Instant Responses', desc: 'Get immediate answers without waiting for customer support' },
              { icon: '💬', title: '24/7 Availability', desc: 'Round-the-clock support whenever you need booking assistance' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Chatbot Container */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Chatbot />
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  question: "How accurate are the chatbot's responses?",
                  answer: "Our chatbot is trained on extensive hotel booking data and can accurately handle most common queries about bookings, payments, and policies."
                },
                {
                  question: "Can the chatbot make actual bookings?",
                  answer: "The chatbot provides guidance and information. For actual bookings, it will direct you to the booking process with step-by-step assistance."
                },
              ].map((faq, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
  <Chatbot />
</div>

        </div>
      </div>
    </GuestLayout>
  );
};

export default ChatbotPage;
