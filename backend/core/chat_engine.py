"""
Rule-based AI Chat Engine for Ooshma.
Understands carbon-related questions and gives smart, personalized responses.
"""
import re
from .emission_factors import TRANSPORT, ENERGY, FOOD, SHOPPING, WASTE
from .calculator import calculate_emission, get_severity, get_equivalents
from .suggestions import get_suggestions

# ─── Keyword maps ─────────────────────────────────────────────────────────────

TRANSPORT_KEYWORDS = {
    'flight': 'flight_long', 'fly': 'flight_long', 'plane': 'flight_long',
    'short flight': 'flight_short', 'domestic flight': 'flight_short',
    'car': 'car_petrol', 'drive': 'car_petrol', 'petrol': 'car_petrol',
    'diesel': 'car_diesel', 'electric car': 'car_electric', 'ev': 'car_electric',
    'bus': 'bus', 'train': 'train', 'metro': 'metro_subway', 'subway': 'metro_subway',
    'motorcycle': 'motorcycle', 'bike': 'bicycle', 'bicycle': 'bicycle',
    'walk': 'walking',
}

FOOD_KEYWORDS = {
    'beef': 'beef', 'steak': 'beef', 'burger': 'beef',
    'lamb': 'lamb', 'mutton': 'lamb',
    'chicken': 'chicken', 'poultry': 'chicken',
    'pork': 'pork', 'bacon': 'pork',
    'fish': 'fish', 'seafood': 'fish',
    'milk': 'dairy_milk', 'cheese': 'cheese',
    'coffee': 'coffee', 'rice': 'rice',
    'vegetable': 'vegetables', 'vegan': 'legumes', 'tofu': 'tofu',
}

ENERGY_KEYWORDS = {
    'electricity': 'electricity_grid', 'electric': 'electricity_grid',
    'gas': 'natural_gas', 'heating': 'natural_gas',
    'solar': 'solar', 'oil': 'heating_oil',
}

# ─── Intent patterns ──────────────────────────────────────────────────────────

INTENTS = [
    (r'(what|how much).*(co2|carbon|emit|footprint).*(flight|fly|plane)', 'flight_impact'),
    (r'(flight|fly|flew|plane).*(co2|carbon|emit|impact|bad)', 'flight_impact'),
    (r'(what|how).*(reduce|lower|cut|decrease).*(carbon|co2|footprint|emission)', 'how_to_reduce'),
    (r'(reduce|lower|cut).*(carbon|co2|footprint)', 'how_to_reduce'),
    (r'(what|how).*(offset|neutrali|compensat)', 'offsetting'),
    (r'(offset|neutrali|compensat).*(carbon|co2|flight|emission)', 'offsetting'),
    (r'(beef|meat|eat|food|diet).*(carbon|co2|impact|bad|emit)', 'food_impact'),
    (r'(carbon|co2|impact).*(beef|meat|eat|food|diet)', 'food_impact'),
    (r'(car|drive|driving|petrol|diesel).*(carbon|co2|bad|impact|emit)', 'car_impact'),
    (r'(electric car|ev|electric vehicle)', 'electric_car'),
    (r'(solar|renewable|clean energy|wind power)', 'renewable_energy'),
    (r'(tree|plant|forest|reforest)', 'tree_planting'),
    (r'(global average|average person|average emission|world average)', 'global_average'),
    (r'(tip|advice|suggest|recommend|help me)', 'general_tips'),
    (r'(hello|hi|hey|good morning|good evening|howdy)', 'greeting'),
    (r'(thank|thanks|thank you)', 'thanks'),
    (r'(what (is|are) (your|this)|who are you|what can you do)', 'about'),
    (r'calculate|compute|how much co2', 'calculate_prompt'),
]


def detect_intent(message: str) -> str:
    msg = message.lower()
    for pattern, intent in INTENTS:
        if re.search(pattern, msg):
            return intent
    return 'general'


def extract_number(text: str) -> float | None:
    match = re.search(r'\b(\d+(?:\.\d+)?)\b', text)
    return float(match.group(1)) if match else None


# ─── Response library ─────────────────────────────────────────────────────────

