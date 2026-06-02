/**
 * Prompt Templates
 *
 * All Gemini prompt strings are centralised here.
 * Keeping prompts out of the service layer means you can iterate
 * on prompt engineering without touching business logic.
 *
 * Currency convention: ALL pricing must be in Indian Rupees (INR / ₹).
 */

/**
 * Prompt 1: Structure raw extracted text into booking data JSON.
 *
 * @param {string} rawText - Combined text extracted from uploaded travel docs
 * @returns {string} Formatted prompt string
 */
export const buildStructuredDataPrompt = (rawText) => `
You are an expert travel document parser.

Extract all structured travel information from the text below and return it as a single, valid JSON object.

Include the following fields where available:
- flights: array of { airline, flightNumber, from, to, departureDate, departureTime, arrivalDate, arrivalTime, seatClass, confirmationCode }
- hotels: array of { name, location, checkIn, checkOut, roomType, confirmationCode }
- visas: array of { country, type, validFrom, validTo }
- passengers: array of { name, passportNumber }
- tripSummary: { origin, destination, tripDuration, totalPassengers }

Rules:
- Return ONLY valid JSON. No markdown, no explanation, no code fences.
- Use null for any field that cannot be found in the text.
- If a section has no data (e.g., no visa info), omit that key entirely.

Raw Text:
"""
${rawText}
"""
`;

/**
 * Prompt 2: Generate a full travel itinerary from structured booking data.
 * All costs MUST be in Indian Rupees (₹ / INR).
 *
 * @param {object} bookingData - AI-parsed booking object from Prompt 1
 * @returns {string} Formatted prompt string
 */
export const buildItineraryPrompt = (bookingData) => `
You are an expert travel planner and concierge serving Indian travellers.

Using the confirmed booking data below, generate a detailed day-by-day travel itinerary.

IMPORTANT CURRENCY RULE: All prices, costs, and budget estimates MUST be in Indian Rupees (INR).
Use the ₹ symbol before every amount. Examples: ₹500, ₹1,200, ₹3,500–₹5,000.
Never use $ (USD) or € (EUR) or any other currency.

Return the result as a single valid JSON object with this shape:
{
  "title": "Trip title (e.g., 'Paris Adventure — June 2025')",
  "duration": "X days",
  "totalEstimatedCost": "₹XX,XXX–₹XX,XXX (total trip estimate in INR)",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Short day theme (e.g., 'Arrival & Explore Montmartre')",
      "activities": [
        {
          "time": "09:00",
          "activity": "Activity name",
          "description": "Brief description",
          "category": "accommodation/food/activity/transport/other",
          "location": "Optional location name",
          "cost": "₹XXX (estimated cost in INR, e.g. ₹500 or ₹1,200–₹2,000)",
          "tips": "Optional local tips"
        }
      ],
      "accommodation": "Hotel name or 'In Transit'",
      "meals": { "breakfast": "...", "lunch": "...", "dinner": "..." },
      "transport": "How they get around this day"
    }
  ],
  "practicalInfo": {
    "currency": "Indian Rupee (₹ / INR)",
    "language": "...",
    "emergencyNumbers": "...",
    "packingTips": ["..."]
  }
}

Rules:
- Return ONLY valid JSON. No markdown, no explanation, no code fences.
- ALL monetary values must use ₹ and be in INR. Never use $ or €.
- Base the itinerary strictly on the confirmed dates in the booking data.
- Fill each day with realistic, curated activities appropriate for the destination.
- Suggest restaurants that match the destination's local cuisine.
- Use correct category names: 'accommodation', 'food', 'activity', 'transport', 'other'.

Booking Data:
${JSON.stringify(bookingData, null, 2)}
`;

/**
 * Prompt 3: Generate a travel itinerary from custom user preferences.
 * All costs MUST be in Indian Rupees (₹ / INR).
 *
 * @param {object} preferences - User selected preferences from form
 * @returns {string} Formatted prompt string
 */
