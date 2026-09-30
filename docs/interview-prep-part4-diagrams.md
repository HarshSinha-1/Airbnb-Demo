# System Diagrams

This document contains visual diagrams rendering the system architecture, database domain models, and deployment infrastructure of the application. All diagrams use native **Mermaid** syntax and reflect exact file names, model attributes, and deployment targets from the codebase.

---

## 1. System Component Diagram

```mermaid
graph TB
    subgraph Client_Browser ["User Web Browser"]
        UI_Components["React Components & UI Pages<br/>(Search, Listing Detail, Checkout, Trips, Host)"]
        Context_State["Global Contexts<br/>(UserContext, WishlistContext, ToastContext)"]
        API_Client["API Client Module<br/>(frontend/lib/api.ts)"]

        UI_Components --> Context_State
        UI_Components --> API_Client
    end

    subgraph Vercel_Platform ["Vercel Serverless Hosting Boundary"]
        Next_Server["Next.js App Router Runtime<br/>(Static Assets & SSR HTML)"]
    end

    subgraph Azure_VM ["Azure Linux Virtual Machine Boundary (20.2.88.158 / airbnb.sslip.io)"]
        Nginx["Nginx Web Server / Reverse Proxy<br/>(HTTPS / SSL Termination via Certbot)"]

        subgraph Systemd_Process ["Systemd Application Service"]
            Uvicorn["Uvicorn ASGI Server / Gunicorn"]

            subgraph FastAPI_App ["FastAPI Web Framework"]
                subgraph Routers_Layer ["Routers (app/routers/)"]
                    R_Listings["listings.py"]
                    R_Bookings["bookings.py"]
                    R_Reviews["reviews.py"]
                    R_Wishlists["wishlist.py"]
                    R_Users["users.py"]
                end

                subgraph Services_Layer ["Services (app/services/)"]
                    S_Listings["listing_service.py"]
                    S_Bookings["booking_service.py"]
                    S_Pricing["pricing.py"]
                end

                subgraph Models_Layer ["ORM Models (app/models/)"]
                    M_Entities["User, Listing, Booking,<br/>Review, Wishlist, Amenity"]
                end
            end
        end

        SQLite_DB[("SQLite Database<br/>(backend/app.db / Auto-seeded)")]
    end

    Client_Browser -- "1. Fetches HTML/JS Bundles" --> Next_Server
    API_Client -- "2. HTTPS REST Requests (X-User-Id Header)" --> Nginx
    Nginx -- "3. Proxy Pass (unix socket / localhost:8000)" --> Uvicorn
    Uvicorn --> Routers_Layer
    Routers_Layer --> Services_Layer
    Services_Layer --> Models_Layer
    Models_Layer -- "4. SQLAlchemy ORM SQL Queries" --> SQLite_DB
```

### Explanation & Key Talking Points
- **What it shows**: The end-to-end multi-tier interaction flow from the user's browser, through the Next.js frontend hosted on Vercel, across the network security boundary into the Azure VM, down to the SQLite database.
- **Why it's structured this way**: The design strictly decouples client UI state from backend business logic. The API client in `frontend/lib/api.ts` acts as the single gateway for all HTTP communications, ensuring authorization headers (`X-User-Id`) and error unwrapping are handled consistently. The backend enforces a clean 3-layer architecture (Routers $\rightarrow$ Services $\rightarrow$ Models) inside an isolated Systemd/Uvicorn process managed behind Nginx.

---

## 2. Class Diagram (Backend SQLAlchemy Domain Models)

```mermaid
classDiagram
    class User {
        +int id PK
        +str name
        +str email
        +str avatar_url
        +bool is_host
        +bool is_superhost
        +datetime created_at
    }

    class Listing {
        +int id PK
        +int host_id FK
        +str title
        +str description
        +str property_type
        +str category
        +str city
        +str country
        +float lat
        +float lng
        +float price_per_night
        +float cleaning_fee
        +str currency
        +int max_guests
        +int bedrooms
        +int beds
        +int bathrooms
    }

    class ListingImage {
        +int id PK
        +int listing_id FK
        +str url
        +int position
    }

    class Amenity {
        +int id PK
        +str name
        +str icon
    }

    class ListingAmenities {
        <<association table>>
        +int listing_id PK, FK
        +int amenity_id PK, FK
    }

    class Booking {
        +int id PK
        +int listing_id FK
        +int guest_id FK
        +date check_in
        +date check_out
        +int guests
        +float nightly_price
        +int nights
        +float cleaning_fee
        +float service_fee
        +float total_price
        +str currency
        +str status
        +datetime created_at
    }

    class Review {
        +int id PK
        +int listing_id FK
        +int author_id FK
        +int booking_id FK
        +int rating
        +str comment
        +datetime created_at
    }

    class Wishlist {
        +int user_id PK, FK
        +int listing_id PK, FK
        +datetime created_at
    }

    User "1" <-- "0..*" Listing : host_id (hosts)
    User "1" <-- "0..*" Booking : guest_id (books)
    User "1" <-- "0..*" Review : author_id (writes)
    Listing "1" <-- "0..*" ListingImage : listing_id (ordered photos)
    Listing "0..*" <--> "0..*" Amenity : listing_amenities (M2M)
    Listing "1" <-- "0..*" Booking : listing_id (reserved)
    Listing "1" <-- "0..*" Review : listing_id (reviewed)
    User "1" <-- "0..*" Wishlist : user_id (saves)
    Listing "1" <-- "0..*" Wishlist : listing_id (saved in)
    Booking "1" <-- "0..1" Review : booking_id (verified stay)
```

