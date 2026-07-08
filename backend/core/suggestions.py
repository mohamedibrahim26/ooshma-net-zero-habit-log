"""
Rule-based suggestion engine.
Returns reduction tips and counter-steps based on activity type and severity.
"""

# ─── REDUCTION TIPS per category/activity ────────────────────────────────────

REDUCTION_TIPS = {
    'transport': {
        'car_petrol': [
            {'action': 'Switch to public transport', 'saving_kg_per_year': 1400, 'difficulty': 'medium'},
            {'action': 'Carpool with at least one other person', 'saving_kg_per_year': 900, 'difficulty': 'easy'},
            {'action': 'Work from home 2 days/week', 'saving_kg_per_year': 600, 'difficulty': 'easy'},
            {'action': 'Switch to an electric vehicle', 'saving_kg_per_year': 1200, 'difficulty': 'hard'},
        ],
        'car_diesel': [
            {'action': 'Switch to public transport', 'saving_kg_per_year': 1200, 'difficulty': 'medium'},
            {'action': 'Carpool with at least one other person', 'saving_kg_per_year': 800, 'difficulty': 'easy'},
            {'action': 'Switch to an electric vehicle', 'saving_kg_per_year': 1000, 'difficulty': 'hard'},
        ],
        'flight_short': [
            {'action': 'Take the train instead of flying', 'saving_kg_per_year': 800, 'difficulty': 'medium'},
            {'action': 'Use video conferencing instead of business travel', 'saving_kg_per_year': 500, 'difficulty': 'easy'},
        ],
        'flight_long': [
            {'action': 'Reduce to one long-haul flight per year', 'saving_kg_per_year': 2000, 'difficulty': 'hard'},
            {'action': 'Choose economy class (lower per-seat footprint)', 'saving_kg_per_year': 400, 'difficulty': 'easy'},
        ],
        '_default': [
            {'action': 'Walk or cycle for journeys under 5km', 'saving_kg_per_year': 300, 'difficulty': 'easy'},
            {'action': 'Plan trips efficiently to reduce total distance', 'saving_kg_per_year': 200, 'difficulty': 'easy'},
        ],
    },
    'energy': {
        'electricity_grid': [
            {'action': 'Switch to a renewable energy tariff', 'saving_kg_per_year': 500, 'difficulty': 'easy'},
            {'action': 'Install solar panels', 'saving_kg_per_year': 1000, 'difficulty': 'hard'},
            {'action': 'Replace old appliances with energy-rated ones', 'saving_kg_per_year': 200, 'difficulty': 'medium'},
            {'action': 'Use LED bulbs throughout your home', 'saving_kg_per_year': 80, 'difficulty': 'easy'},
        ],
        'natural_gas': [
            {'action': 'Insulate your home (loft + walls)', 'saving_kg_per_year': 600, 'difficulty': 'hard'},
            {'action': 'Lower thermostat by 1°C', 'saving_kg_per_year': 130, 'difficulty': 'easy'},
            {'action': 'Switch to a heat pump', 'saving_kg_per_year': 900, 'difficulty': 'hard'},
        ],
        '_default': [
            {'action': 'Unplug devices on standby', 'saving_kg_per_year': 50, 'difficulty': 'easy'},
            {'action': 'Wash clothes at 30°C', 'saving_kg_per_year': 40, 'difficulty': 'easy'},
        ],
    },
    'food': {
        'beef': [
            {'action': 'Replace beef with chicken (same meals)', 'saving_kg_per_year': 600, 'difficulty': 'easy'},
            {'action': 'Have one meat-free day per week', 'saving_kg_per_year': 400, 'difficulty': 'easy'},
            {'action': 'Switch to plant-based alternatives for half your meals', 'saving_kg_per_year': 900, 'difficulty': 'medium'},
        ],
        'lamb': [
            {'action': 'Substitute lamb with pork or chicken', 'saving_kg_per_year': 500, 'difficulty': 'easy'},
        ],
        '_default': [
            {'action': 'Buy local and seasonal produce', 'saving_kg_per_year': 200, 'difficulty': 'easy'},
            {'action': 'Reduce food waste — plan meals in advance', 'saving_kg_per_year': 300, 'difficulty': 'easy'},
            {'action': 'Shift toward a plant-rich diet', 'saving_kg_per_year': 700, 'difficulty': 'medium'},
        ],
    },
    'shopping': {
        'new_smartphone': [
            {'action': 'Buy refurbished instead of new', 'saving_kg_per_year': 60, 'difficulty': 'easy'},
            {'action': 'Keep your phone for an extra year', 'saving_kg_per_year': 35, 'difficulty': 'easy'},
        ],
        'new_clothing': [
            {'action': 'Buy secondhand / vintage clothing', 'saving_kg_per_year': 150, 'difficulty': 'easy'},
            {'action': 'Choose quality over quantity', 'saving_kg_per_year': 100, 'difficulty': 'easy'},
        ],
        '_default': [
            {'action': 'Ask yourself: do I really need this?', 'saving_kg_per_year': 200, 'difficulty': 'easy'},
            {'action': 'Repair instead of replace', 'saving_kg_per_year': 150, 'difficulty': 'medium'},
        ],
    },
    'waste': {
        'landfill': [
            {'action': 'Start composting food waste', 'saving_kg_per_year': 80, 'difficulty': 'easy'},
            {'action': 'Recycle all eligible materials', 'saving_kg_per_year': 60, 'difficulty': 'easy'},
        ],
        '_default': [
            {'action': 'Reduce single-use plastics', 'saving_kg_per_year': 30, 'difficulty': 'easy'},
            {'action': 'Use reusable bags, bottles, and containers', 'saving_kg_per_year': 20, 'difficulty': 'easy'},
        ],
    },
}