export const buildItineraryFromPreferencesPrompt = (preferences) => `
You are an expert travel planner and concierge serving Indian travellers.

Generate a custom, highly curated day-by-day travel itinerary based on the following user preferences:
- Destination: ${preferences.destination}
- Duration: ${preferences.duration} days
- Budget Level: ${preferences.budget || "Moderate"}
- Travel Pacing/Style: ${preferences.travelStyle || "Balanced"}
- Areas of Interest: ${preferences.interests?.join(", ") || "General Sightseeing"}
${preferences.startDate ? `- Start Date: ${preferences.startDate}` : ""}
${preferences.additionalNotes ? `- Custom Notes/Requests: ${preferences.additionalNotes}` : ""}

IMPORTANT CURRENCY RULE: All prices, costs, and budget estimates MUST be in Indian Rupees (INR).
Use the ₹ symbol before every amount. Examples: ₹500, ₹1,200, ₹3,500–₹5,000.
Never use $ (USD) or € (EUR) or any other currency symbol.

Budget level reference in INR:
- Budget: accommodation ₹800–₹2,000/night, meals ₹150–₹400 per meal
- Moderate: accommodation ₹2,000–₹6,000/night, meals ₹400–₹1,200 per meal
- Luxury: accommodation ₹8,000–₹25,000+/night, meals ₹1,500–₹5,000+ per meal

Return the result as a single valid JSON object with this shape:
{
  "title": "Trip title (e.g., '${preferences.destination} Getaway')",
  "duration": "${preferences.duration} days",
  "totalEstimatedCost": "₹XX,XXX–₹XX,XXX (total trip estimate in INR for ${preferences.duration} days)",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Short day theme (e.g., 'Explore ${preferences.destination} City Center')",
      "activities": [
        {
          "time": "09:00",
          "activity": "Activity name",
          "description": "Brief description of the activity and why it fits their style/budget/interests",
          "category": "accommodation/food/activity/transport/other",
          "location": "Optional location name",
          "cost": "₹XXX (estimated cost in INR, e.g. ₹500 or Free)"
        }
      ],
      "accommodation": "Suggested hotel or accommodation type matching the ${preferences.budget} budget",
      "meals": { "breakfast": "...", "lunch": "...", "dinner": "..." },
      "transport": "Suggested transport mode for the day"
    }
  ],
  "practicalInfo": {
    "currency": "Indian Rupee (₹ / INR)",
    "language": "...",
    "emergencyNumbers": "...",
    "packingTips": ["..."]
  }
}

Rules:
- Return ONLY valid JSON. No markdown, no explanation, no code fences.
- ALL monetary values must use ₹ and be in INR. Never use $ or €.
- Keep activities, accommodation, and food suggestions aligned with the specified budget (${preferences.budget}) and pacing style (${preferences.travelStyle}).
- Use correct category names for each activity. Valid categories are: 'accommodation', 'food', 'activity', 'transport', 'other'.
- Provide realistic and feasible times for each activity.
`;

/**
 * Prompt 4: Classify and validate whether the extracted text is a travel document.
 *
 * @param {string} rawText - Combined text extracted from uploaded files
 * @returns {string} Formatted prompt string
 */
export const buildValidationPrompt = (rawText) => `
You are a travel document classifier and validator.
Your task is to classify whether the provided document is a valid travel booking, ticket, reservation, or itinerary.

Travel Documents include:
- Flight tickets, airline bookings, or boarding passes
- Hotel reservations or booking confirmations
- Train or bus tickets
- Tour packages or travel vouchers
- Airport transfer bookings
- Booking confirmations
- Existing travel itineraries

Invalid Documents include:
- Shopping lists
- Personal notes, diary entries, or journals
- Resumes or CVs
- Invoices for non-travel items (e.g. utilities, office supplies, software subscriptions)
- Medical reports, prescriptions, or lab results
- Study materials, homework, notes, or textbook pages
- Meeting notes, business proposals, or slide decks
- Bank statements or general documents

A valid travel document MUST contain at least one of these meaningful travel indicators:
- destination (e.g. city, country)
- flight (e.g. airline, flight number)
- hotel (e.g. hotel name, lodging info)
- bookingReference, pnr, or reservationId
- travelDate (departure/arrival date)
- checkInDate or checkOutDate

Analyze the text content below and classify the document.
Return a JSON object containing:
- isTravelDocument: boolean (true if the document is a travel-related ticket/booking/reservation/itinerary, false otherwise)
- confidence: number between 0 and 1 (how confident you are in this decision, e.g. 0.92)
- reason: string (brief explanation of why it is or is not a travel document)

Rules:
- Return ONLY valid JSON. No markdown, no explanation, no code fences.

Document Text:
"""
${rawText}
"""
`;