### Explanation & Key Talking Points
- **What it shows**: The relational schema design of the database models implemented in SQLAlchemy (`backend/app/models/`).
- **Why it's structured this way**: 
  - **`User` Unified Entity**: Hosting is represented as a boolean role flag (`is_host`), enabling any registered user to switch between booking properties and hosting without separate accounts.
  - **Price Snapshotting on `Booking`**: Financial attributes (`nightly_price`, `cleaning_fee`, `service_fee`, `total_price`) are stored directly on the `Booking` record to ensure immutable receipt history.
  - **Composite Keys & Integrity Constraints**: `Wishlist` uses a composite primary key `(user_id, listing_id)` preventing duplicate saves, while `Review.booking_id` has a `UNIQUE` constraint ensuring guests can only submit one verified review per stay.

---

## 3. Deployment Pipeline & Infrastructure Diagram

```mermaid
graph LR
    subgraph Repository ["GitHub Code Repository"]
        Code_Root["d:\Projects\AirBnB"]
        FE_Dir["frontend/ (Next.js Project)"]
        BE_Dir["backend/ (FastAPI Project)"]
    end

    subgraph Vercel_Cloud ["Vercel Edge Network"]
        Vercel_Build["Vercel Auto-Builder<br/>(Triggered on push to main)"]
        FE_Deployment["Production Frontend Host<br/>https://airbnb-demo.vercel.app"]

        Vercel_Build --> FE_Deployment
    end

    subgraph Azure_Cloud ["Azure Cloud Infrastructure"]
        subgraph Linux_VM ["Ubuntu Virtual Machine (20.2.88.158)"]
            Certbot["Certbot / Let's Encrypt<br/>(Auto-renews SSL Certificate)"]
            DNS_Resolver["sslip.io Wildcard DNS<br/>(20-2-88-158.sslip.io -> 20.2.88.158)"]

            Nginx_Proxy["Nginx Web Server<br/>Port 80 (HTTP) -> 443 (HTTPS)"]
            Systemd_Daemon["Systemd Manager<br/>(airbnb-backend.service)"]
            FastAPI_Server["Uvicorn / FastAPI Backend<br/>(Listening on 127.0.0.1:8000)"]
            DB_File[("SQLite database<br/>backend/app.db")]

            Certbot --> Nginx_Proxy
            DNS_Resolver --> Nginx_Proxy
            Nginx_Proxy -- "Reverse Proxy" --> FastAPI_Server
            Systemd_Daemon -- "Auto-restart / Lifecycle" --> FastAPI_Server
            FastAPI_Server --> DB_File
        end
    end

    subgraph Client_Consumer ["End User Browser"]
        User_Session["Browser Client Session"]
    end

    Code_Root -- "1. Git Push frontend/" --> Vercel_Cloud
    Code_Root -- "2. Git Pull / SSH Deploy backend/" --> Linux_VM

    User_Session -- "3. Load UI Pages (HTTPS)" --> FE_Deployment
    User_Session -- "4. Send API Requests (HTTPS REST)<br/>Header: X-User-Id" --> Nginx_Proxy

    FE_Deployment -. "CORS Allowed Origin" .-> Nginx_Proxy
```

### Explanation & Key Talking Points
- **What it shows**: The dual-cloud deployment setup showing how the codebase is separated into two automated deployment pipelines: Next.js on Vercel and FastAPI on an Azure Linux VM.
- **Why it's structured this way**: Decoupling the frontend to Vercel provides global CDN edge delivery and instant static rendering. The Azure backend runs inside a secure Linux environment managed by Systemd to guarantee process recovery on failure. Nginx handles SSL termination via Let's Encrypt / `sslip.io` wildcard DNS, resolving mixed-content browser restrictions (`CORS_ORIGINS`) between the HTTPS Vercel domain and the Azure backend.