# ─── COUNTER-STEPS for high/critical impact actions ──────────────────────────

COUNTER_STEPS = {
    'flight_long': [
        {
            'action': 'Purchase verified carbon offsets',
            'description': 'Use certified offset schemes (Gold Standard, Verra VCS). Cost: ~£10–20 per tonne CO2.',
            'impact_neutralization': 1.0,
        },
        {
            'action': 'Plant trees',
            'description': 'One mature tree absorbs ~20kg CO2/year. For a long-haul flight (~1 tonne CO2), plant 50 trees.',
            'impact_neutralization': 0.8,
        },
        {
            'action': 'Go car-free for 3 months',
            'description': 'Replacing car use with walking/cycling/transit for ~3 months compensates ~1 tonne CO2.',
            'impact_neutralization': 0.7,
        },
    ],
    'flight_short': [
        {
            'action': 'Buy carbon offsets for this flight',
            'description': 'A short flight emits ~200–400kg CO2. Offset via Gold Standard for ~£4–8.',
            'impact_neutralization': 1.0,
        },
        {
            'action': 'Go vegetarian for 2 months',
            'description': 'A plant-based diet saves ~0.5kg CO2/day, enough to compensate a short flight in 2 months.',
            'impact_neutralization': 0.6,
        },
    ],
    'car_petrol': [
        {
            'action': 'Switch to cycling or transit for 1 month',
            'description': 'Avoiding 200km of petrol driving saves ~38kg CO2.',
            'impact_neutralization': 0.5,
        },
        {
            'action': 'Plant 2 trees',
            'description': 'Two trees absorb ~40kg CO2/year, covering a typical monthly car commute.',
            'impact_neutralization': 0.6,
        },
    ],
    'beef': [
        {
            'action': 'Go plant-based for a week',
            'description': '7 days plant-based diet saves ~7–10kg CO2, compensating ~0.3–0.4kg of beef.',
            'impact_neutralization': 0.7,
        },
        {
            'action': 'Reduce heating by 2°C for a month',
            'description': 'Saves ~20kg CO2/month, a good trade-off for regular beef consumption.',
            'impact_neutralization': 0.5,
        },
    ],
    'new_car': [
        {
            'action': 'Purchase carbon offsets (6 tonnes CO2)',
            'description': 'Manufacturing a new car emits ~6 tonnes CO2. Offset cost: ~£60–120.',
            'impact_neutralization': 1.0,
        },
        {
            'action': 'Go car-free / use transit for 1 year',
            'description': 'Avoiding personal car use for a year saves ~1.5–2 tonnes CO2.',
            'impact_neutralization': 0.3,
        },
    ],
    '_default_critical': [
        {
            'action': 'Purchase verified carbon offsets',
            'description': 'Buy offsets from Gold Standard or Verra VCS certified projects at ~£10–15/tonne CO2.',
            'impact_neutralization': 1.0,
        },
        {
            'action': 'Audit and reduce energy use at home',
            'description': 'Switching to LED, better insulation and renewable tariff can save 500–1000kg CO2/year.',
            'impact_neutralization': 0.5,
        },
        {
            'action': 'Adopt a plant-rich diet for 3 months',
            'description': 'Cutting meat and dairy for 90 days can save up to 135kg CO2.',
            'impact_neutralization': 0.3,
        },
    ],
}


def get_suggestions(category: str, activity_type: str, kg_co2: float, severity: str) -> dict:
    """
    Returns personalized tips and (if high/critical) counter-steps.

    Returns:
        dict with keys: 'reduction_tips', 'counter_steps', 'trees_to_plant', 'offset_cost_usd'
    """
    cat_tips = REDUCTION_TIPS.get(category, {})
    tips = cat_tips.get(activity_type, cat_tips.get('_default', []))

    result = {
        'reduction_tips': tips,
        'counter_steps': [],
        'trees_to_plant': 0,
        'offset_cost_usd': 0,
    }

    if severity in ('high', 'critical'):
        steps = COUNTER_STEPS.get(activity_type, COUNTER_STEPS.get('_default_critical', []))
        result['counter_steps'] = steps
        # ~20kg CO2 per tree per year; round up
        result['trees_to_plant'] = max(1, round(kg_co2 / 20))
        # Gold Standard average: $15/tonne = $0.015/kg
        result['offset_cost_usd'] = round(kg_co2 * 0.015, 2)

    return result
