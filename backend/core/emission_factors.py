"""
Emission factors in kg CO2e per unit.
Sources: EPA, IPCC AR6, Our World in Data
"""

# ─── TRANSPORT ────────────────────────────────────────────────────────────────
# kg CO2e per km per person
TRANSPORT = {
    'car_petrol':        0.192,   # average petrol car
    'car_diesel':        0.171,   # average diesel car
    'car_electric':      0.053,   # electric car (grid average)
    'motorcycle':        0.114,
    'bus':               0.089,
    'train':             0.041,
    'metro_subway':      0.031,
    'flight_short':      0.255,   # <3h flight, per km
    'flight_long':       0.195,   # >3h flight, per km (efficiency improves)
    'bicycle':           0.0,
    'walking':           0.0,
}

# ─── HOME ENERGY ──────────────────────────────────────────────────────────────
# kg CO2e per kWh
ENERGY = {
    'electricity_grid':  0.233,   # world average grid
    'natural_gas':       0.203,   # per kWh of gas
    'heating_oil':       0.298,   # per kWh of oil
    'lpg':               0.214,   # per kWh
    'solar':             0.020,   # lifecycle
    'wood_burning':      0.016,   # per kWh (biogenic, nearly neutral)
}

# ─── FOOD (kg CO2e per kg of food) ───────────────────────────────────────────
FOOD = {
    'beef':              27.0,
    'lamb':              39.2,
    'pork':              12.1,
    'chicken':            6.9,
    'fish':               6.1,
    'dairy_milk':         3.2,    # per litre
    'cheese':            13.5,
    'eggs':               4.8,    # per dozen ~= 0.6kg
    'rice':               2.7,
    'vegetables':         2.0,
    'fruits':             1.1,
    'legumes':            0.9,
    'tofu':               3.0,
    'bread':              1.6,
    'coffee':             17.0,   # per kg of coffee beans
}

# ─── SHOPPING (kg CO2e per item / unit) ──────────────────────────────────────
SHOPPING = {
    'new_smartphone':    70.0,
    'new_laptop':       300.0,
    'new_tv':           400.0,
    'new_clothing':       6.0,    # per garment average
    'new_car':        6000.0,     # manufacturing footprint
    'online_delivery':    0.5,    # per parcel
    'new_furniture':    100.0,    # per item estimate
}

# ─── WASTE (kg CO2e per kg of waste) ─────────────────────────────────────────
WASTE = {
    'landfill':          0.587,
    'recycled':          0.021,
    'composted':         0.010,
    'incinerated':       0.910,
}

# ─── SEVERITY THRESHOLDS (kg CO2e) ───────────────────────────────────────────
SEVERITY = {
    'low':      5.0,     # < 5 kg: normal / low impact
    'medium':  20.0,     # 5–20 kg: moderate
    'high':    50.0,     # 20–50 kg: high
    'critical': 50.0,    # > 50 kg: critical — triggers counter-steps
}

# Global average annual footprint per person: ~4,800 kg CO2e
GLOBAL_AVERAGE_ANNUAL_KG = 4800
# UK average: ~5,500 | US average: ~14,000 | India average: ~1,900