RESPONSES = {
    'greeting': [
        "Hey! 👋 I'm EcoBot, your personal carbon footprint assistant. Ask me anything — flight emissions, food impact, how to reduce your footprint, or what to do after a high-impact activity!",
        "Hello! 🌿 I'm here to help you understand and reduce your carbon footprint. What would you like to know?",
    ],
    'thanks': [
        "You're welcome! 🌱 Every small action counts. Keep tracking and reducing!",
        "Happy to help! 🌍 Together we can make a difference. Any more questions?",
    ],
    'about': [
        "I'm EcoBot 🤖 — a smart assistant built into Ooshma. I can help you:\n\n• Calculate CO₂ for any activity\n• Explain the impact of flights, food, and energy\n• Suggest ways to reduce your footprint\n• Explain carbon offsetting\n• Give you personalized eco-tips\n\nJust ask away!",
    ],
    'global_average': [
        "🌍 **Global Carbon Averages:**\n\n• World average: ~4,800 kg CO₂/person/year\n• USA: ~14,000 kg/year (one of the highest)\n• UK: ~5,500 kg/year\n• India: ~1,900 kg/year\n• Paris Agreement target: <2,000 kg/year by 2050\n\nThe biggest contributors are usually transport (especially flights), home energy, and diet. What area would you like to focus on?",
    ],
    'flight_impact': [
        "✈️ **Flights & Carbon:**\n\nFlying is one of the most carbon-intensive activities:\n\n• Short flight (<3h): ~0.255 kg CO₂ per km per person\n• Long flight (>3h): ~0.195 kg CO₂ per km per person\n\nExample: A London→Dubai flight (~5,500 km) = **~1,073 kg CO₂** — that's 22% of the average person's annual budget!\n\n**Counter-steps:**\n🌳 Plant 54 trees OR buy carbon offsets (~$16)\n🚗 Go car-free for 3 months\n🥗 Go plant-based for 4 months\n\nWant to calculate a specific flight?",
    ],
    'food_impact': [
        "🥩 **Food & Carbon:**\n\nDiet is the 3rd biggest source of personal emissions:\n\n• Beef: 27 kg CO₂ per kg (highest!)\n• Lamb: 39 kg CO₂ per kg\n• Chicken: 6.9 kg CO₂ per kg\n• Vegetables: ~2 kg CO₂ per kg\n• Legumes: 0.9 kg CO₂ per kg\n\n**Quick wins:**\n🌱 One meat-free day/week saves ~400 kg/year\n🐔 Swap beef for chicken saves ~600 kg/year\n🥗 Plant-based diet saves ~1,500 kg/year\n\nWant a specific food calculation?",
    ],
    'car_impact': [
        "🚗 **Cars & Carbon:**\n\n• Petrol car: 0.192 kg CO₂ per km\n• Diesel car: 0.171 kg CO₂ per km\n• Electric car: 0.053 kg CO₂ per km (64% less!)\n• Bus: 0.089 kg CO₂ per km\n• Train: 0.041 kg CO₂ per km\n\n**Example:** 20km daily commute by petrol car = **1,402 kg CO₂/year**\nSame commute by train = **300 kg/year** — saving over 1 tonne!\n\n**Tips:**\n🚌 Switch to public transport\n🚲 Cycle/walk for trips under 5km\n🏠 Work from home 2 days/week",
    ],
    'electric_car': [
        "⚡ **Electric Cars:**\n\nEVs produce ~0.053 kg CO₂/km vs 0.192 for petrol — **72% less emissions!**\n\nHowever, manufacturing an EV emits ~6,000 kg CO₂ upfront. You break even vs a petrol car after ~3-4 years of driving.\n\n**Best practices:**\n🔌 Charge with renewable energy (solar/green tariff)\n🌙 Charge at night when grid is cleaner\n♻️ Recycle battery at end of life\n\nEVs are definitely the greener choice long-term!",
    ],
    'renewable_energy': [
        "☀️ **Renewable Energy:**\n\nSwitching to renewables is one of the highest-impact changes you can make:\n\n• Solar panels: saves ~1,000 kg CO₂/year\n• Green energy tariff: saves ~500 kg CO₂/year (easiest!)\n• Heat pump vs gas boiler: saves ~900 kg CO₂/year\n\n**Solar payback:**\nA typical home solar system (4kW) saves ~1 tonne CO₂/year and pays back its carbon cost in 1-2 years.\n\n**Quick win:** Switch your electricity provider to a 100% renewable tariff — takes 10 minutes and costs no more!",
    ],
    'tree_planting': [
        "🌳 **Tree Planting & Carbon:**\n\nOne mature tree absorbs ~20 kg CO₂/year. To offset 1 tonne of CO₂ you'd need to plant **50 trees** and wait for them to mature (~10-20 years).\n\n**Better offsetting options:**\n✅ Gold Standard offsets: ~$15/tonne (verified, immediate)\n✅ Verra VCS: ~$10/tonne\n✅ Rainforest protection: protects existing carbon stores\n\n**Tree planting is great** but shouldn't be your only strategy — reducing emissions first is always better than offsetting!",
    ],
    'offsetting': [
        "💚 **Carbon Offsetting:**\n\nOffsetting means funding projects that reduce CO₂ elsewhere to compensate for your emissions.\n\n**Best certified schemes:**\n🏅 Gold Standard — highest quality, ~$15-20/tonne\n✅ Verra VCS — widely used, ~$10-15/tonne\n🌳 Trees for Life — reforestation focused\n\n**How much does it cost?**\n• Short flight (300kg CO₂): ~$4.50\n• Long-haul flight (1 tonne): ~$15\n• Annual car use (2 tonnes): ~$30\n\n**Important:** Offsetting should be a last resort — reducing first is always better! The order should be: Reduce → Avoid → Offset.",
    ],
    'how_to_reduce': [
        "🌱 **Top Ways to Reduce Your Carbon Footprint:**\n\nRanked by annual savings:\n\n1. 🚗 **Go car-free** → saves 2,000+ kg/year\n2. ✈️ **Take one fewer long-haul flight** → saves 1,500-2,000 kg/year\n3. ⚡ **Switch to renewable energy** → saves 1,000-1,500 kg/year\n4. 🥗 **Plant-based diet** → saves 700-1,500 kg/year\n5. 🏠 **Insulate your home** → saves 500-800 kg/year\n6. 🛍️ **Buy less new stuff** → saves 300-500 kg/year\n7. 🌱 **One meat-free day/week** → saves 400 kg/year\n8. 💡 **Switch to LED bulbs** → saves 80 kg/year\n\nWhat area do you want to focus on first?",
    ],
    'general_tips': [
        "🌍 **Ooshma Tips:**\n\nHere are some quick wins for today:\n\n• 🚲 Walk or cycle for trips under 5km\n• 🥗 Try one plant-based meal today\n• 💡 Turn off lights and unplug devices\n• 🚿 Take a shorter shower (saves ~0.5 kg CO₂)\n• 🛍️ Bring a reusable bag\n• ♻️ Recycle your waste correctly\n\nLog every activity in Ooshma to track your progress. Small habits add up to big changes over a year!",
    ],
    'calculate_prompt': [
        "I can help you calculate CO₂! 📊\n\nFor the most accurate calculation, use the **Log Activity** page — pick your category, type, and quantity.\n\nOr ask me like:\n• 'How much CO₂ is a 500km car trip?'\n• 'What's the carbon footprint of 1kg of beef?'\n• 'How much does flying 3000km emit?'",
    ],
    'general': [
        "🌿 That's a great question! I'm specialized in carbon footprint topics. Here's what I can help with:\n\n• ✈️ Flight emissions & offsetting\n• 🚗 Transport comparisons\n• 🥗 Food & diet impact\n• ⚡ Home energy savings\n• 🌱 General eco-tips\n\nTry asking something like 'How do I reduce my carbon footprint?' or 'How much CO₂ does a flight produce?'",
    ],
}


