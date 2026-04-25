import asyncio
import hashlib
from playwright.async_api import async_playwright
import firebase_admin
from firebase_admin import credentials, firestore

# 1. Setup Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 2. Site Blueprints (Targeting your specific categories)
SOURCES = [
    {"url": "https://www.myunidays.com/US/en-US/categories/beauty", "cat": "beauty", "selector": ".list-item"},
    {"url": "https://thekrazycouponlady.com/coupons/food", "cat": "food", "selector": ".list-item"},
    {"url": "https://www.studentbeans.com/us", "cat": "tech", "selector": "[data-testid='offer-card']"},
    {"url": "https://www.timeout.com/newyork/restaurants/best-cheap-eats-in-nyc", "cat": "food", "selector": "article"},
    {"url": "https://www.campusclipper.com/", "cat": "study", "selector": ".coupon-item"},
    {"url": "https://pulsd.com/new-york/map", "cat": "events", "selector": ".experience-card"},
    {"url": "https://shop.id.me/student", "cat": "fashion", "selector": ".store-card"}
]

async def run_scraper():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for source in SOURCES:
            print(f"🔍 Scraping {source['url']}...")
            try:
                await page.goto(source['url'], timeout=60000)
                # Wait for content to load
                await page.wait_for_timeout(3000)

                # Get all links/titles (General extraction logic)
                items = await page.query_selector_all(source['selector'])

                for item in items[:10]: # Limit to top 10 per site for speed
                    text = await item.inner_text()
                    lines = text.split('\n')
                    title = lines[0] if lines else "Student Deal"

                    # Create a Unique ID based on title to prevent duplicates
                    deal_id = hashlib.md5(title.encode()).hexdigest()

                    deal_data = {
                        "header": title[:50],
                        "items": "Verified Student Discount",
                        "category": source['cat'],
                        # Random NYC Coords within your Map Bounds for demonstration
                        "lat": 40.7128 + (hash(title) % 100 / 2000),
                        "lng": -74.0060 + (hash(title) % 100 / 2000),
                        "url": source['url'],
                        "deal_id": deal_id
                    }

                    # Sync logic: Update if exists, otherwise create
                    db.collection("deals").document(deal_id).set(deal_data, merge=True)

                print(f"✅ Successfully synced {source['cat']} deals.")

            except Exception as e:
                print(f"⚠️ Could not scrape {source['url']}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_scraper())