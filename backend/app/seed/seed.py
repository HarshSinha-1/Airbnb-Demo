"""
Deterministic, idempotent seed script.

Fulfills all seed requirements:
- Uses random.seed(42)
- 5 hosts (2 superhosts) + 4 guest users = 9 total users
- 12 amenities
- 25 listings across 6 cities (Malibu, Paris, Kyoto, Aspen, Santorini, Cape Town)
- 3-5 high-res Unsplash photo URLs per listing
- Mix of past bookings (with linked reviews) and future bookings (blocked dates)
- Pre-populated wishlist items for guest user 1
- Ready demo scenario: Listing #1 booked for next weekend
"""

from datetime import date, datetime, timedelta, timezone
import random

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.listing import Listing, ListingImage, Amenity, listing_amenities
from app.models.booking import Booking
from app.models.review import Review
from app.models.wishlist import Wishlist
from app.services.pricing import compute_price


def seed_database(db: Session) -> None:
    random.seed(42)

    # If users exist, skip seeding to preserve idempotency
    if db.query(User).first() is not None:
        return

    print("Seeding database...")

    # 1. Create Users
    users_data = [
        # Hosts
        {"name": "Elena Rostova", "email": "elena@example.com", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400", "is_host": True, "is_superhost": True},
        {"name": "Marcus Vance", "email": "marcus@example.com", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", "is_host": True, "is_superhost": True},
        {"name": "Sophia Chen", "email": "sophia@example.com", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", "is_host": True, "is_superhost": False},
        {"name": "Antoine Dubois", "email": "antoine@example.com", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", "is_host": True, "is_superhost": False},
        {"name": "Kenji Takahashi", "email": "kenji@example.com", "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400", "is_host": True, "is_superhost": False},
        # Guests
        {"name": "Alice Johnson (Guest)", "email": "alice@example.com", "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", "is_host": False, "is_superhost": False},
        {"name": "Bob Smith (Guest)", "email": "bob@example.com", "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400", "is_host": False, "is_superhost": False},
        {"name": "Clara Meyer (Guest)", "email": "clara@example.com", "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400", "is_host": False, "is_superhost": False},
        {"name": "David Kim (Guest)", "email": "david@example.com", "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400", "is_host": False, "is_superhost": False},
    ]

    users = []
    for u in users_data:
        user = User(**u)
        db.add(user)
        users.append(user)
    db.flush()

    hosts = [u for u in users if u.is_host]
    guests = [u for u in users if not u.is_host]

    # 2. Create Amenities
    amenities_data = [
        {"name": "Wifi", "icon": "wifi"},
        {"name": "Kitchen", "icon": "soup_kitchen"},
        {"name": "Pool", "icon": "pool"},
        {"name": "Air conditioning", "icon": "ac_unit"},
        {"name": "Free parking", "icon": "local_parking"},
        {"name": "Hot tub", "icon": "hot_tub"},
        {"name": "Dedicated workspace", "icon": "laptop"},
        {"name": "EV charger", "icon": "ev_station"},
        {"name": "Patio or balcony", "icon": "balcony"},
        {"name": "Waterfront", "icon": "water"},
        {"name": "Gym", "icon": "fitness_center"},
        {"name": "BBQ grill", "icon": "outdoor_grill"},
    ]

    amenities = []
    for a in amenities_data:
        amenity = Amenity(**a)
        db.add(amenity)
        amenities.append(amenity)
    db.flush()

    # Image URL collections for rotation
    images_pool = {
        "beachfront": [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
            "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200",
        ],
        "cabins": [
            "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200",
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200",
        ],
        "mansions": [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
        ],
        "trending": [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
        ],
        "amazing_views": [
            "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
        ],
        "tiny_homes": [
            "https://images.unsplash.com/photo-1527030280862-64139fba04bc?w=1200",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200",
            "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200",
        ],
        "lakefront": [
            "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200",
            "https://images.unsplash.com/photo-1476514525535-ce74f45814ce?w=1200",
        ],
        "countryside": [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
            "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
        ],
        "design": [
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200",
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200",
        ],
        "tropical": [
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200",
        ],
        "icons": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200",
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200",
        ],
        "rooms": [
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200",
            "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
        ],
    }

    # 3. Create 25 Listings
    raw_listings = [
        # Malibu (Beachfront, Mansions, Amazing views)
        {"title": "Glass Villa Overlooking Malibu Coast", "property_type": "villa", "category": "beachfront", "city": "Malibu", "country": "United States", "lat": 34.0259, "lng": -118.7798, "price": 850.0, "cleaning": 150.0, "guests": 8, "beds": 4, "bedrooms": 4, "baths": 4, "desc": "Stunning oceanfront villa with panoramic glass walls, private Infinity pool, and private beach access."},
        {"title": "Oceanfront Modern Beach House", "property_type": "house", "category": "beachfront", "city": "Malibu", "country": "United States", "lat": 34.0300, "lng": -118.7500, "price": 620.0, "cleaning": 120.0, "guests": 6, "beds": 3, "bedrooms": 3, "baths": 3, "desc": "Step right onto the sand from your private deck. High-end modern furnishings and sunset views."},
        {"title": "Cliffside Architectural Sanctuary", "property_type": "villa", "category": "mansions", "city": "Malibu", "country": "United States", "lat": 34.0400, "lng": -118.7800, "price": 1200.0, "cleaning": 250.0, "guests": 10, "beds": 5, "bedrooms": 5, "baths": 6, "desc": "Award-winning cliffside mansion with heated pool, private gym, and wine cellar."},
        {"title": "Cozy Malibu Canyon Tiny Haven", "property_type": "tiny_home", "category": "tiny_homes", "city": "Malibu", "country": "United States", "lat": 34.0800, "lng": -118.7000, "price": 195.0, "cleaning": 50.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Secluded tiny home nested in Malibu Canyon with an outdoor cedar tub and starlight ocean breeze."},

        # Paris (Design, Rooms, Trending, Icons)
        {"title": "Eiffel Tower View Designer Apartment", "property_type": "apartment", "category": "design", "city": "Paris", "country": "France", "lat": 48.8584, "lng": 2.2945, "price": 420.0, "cleaning": 80.0, "guests": 4, "beds": 2, "bedrooms": 2, "baths": 2, "desc": "Haussmann-style luxury apartment featuring direct balconies with iconic Eiffel Tower views."},
        {"title": "Charming Le Marais Loft Studio", "property_type": "apartment", "category": "trending", "city": "Paris", "country": "France", "lat": 48.8566, "lng": 2.3522, "price": 210.0, "cleaning": 50.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Exposed wooden beams and historic Parisian charm in the bustling heart of Le Marais."},
        {"title": "Artist Studio Suite in Montmartre", "property_type": "room", "category": "rooms", "city": "Paris", "country": "France", "lat": 48.8867, "lng": 2.3431, "price": 140.0, "cleaning": 40.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Sun-drenched private artist room next to Sacré-Cœur with vintage French art ambiance."},
        {"title": "Penthouse Palace by Champs-Élysées", "property_type": "apartment", "category": "icons", "city": "Paris", "country": "France", "lat": 48.8698, "lng": 2.3075, "price": 950.0, "cleaning": 200.0, "guests": 6, "beds": 3, "bedrooms": 3, "baths": 3, "desc": "Ultra-exclusive top-floor penthouse with private rooftop garden overlooking all of Paris."},

        # Kyoto (Countryside, Design, Rooms, Trending)
        {"title": "Traditional Machiya Townhouse with Garden", "property_type": "house", "category": "countryside", "city": "Kyoto", "country": "Japan", "lat": 35.0116, "lng": 135.7681, "price": 310.0, "cleaning": 70.0, "guests": 5, "beds": 4, "bedrooms": 2, "baths": 1, "desc": "Restored 100-year-old wooden Machiya townhouse featuring a serene zen garden and tatami rooms."},
        {"title": "Bamboo Forest Eco Retreat", "property_type": "cabin", "category": "cabins", "city": "Kyoto", "country": "Japan", "lat": 35.0170, "lng": 135.6710, "price": 280.0, "cleaning": 60.0, "guests": 3, "beds": 2, "bedrooms": 1, "baths": 1, "desc": "Nestled near Arashiyama, peaceful modern wooden cabin surrounded by whispering bamboo."},
        {"title": "Kyoto Riverfront Zen Suite", "property_type": "apartment", "category": "lakefront", "city": "Kyoto", "country": "Japan", "lat": 35.0037, "lng": 135.7722, "price": 240.0, "cleaning": 50.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Minimalist Japanese apartment right on Kamogawa river bank with private tea ceremony nook."},
        {"title": "Traditional Tatami Room in Historic Temple District", "property_type": "room", "category": "rooms", "city": "Kyoto", "country": "Japan", "lat": 34.9949, "lng": 135.7828, "price": 110.0, "cleaning": 30.0, "guests": 2, "beds": 2, "bedrooms": 1, "baths": 1, "desc": "Authentic private room with futon bedding near Kiyomizu-dera temple."},

        # Aspen (Cabins, Mansions, Amazing views)
        {"title": "Alpine Ski-in Ski-out Chalet", "property_type": "cabin", "category": "cabins", "city": "Aspen", "country": "United States", "lat": 39.1911, "lng": -106.8175, "price": 750.0, "cleaning": 180.0, "guests": 8, "beds": 5, "bedrooms": 4, "baths": 4, "desc": "Luxurious timber chalet with stone fireplace, private outdoor hot tub, and ski slope access."},
        {"title": "Snowmass Luxury Mountain Estate", "property_type": "villa", "category": "mansions", "city": "Aspen", "country": "United States", "lat": 39.2130, "lng": -106.9478, "price": 1600.0, "cleaning": 300.0, "guests": 12, "beds": 7, "bedrooms": 6, "baths": 7, "desc": "Grand mountain estate with heated driveways, outdoor fire pits, sauna, and mountain vistas."},
        {"title": "High Altitude Glass Cabin", "property_type": "cabin", "category": "amazing_views", "city": "Aspen", "country": "United States", "lat": 39.1800, "lng": -106.8300, "price": 490.0, "cleaning": 100.0, "guests": 4, "beds": 2, "bedrooms": 2, "baths": 2, "desc": "Floor-to-ceiling glass cabin perched high above Aspen valley offering unmatched sunset views."},

        # Santorini (Tropical, Amazing views, Beachfront, Icons)
        {"title": "Cave Villa with Caldera Sunset Pool", "property_type": "villa", "category": "tropical", "city": "Santorini", "country": "Greece", "lat": 36.4618, "lng": 25.3753, "price": 680.0, "cleaning": 110.0, "guests": 4, "beds": 2, "bedrooms": 2, "baths": 2, "desc": "Whitewashed luxury cave villa in Oia featuring a heated cliffside private infinity plunge pool."},
        {"title": "Oia White Cliff Suite", "property_type": "apartment", "category": "amazing_views", "city": "Santorini", "country": "Greece", "lat": 36.4630, "lng": 25.3760, "price": 450.0, "cleaning": 90.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Traditional Cycladic cave apartment with expansive private terrace overlooking the Aegean sea."},
        {"title": "Akrotiri Black Sand Beach House", "property_type": "house", "category": "beachfront", "city": "Santorini", "country": "Greece", "lat": 36.3570, "lng": 25.4020, "price": 380.0, "cleaning": 80.0, "guests": 6, "beds": 3, "bedrooms": 3, "baths": 2, "desc": "Steps away from Santorini's famous volcanic black beach, quiet family sanctuary."},
        {"title": "Iconic Blue Dome Villa", "property_type": "villa", "category": "icons", "city": "Santorini", "country": "Greece", "lat": 36.4625, "lng": 25.3750, "price": 890.0, "cleaning": 150.0, "guests": 5, "beds": 3, "bedrooms": 2, "baths": 2, "desc": "The quintessential Aegean postcard destination directly adjacent to Oia's blue domes."},

        # Cape Town (Lakefront, Countryside, Design, Beachfront)
        {"title": "Camps Bay Oceanfront Residence", "property_type": "villa", "category": "beachfront", "city": "Cape Town", "country": "South Africa", "lat": -33.9513, "lng": 18.3773, "price": 530.0, "cleaning": 100.0, "guests": 8, "beds": 4, "bedrooms": 4, "baths": 4, "desc": "Architect-designed coastal villa situated under Twelve Apostles peaks with Twelve Apostles & sea views."},
        {"title": "Table Mountain Modern Loft", "property_type": "apartment", "category": "design", "city": "Cape Town", "country": "South Africa", "lat": -33.9249, "lng": 18.4241, "price": 220.0, "cleaning": 45.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Sleek industrial design loft with unobstructed panoramic views of Table Mountain."},
        {"title": "Constantia Winelands Manor", "property_type": "house", "category": "countryside", "city": "Cape Town", "country": "South Africa", "lat": -34.0286, "lng": 18.4239, "price": 640.0, "cleaning": 130.0, "guests": 10, "beds": 5, "bedrooms": 5, "baths": 5, "desc": "Sprawling estate nestled among historic vineyards with manicured gardens and swimming pool."},
        {"title": "Clifton Beachfront Penthouse", "property_type": "apartment", "category": "lakefront", "city": "Cape Town", "country": "South Africa", "lat": -33.9380, "lng": 18.3750, "price": 780.0, "cleaning": 140.0, "guests": 4, "beds": 2, "bedrooms": 2, "baths": 2, "desc": "Overlooking Clifton 4th Beach with private elevator access and rim-flow balcony pool."},
        {"title": "Kirstenbosch Eco Cottage", "property_type": "tiny_home", "category": "tiny_homes", "city": "Cape Town", "country": "South Africa", "lat": -33.9870, "lng": 18.4320, "price": 160.0, "cleaning": 35.0, "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Solar-powered off-grid cottage on the border of Kirstenbosch Botanical Gardens."},
        {"title": "V&A Waterfront Luxury Suite", "property_type": "apartment", "category": "trending", "city": "Cape Town", "country": "South Africa", "lat": -33.9060, "lng": 18.4210, "price": 310.0, "cleaning": 65.0, "guests": 3, "beds": 2, "bedrooms": 1, "baths": 1, "desc": "Harbor-facing stylish condo right inside Cape Town's vibrant marina district."},
        
        # Lucknow (Trending, Mansions, Design)
        {"title": "Nawabi Heritage Haveli", "property_type": "house", "category": "mansions", "city": "Lucknow", "country": "India", "lat": 26.8467, "lng": 80.9462, "price": 12500.0, "cleaning": 1000.0, "currency": "INR", "guests": 6, "beds": 3, "bedrooms": 3, "baths": 3, "desc": "Authentic 19th century Awadhi mansion restored with modern luxury and an expansive courtyard."},
        {"title": "Gomti River View Apartment", "property_type": "apartment", "category": "amazing_views", "city": "Lucknow", "country": "India", "lat": 26.8500, "lng": 80.9499, "price": 4500.0, "cleaning": 500.0, "currency": "INR", "guests": 3, "beds": 2, "bedrooms": 1, "baths": 1, "desc": "Contemporary high-rise living with sweeping views of the Gomti river front."},
        {"title": "Hazratganj Boutique Studio", "property_type": "apartment", "category": "design", "city": "Lucknow", "country": "India", "lat": 26.8480, "lng": 80.9430, "price": 3500.0, "cleaning": 400.0, "currency": "INR", "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Right in the heart of shopping and food. A minimalist studio with chic interiors."},
        {"title": "Luxury Villa in Indira Nagar", "property_type": "villa", "category": "mansions", "city": "Lucknow", "country": "India", "lat": 26.8833, "lng": 80.9833, "price": 15000.0, "cleaning": 1200.0, "currency": "INR", "guests": 8, "beds": 4, "bedrooms": 4, "baths": 4, "desc": "Expansive contemporary villa featuring a private pool and home theater system."},
        {"title": "Chowk Historic Artist Room", "property_type": "room", "category": "rooms", "city": "Lucknow", "country": "India", "lat": 26.8670, "lng": 80.9160, "price": 2000.0, "cleaning": 300.0, "currency": "INR", "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Immerse yourself in the old city culture with this vibrant private room decorated in Chikankari themes."},

        # Gurgaon (Design, Trending, Mansions)
        {"title": "Cyber City Executive Penthouse", "property_type": "apartment", "category": "design", "city": "Gurgaon", "country": "India", "lat": 28.4900, "lng": 77.0900, "price": 8500.0, "cleaning": 800.0, "currency": "INR", "guests": 4, "beds": 2, "bedrooms": 2, "baths": 2, "desc": "Sleek and modern penthouse perfect for business travelers, right next to Cyber Hub."},
        {"title": "Golf Course Road Luxury Condo", "property_type": "apartment", "category": "trending", "city": "Gurgaon", "country": "India", "lat": 28.4480, "lng": 77.0980, "price": 9500.0, "cleaning": 900.0, "currency": "INR", "guests": 5, "beds": 3, "bedrooms": 2, "baths": 2, "desc": "High-end condominium with access to premium club facilities and overlooking the golf course."},
        {"title": "Aravalli Retreat Farmhouse", "property_type": "house", "category": "countryside", "city": "Gurgaon", "country": "India", "lat": 28.3500, "lng": 77.0500, "price": 18000.0, "cleaning": 1500.0, "currency": "INR", "guests": 10, "beds": 5, "bedrooms": 4, "baths": 4, "desc": "Escape the city into this lush green farmhouse near the Aravalli hills with a huge private lawn."},
        {"title": "DLF Phase 2 Cozy Studio", "property_type": "apartment", "category": "rooms", "city": "Gurgaon", "country": "India", "lat": 28.4800, "lng": 77.0900, "price": 4000.0, "cleaning": 400.0, "currency": "INR", "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Conveniently located chic studio apartment with high-speed internet and smart home features."},
        {"title": "Sushant Lok Family Villa", "property_type": "villa", "category": "mansions", "city": "Gurgaon", "country": "India", "lat": 28.4550, "lng": 77.0750, "price": 14000.0, "cleaning": 1200.0, "currency": "INR", "guests": 8, "beds": 4, "bedrooms": 3, "baths": 3, "desc": "Spacious three-story villa with a rooftop terrace, perfect for large families or groups."},

        # Goa (Beachfront, Tropical, Cabins)
        {"title": "Anjuna Cliffside Portuguese Villa", "property_type": "villa", "category": "tropical", "city": "Goa", "country": "India", "lat": 15.5833, "lng": 73.7333, "price": 16000.0, "cleaning": 1500.0, "currency": "INR", "guests": 8, "beds": 4, "bedrooms": 4, "baths": 4, "desc": "Restored 100-year-old Portuguese villa featuring antique furniture, lush gardens, and a private pool."},
        {"title": "Palolem Beachfront Bamboo Hut", "property_type": "cabin", "category": "beachfront", "city": "Goa", "country": "India", "lat": 15.0100, "lng": 74.0230, "price": 5500.0, "cleaning": 500.0, "currency": "INR", "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Step straight out of bed and onto the white sands of Palolem beach in this eco-friendly bamboo hut."},
        {"title": "Vagator Modern Sea View Condo", "property_type": "apartment", "category": "amazing_views", "city": "Goa", "country": "India", "lat": 15.6000, "lng": 73.7330, "price": 7500.0, "cleaning": 800.0, "currency": "INR", "guests": 4, "beds": 2, "bedrooms": 2, "baths": 2, "desc": "Uninterrupted Arabian Sea views from the infinity balcony of this luxurious modern condo."},
        {"title": "Assagao Design Studio", "property_type": "apartment", "category": "design", "city": "Goa", "country": "India", "lat": 15.5900, "lng": 73.7900, "price": 6000.0, "cleaning": 600.0, "currency": "INR", "guests": 3, "beds": 2, "bedrooms": 1, "baths": 1, "desc": "Hip, artsy studio hidden in the quiet, upscale village of Assagao among trendy cafes."},
        {"title": "Morjim Riverside Wooden Cabin", "property_type": "cabin", "category": "cabins", "city": "Goa", "country": "India", "lat": 15.6200, "lng": 73.7400, "price": 4800.0, "cleaning": 500.0, "currency": "INR", "guests": 2, "beds": 1, "bedrooms": 1, "baths": 1, "desc": "Secluded wooden cabin located on the banks of the Chapora river, surrounded by mangroves."},
    ]

    listings = []
    for idx, raw in enumerate(raw_listings):
        host = hosts[idx % len(hosts)]
        cat = raw["category"]
        pool = images_pool.get(cat, images_pool["trending"])

        listing = Listing(
            host_id=host.id,
            title=raw["title"],
            description=raw["desc"],
            property_type=raw["property_type"],
            category=raw["category"],
            city=raw["city"],
            country=raw["country"],
            lat=raw["lat"],
            lng=raw["lng"],
            price_per_night=raw["price"],
            cleaning_fee=raw["cleaning"],
            currency=raw.get("currency", "USD"),
            max_guests=raw["guests"],
            bedrooms=raw["bedrooms"],
            beds=raw["beds"],
            bathrooms=raw["baths"],
        )
        db.add(listing)
        db.flush()

        # Add 3-4 images
        num_imgs = min(len(pool), random.randint(3, 4))
        for pos in range(num_imgs):
            img_url = pool[pos]
            db.add(ListingImage(listing_id=listing.id, url=img_url, position=pos))

        # Assign 4-7 amenities
        assigned_amenities = random.sample(amenities, k=random.randint(4, 7))
        listing.amenities = assigned_amenities
        listings.append(listing)

    db.flush()

    # 4. Create Bookings & Reviews
    # A mix of past bookings (with reviews) and future bookings (for calendar availability)
    today = date.today()

    review_comments = [
        "Absolutely breathtaking stay! The host was super accommodating and responsive.",
        "Clean, cozy, and perfectly located. Would definitely recommend to anyone visiting!",
        "Exceeded all expectations. The photos don't even do justice to the views.",
        "Very nice property. Great amenities and seamless check-in experience.",
        "Wonderful weekend getaway. Quiet, comfortable beds, and amazing atmosphere.",
    ]

    for idx, l in enumerate(listings):
        # 2 past bookings per listing
        for past_i in range(1, 3):
            guest = guests[(idx + past_i) % len(guests)]
            check_in = today - timedelta(days=30 * past_i + random.randint(1, 10))
            check_out = check_in + timedelta(days=random.randint(2, 5))

            price_info = compute_price(l.price_per_night, l.cleaning_fee, check_in, check_out)

            booking = Booking(
                listing_id=l.id,
                guest_id=guest.id,
                check_in=check_in,
                check_out=check_out,
                guests=min(2, l.max_guests),
                nightly_price=price_info["nightly_price"],
                nights=price_info["nights"],
                cleaning_fee=price_info["cleaning_fee"],
                service_fee=price_info["service_fee"],
                total_price=price_info["total"],
                status="confirmed",
                created_at=datetime.now(timezone.utc) - timedelta(days=40 * past_i),
            )
            db.add(booking)
            db.flush()

            # Add review tied to this booking
            review = Review(
                listing_id=l.id,
                author_id=guest.id,
                booking_id=booking.id,
                rating=random.choice([4, 5, 5, 5]),  # Mostly 4-5 stars
                comment=random.choice(review_comments),
                created_at=datetime.now(timezone.utc) - timedelta(days=25 * past_i),
            )
            db.add(review)

        # 1 future booking for some listings (blocked dates demo)
        if idx % 2 == 0:
            guest = guests[idx % len(guests)]
            check_in = today + timedelta(days=15 + (idx * 2))
            check_out = check_in + timedelta(days=4)
            price_info = compute_price(l.price_per_night, l.cleaning_fee, check_in, check_out)

            future_booking = Booking(
                listing_id=l.id,
                guest_id=guest.id,
                check_in=check_in,
                check_out=check_out,
                guests=2,
                nightly_price=price_info["nightly_price"],
                nights=price_info["nights"],
                cleaning_fee=price_info["cleaning_fee"],
                service_fee=price_info["service_fee"],
                total_price=price_info["total"],
                status="confirmed",
            )
            db.add(future_booking)

    # 5. DEMO SCENARIO explicit additions
    # Demo scenario: Listing #1 booked for next weekend by Guest 1
    next_saturday = today + timedelta(days=(5 - today.weekday()) % 7 + 7)
    next_monday = next_saturday + timedelta(days=2)
    demo_listing = listings[0]
    demo_guest = guests[0]

    demo_price = compute_price(demo_listing.price_per_night, demo_listing.cleaning_fee, next_saturday, next_monday)
    demo_booking = Booking(
        listing_id=demo_listing.id,
        guest_id=demo_guest.id,
        check_in=next_saturday,
        check_out=next_monday,
        guests=2,
        nightly_price=demo_price["nightly_price"],
        nights=demo_price["nights"],
        cleaning_fee=demo_price["cleaning_fee"],
        service_fee=demo_price["service_fee"],
        total_price=demo_price["total"],
        status="confirmed",
    )
    db.add(demo_booking)

    # Wishlist pre-added items for Guest 1 (Alice)
    for wish_listing in listings[:3]:
        db.add(Wishlist(user_id=demo_guest.id, listing_id=wish_listing.id))

    db.commit()
    print("Database successfully seeded with 25 listings, users, bookings, reviews, and wishlist!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Create all tables first if not present
        Base.metadata.create_all(bind=engine)
        seed_database(db)
    finally:
        db.close()
