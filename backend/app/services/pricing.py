"""
Pricing logic — ONE function, shared by price-quote endpoint AND
booking creation.  Never duplicate this math.

    nights     = (check_out - check_in).days
    subtotal   = nights * listing.price_per_night
    service_fee = subtotal * SERVICE_FEE_PCT
    total      = subtotal + listing.cleaning_fee + service_fee
"""

from datetime import date

from app.core.config import settings


def compute_price(
    price_per_night: float,
    cleaning_fee: float,
    check_in: date,
    check_out: date,
) -> dict:
    """
    Compute a full price breakdown.

    Returns a dict with: nightly_price, nights, subtotal,
    cleaning_fee, service_fee, total.
    """
    nights = (check_out - check_in).days
    if nights <= 0:
        raise ValueError("check_out must be after check_in")

    subtotal = nights * price_per_night
    service_fee = round(subtotal * settings.SERVICE_FEE_PCT, 2)
    total = round(subtotal + cleaning_fee + service_fee, 2)

    return {
        "nightly_price": price_per_night,
        "nights": nights,
        "subtotal": round(subtotal, 2),
        "cleaning_fee": cleaning_fee,
        "service_fee": service_fee,
        "total": total,
    }
