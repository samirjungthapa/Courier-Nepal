const { body, validationResult } = require("express-validator");

function requireValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, msg: e.msg }));
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }
}

function answerForQuestion(question, context = {}) {
  const q = (question || "").toLowerCase();
  const user = context.user;
  const parcels = context.parcels || [];

  if (q.includes("my point") || q.includes("my reward")) {
    const pts = user ? (user.points || 380) : 380;
    return `You currently have ${pts} Loyalty Reward Points! You can redeem these on your dashboard for discount vouchers (100 points = 10% off, 250 points = 25% off).`;
  }

  if (q.includes("my package") || q.includes("my parcel") || q.includes("my shipment") || q.includes("my courier")) {
    if (!parcels || parcels.length === 0) {
      return "You do not have any recent shipments recorded on your account at the moment.";
    }
    const list = parcels.map(p => `Parcel #${p.id} (${p.parcelType || 'Standard'}) - Status: ${p.status} to ${p.receiverName}`).join(", ");
    return `Here are your recent shipments: ${list}.`;
  }

  if (q.includes("track") || q.includes("tracking") || q.includes("where is") || q.includes("status")) {
    return "To track your parcel, navigate to 'Track Parcel' page or check your 'Order History'. You can see details for transit checkpoints: Order Created → Picked Up → In Transit → Out for Delivery → Delivered.";
  }

  if (q.includes("pickup") || q.includes("schedule") || q.includes("collect")) {
    return "Doorstep pickup can be scheduled when creating a shipment. Choose a convenient date and time slot, specify the pickup address, and our driver will arrive to collect the parcel.";
  }

  if (q.includes("payment") || q.includes("esewa") || q.includes("khalti") || q.includes("cod") || q.includes("pay")) {
    return "We support digital payments via eSewa, Khalti, and Cash on Delivery (COD). You can view/download print-ready receipts for all successful payments directly from your order history.";
  }

  if (q.includes("carbon") || q.includes("green") || q.includes("eco") || q.includes("environment")) {
    return "Our routes are optimized by AI to reduce transport emissions. You can monitor your carbon offset progress directly on your merchant dashboard!";
  }

  if (q.includes("reward") || q.includes("points") || q.includes("loyalty")) {
    return "Every shipment earns you Loyalty Reward Points. You can redeem these points in your dashboard for delivery discount vouchers (e.g. 100 points for a 10% discount).";
  }

  if (q.includes("hello") || q.includes("hi ") || q.includes("hey")) {
    return "Hello! How can I assist you with your logistics, tracking, payments, or route optimization today?";
  }

  return "I can assist you with real-time parcel tracking, pickup schedules, digital payments, loyalty rewards, and green routing. Try asking something like 'How do I schedule a pickup?' or 'Where is my parcel?'";
}

async function ask(req, res) {
  requireValidation(req);
  const question = req.body.question;
  const context = req.body.context || {};
  const user = context.user || null;
  const parcels = context.parcels || [];
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    try {
      let contextPrompt = "";
      if (user) {
        contextPrompt += `\nCurrently Logged-in User Profile:\n- Name: ${user.name}\n- Points Balance: ${user.points || 380} Points\n`;
      }
      if (parcels && parcels.length > 0) {
        contextPrompt += `\nUser's Recent Consignments (Current Shipments):\n` + 
          parcels.map(p => `- Parcel #${p.id} (${p.parcelType || 'Standard'}): Status: ${p.status}, Destination: ${p.receiverCity || 'N/A'}, Receiver: ${p.receiverName}, Weight: ${p.weightKg || 1.5}kg`).join("\n") + "\n";
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are a helpful, professional Logistics & Courier AI Assistant for "Courier Nepal" (our premium logistics web platform).
Here is context about our platform:
- Parcel status flow: PENDING_PICKUP -> PICKED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED.
- Pickup requests: Users can schedule doorstep pickups with date/time slots when they schedule a pickup.
- Payments: eSewa, Khalti, or Cash on Delivery (COD).
- Loyalty points: Awarded to users for successful shipments (Redeemable for discount vouchers).
- Carbon offset tracking: Users offset CO2 emissions by using our green routing engine.
${contextPrompt}
Please answer the user question in a friendly, concise manner. Incorporate their profile name, points, or recent shipments directly if they ask about their packages or account details:
"${question}"`
                  }
                ]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return res.json({ answer: generatedText.trim() });
        }
      }
    } catch (err) {
      console.error("Gemini API call failed, using fallback:", err);
    }
  }

  const answer = answerForQuestion(question, context);
  return res.json({ answer: `[AI Assistant] ${answer}` });
}

const askValidators = [body("question").trim().isLength({ min: 1, max: 600 }).withMessage("question is required")];

module.exports = { ask, askValidators };