def calculate_from_message(message: str) -> str | None:
    """Try to extract a calculation request from natural language."""
    msg = message.lower()

    # detect activity type
    activity_type = None
    category = None

    for kw, atype in TRANSPORT_KEYWORDS.items():
        if kw in msg:
            activity_type = atype
            category = 'transport'
            break

    if not activity_type:
        for kw, atype in FOOD_KEYWORDS.items():
            if kw in msg:
                activity_type = atype
                category = 'food'
                break

    if not activity_type:
        for kw, atype in ENERGY_KEYWORDS.items():
            if kw in msg:
                activity_type = atype
                category = 'energy'
                break

    if not activity_type:
        return None

    quantity = extract_number(message)
    if not quantity:
        unit_map = {'transport': 'km', 'food': 'kg', 'energy': 'kWh'}
        return f"Got it! To calculate the CO₂ for **{activity_type.replace('_', ' ')}**, just tell me the quantity (in {unit_map.get(category, 'units')})."

    try:
        kg = calculate_emission(category, activity_type, quantity)
        severity = get_severity(kg)
        eq = get_equivalents(kg)
        sugg = get_suggestions(category, activity_type, kg, severity)

        unit_map = {'transport': 'km', 'food': 'kg', 'energy': 'kWh', 'shopping': 'units', 'waste': 'kg'}
        unit = unit_map.get(category, 'units')

        lines = [
            f"📊 **{quantity} {unit} of {activity_type.replace('_', ' ')}:**",
            f"",
            f"🌍 **{kg} kg CO₂e** — Severity: {severity.upper()}",
            f"",
            f"**That's equivalent to:**",
            f"🚗 {eq['km_driven_petrol']} km in a petrol car",
            f"🌳 {eq['trees_months_to_absorb']} months for a tree to absorb",
            f"📱 {int(eq['smartphones_charged'])} smartphones charged",
            f"",
        ]

        if sugg['reduction_tips']:
            lines.append("**Top tip:**")
            tip = sugg['reduction_tips'][0]
            lines.append(f"✅ {tip['action']} (saves {tip['saving_kg_per_year']} kg/year)")

        if sugg['counter_steps']:
            lines.append(f"\n**To offset this:**")
            lines.append(f"🌳 Plant {sugg['trees_to_plant']} trees OR buy ${sugg['offset_cost_usd']} in carbon offsets")

        return '\n'.join(lines)
    except Exception:
        return None


def get_response(message: str) -> dict:
    """Main entry point. Returns a response dict with message and type."""
    import random

    # Try calculation first
    calc = calculate_from_message(message)
    if calc:
        return {'message': calc, 'type': 'calculation'}

    intent = detect_intent(message)
    responses = RESPONSES.get(intent, RESPONSES['general'])
    response = random.choice(responses) if isinstance(responses, list) else responses

    return {'message': response, 'type': intent}
