"""
CO2 calculation engine.
Takes an activity dict and returns kg CO2e.
"""
from .emission_factors import TRANSPORT, ENERGY, FOOD, SHOPPING, WASTE


CATEGORY_FACTORS = {
    'transport': TRANSPORT,
    'energy': ENERGY,
    'food': FOOD,
    'shopping': SHOPPING,
    'waste': WASTE,
}


def calculate_emission(category: str, activity_type: str, quantity: float) -> float:
    """
    Returns kg CO2e for a given activity.

    Args:
        category: one of 'transport', 'energy', 'food', 'shopping', 'waste'
        activity_type: key within the category (e.g. 'car_petrol', 'beef')
        quantity: amount (km for transport, kWh for energy, kg for food/waste, units for shopping)

    Returns:
        float: kg CO2e
    """
    factors = CATEGORY_FACTORS.get(category)
    if not factors:
        raise ValueError(f"Unknown category: {category}")

    factor = factors.get(activity_type)
    if factor is None:
        raise ValueError(f"Unknown activity type '{activity_type}' in category '{category}'")

    return round(factor * quantity, 4)


def get_severity(kg_co2: float) -> str:
    """Classifies the CO2 amount into a severity level."""
    if kg_co2 < 5:
        return 'low'
    elif kg_co2 < 20:
        return 'medium'
    elif kg_co2 < 50:
        return 'high'
    else:
        return 'critical'


def get_equivalents(kg_co2: float) -> dict:
    """Returns real-world equivalents for a given CO2 amount."""
    return {
        'km_driven_petrol': round(kg_co2 / 0.192, 1),
        'smartphones_charged': round(kg_co2 / 0.008, 0),
        'trees_months_to_absorb': round(kg_co2 / 1.667, 1),  # avg tree absorbs 20kg/year
        'beef_kg_equivalent': round(kg_co2 / 27.0, 2),
        'flight_km_equivalent': round(kg_co2 / 0.225, 1),
    }
