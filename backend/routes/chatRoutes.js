const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
require("dotenv").config();

// Optional fallback FAQ responses
const faqResponses = {
  "how do i book a room?": "To book a room at Grands Hotel, select your desired dates, choose a bedroom, and proceed to checkout.",
  "what payment methods do you accept?": "We use Stripe for payments. You can pay with credit/debit cards or other Stripe-supported methods.",
  "can i cancel my booking?": "Yes, you can cancel your booking up to 24 hours before check-in. Partial and full refunds are supported.",
  "do you offer discounts?": "We sometimes offer seasonal promotions. Check our promotions page for current deals.",
  "what amenities are included?": "All bedrooms include free Wi-Fi, shower, clean towels, and access to our hotel facilities."
  // Add more FAQs as needed
};

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ reply: "Please type a message." });

  const key = message.toLowerCase().trim();

  // Return FAQ response if exists
  if (faqResponses[key]) return res.json({ reply: faqResponses[key] });

  try {
    // Call Hugging Face DialoGPT-small model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-small",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: message }),
      }
    );

    // Handle non-OK responses
    if (!response.ok) {
      console.error("Hugging Face API error:", response.statusText);
      return res.json({ reply: faqResponses[key] || "AI service unavailable. Try again later." });
    }

    const data = await response.json();

    // Extract generated text
    let reply = "Sorry, I couldn't generate a response.";
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    }

    // Fallback to FAQ if AI failed
    if (!reply && faqResponses[key]) reply = faqResponses[key];

    res.json({ reply });
  } catch (err) {
    console.error("Hugging Face Error:", err);
    res.json({ reply: faqResponses[key] || "AI service unavailable. Try again later." });
  }
});

module.exports = router;
