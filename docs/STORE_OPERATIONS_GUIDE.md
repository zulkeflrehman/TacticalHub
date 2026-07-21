# TacticalHub Store Operations Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Audience:** Store Administrators and Operations Staff

---

## Table of Contents

1. [Customer Journey Overview](#customer-journey-overview)
2. [Administrator Daily Workflows](#administrator-daily-workflows)
3. [Order Management Procedures](#order-management-procedures)
4. [Phone Confirmation Best Practices](#phone-confirmation-best-practices)
5. [Courier Booking and Tracking](#courier-booking-and-tracking)
6. [Cancellation Procedures](#cancellation-procedures)
7. [Firestore Quota Monitoring](#firestore-quota-monitoring)
8. [Daily Administrator Checklist](#daily-administrator-checklist)
9. [Common Scenarios & Troubleshooting](#common-scenarios--troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## 1. Customer Journey Overview

### Step-by-Step Customer Flow

**1.1 Browse Products**
- Customer visits TacticalHub website
- Browses product catalog with filters and search
- Views product details, images, and specifications

**1.2 Add to Cart**
- Customer selects product variants (size, color)
- Adds items to shopping cart
- Can update quantities or remove items

**1.3 Checkout Process**
- Customer enters delivery information:
  - Full name
  - Phone number (03XX-XXXXXXX format)
  - Complete address (house, street, area, city)
  - Optional delivery instructions
- Reviews order summary with total price

**1.4 Order Placement**
- Customer submits order (Cash on Delivery)
- System generates unique Order ID
- Order status: **PENDING**
- Customer receives order confirmation on screen

**1.5 Administrator Processing**
- Administrator receives notification of new order
- Reviews order details
- Calls customer to confirm (see Section 4)
- Updates order status: **CONFIRMED**

**1.6 Courier Booking**
- Administrator books courier service
- Generates tracking number
- Updates order status: **SHIPPED**
- Enters tracking details in system

**1.7 Delivery**
- Courier delivers package
- Customer pays cash on delivery
- Order status: **DELIVERED**

**1.8 Post-Delivery**
- Administrator marks order as delivered
- Customer can provide feedback (future feature)

---

## 2. Administrator Daily Workflows

### Morning Routine (9:00 AM - 10:00 AM)

**Check New Orders**
```
1. Log in to Admin Dashboard
2. Navigate to Orders → Pending Orders
3. Review all orders from previous evening/night
4. Note urgent or high-value orders
```

**Verify Inventory**
```
1. Check Products → Inventory Levels
2. Identify low-stock items
3. Update product availability if needed
4. Disable out-of-stock products
```


### Midday Processing (10:00 AM - 2:00 PM)

**Phone Confirmations**
```
Priority order:
1. High-value orders (>5,000 PKR)
2. Orders with special instructions
3. New customers (first-time orders)
4. Remaining pending orders (oldest first)
```

**Order Processing**
- Confirm 15-20 orders per hour
- Update order status immediately after each call
- Prepare confirmed orders for courier booking
- Handle customer queries via phone

### Afternoon Dispatch (2:00 PM - 5:00 PM)

**Courier Coordination**
```
1. Group confirmed orders by city/area
2. Book courier pickups (see Section 5)
3. Prepare shipping labels and invoices
4. Update tracking information in system
5. Mark orders as SHIPPED
```

**Customer Updates**
- Send tracking numbers via SMS (manual or automated)
- Respond to customer inquiries
- Handle delivery reschedules

### Evening Wrap-Up (5:00 PM - 6:00 PM)

**Daily Summary**
- Review total orders processed
- Check pending confirmations
- Update delivery status from courier
- Plan next day's priorities

---

## 3. Order Management Procedures

### 3.1 Viewing Orders

**Access Order Dashboard**
```
Dashboard → Orders → All Orders
```

**Filter Options:**
- Status: Pending, Confirmed, Shipped, Delivered, Cancelled
- Date Range: Today, Last 7 Days, Custom Range
- City: Karachi, Lahore, Islamabad, etc.
- Payment Status: Pending, Completed


### 3.2 Order Status Definitions

| Status | Meaning | Who Sets It |
|--------|---------|-------------|
| PENDING | Order placed, awaiting confirmation | System (automatic) |
| CONFIRMED | Customer confirmed via phone | Administrator |
| PROCESSING | Order being prepared/packed | Administrator |
| SHIPPED | Handed to courier, tracking active | Administrator |
| DELIVERED | Successfully delivered, COD collected | Administrator |
| CANCELLED | Order cancelled (see Section 6) | Administrator / System |
| RETURNED | Customer returned the product | Administrator |

### 3.3 Updating Order Status

**Step-by-step:**
```
1. Open order by clicking Order ID
2. Review all order details carefully
3. Click "Update Status" button
4. Select new status from dropdown
5. Add note (required for CANCELLED, RETURNED)
6. Click "Save Changes"
```

**Example Order Details to Review:**

```
Order ID:     TH-2025-00847
Customer:     Muhammad Bilal
Phone:        0312-4567890
Address:      House 12, Street 4, Gulshan-e-Iqbal, Karachi
Items:        Tactical Vest (Black, L) x1 — Rs. 3,500
              Cap (Olive, Free Size) x2 — Rs. 800
Total:        Rs. 4,300 (COD)
Notes:        "Please call before delivery"
Placed:       21 Jan 2025, 11:34 PM
```

### 3.4 Adding Internal Notes

Use notes for any important information:
- Reason for delay
- Customer special requests
- Courier issues
- Partial shipment details

```
Order → Notes Tab → Add Note → Save
```

> **Note:** Internal notes are NOT visible to customers.

---

## 4. Phone Confirmation Best Practices

### 4.1 Why Phone Confirmation Matters

Pakistan's e-commerce market has a high rate of fake/test orders. Phone confirmation:
- Verifies the customer is real and reachable
- Confirms correct delivery address
- Reduces courier return rates
- Saves time and shipping costs


### 4.2 Confirmation Call Script

**Opening:**
```
"Assalam o Alaikum! Main TacticalHub se bol raha/rahi hoon. 
Kya ye [Customer Name] hain?"

(English: Hello! I'm calling from TacticalHub. 
Is this [Customer Name]?)
```

**Order Confirmation:**
```
"Aap ne hamare website par [Product Name] ka order place kiya tha.
Order ID: TH-2025-XXXXX
Total amount: Rs. [Amount] - Cash on Delivery
Kya aap ye order confirm karte hain?"

(You placed an order for [Product] on our website.
Order ID: TH-2025-XXXXX
Total: Rs. [Amount] - COD
Do you confirm this order?)
```

**Address Verification:**
```
"Kya aap ka address ye hai:
[Read address carefully]
Kya ye sahi hai?"

(Is your address:
[Read address]
Is this correct?)
```

**Delivery Timeline:**
```
"Aap ka order 2-3 din mein deliver ho jayega.
Courier se tracking number SMS kar diya jayega."

(Your order will be delivered in 2-3 days.
Tracking number will be sent via SMS.)
```

**Closing:**
```
"Shukriya! Koi aur sawal ho to call kar lein."

(Thank you! Call us if you have any questions.)
```

### 4.3 Handling Common Responses

**✅ Customer Confirms:**
```
Action: Update order status → CONFIRMED
Note: "Confirmed via phone on [Date] at [Time]"
Proceed: Book courier
```

**❌ Customer Denies Order:**
```
Action: Update order status → CANCELLED
Reason: "Customer denies placing order"
Note: Add details if customer provides explanation
```

**📞 No Answer / Not Reachable:**
```
Attempt 1: Try again after 1 hour
Attempt 2: Try again next morning
Attempt 3: If still no answer, mark CANCELLED
Note: "Unable to reach after 3 attempts"
```

**⏰ Customer Wants to Delay:**
```
Ask: "Kab delivery karu? (When should we deliver?)"
Note: Record preferred delivery date
Action: Keep status PENDING with note
Set reminder: Follow up on requested date
```


**🔄 Customer Wants Changes:**
```
Common changes:
- Different size/color: Check inventory, update order
- Different address: Update address in system
- Add more items: Create new order, combine shipping
- Reduce items: Update order, adjust total

Action: Update order with changes → Mark CONFIRMED
```

### 4.4 Red Flags & Suspicious Orders

**Cancel immediately if:**
- Customer says "I didn't order this"
- Phone number is switched off permanently
- Address is incomplete or fake (e.g., "Karachi only")
- Customer is rude or suspicious
- Order has multiple red flags below

**Investigate further if:**
- Multiple orders with same phone number
- High-value order from new customer
- Address is generic (e.g., no house number)
- Customer provides different phone number
- Unusual product combinations

**Verification tips:**
```
1. Search phone number in past orders
2. Check if address matches city code
3. Ask customer to describe product they ordered
4. Verify via WhatsApp if phone not answering
```

---

## 5. Courier Booking and Tracking

### 5.1 Popular Courier Services in Pakistan

| Courier | Best For | Coverage | Typical Cost | Tracking |
|---------|----------|----------|--------------|----------|
| **TCS** | Reliable, nationwide | All cities | Rs. 150-300 | Excellent |
| **Leopards** | Fast, major cities | Urban areas | Rs. 120-250 | Good |
| **M&P** | Budget-friendly | Major cities | Rs. 100-200 | Average |
| **BlueEx** | E-commerce focused | Nationwide | Rs. 130-280 | Excellent |
| **PostEx** | COD specialist | Major cities | Rs. 120-220 | Good |
| **Call Courier** | Local Karachi | Karachi only | Rs. 100-150 | Phone-based |


### 5.2 Booking Process

**Option A: Online Booking (Recommended)**
```
1. Log in to courier company portal
2. Create shipment with order details:
   - Consignee name, phone, address
   - Product description (generic: "Tactical Equipment")
   - Declared value (for insurance)
   - COD amount
3. Print shipping label
4. Schedule pickup or drop at courier office
5. Receive tracking number
6. Update TacticalHub order with tracking number
```

**Option B: Phone Booking**
```
1. Call courier company customer service
2. Provide shipment details verbally
3. Arrange pickup time
4. Prepare shipping label manually
5. Tracking number provided by courier after pickup
```

**Option C: Walk-in**
```
1. Visit nearest courier branch
2. Fill shipment form
3. Pay shipping charges
4. Get tracking number immediately
5. Update system
```

### 5.3 Preparing Shipments

**Packaging Checklist:**
- [ ] Product wrapped securely
- [ ] Fragile items bubble-wrapped
- [ ] Invoice/packing slip inside package
- [ ] Shipping label on outside
- [ ] "Fragile" sticker if needed
- [ ] Sealed with tape

**Invoice/Packing Slip Template:**
```
┌─────────────────────────────────────────┐
│ TACTICALHUB - Invoice                   │
│ www.tacticalhub.pk                      │
├─────────────────────────────────────────┤
│ Order ID:      TH-2025-00847            │
│ Date:          22 Jan 2025              │
│ Customer:      Muhammad Bilal           │
│ Phone:         0312-4567890             │
├─────────────────────────────────────────┤
│ ITEMS:                                  │
│ 1x Tactical Vest (Black, L)   3,500 Rs │
│ 2x Cap (Olive)                   800 Rs │
├─────────────────────────────────────────┤
│ Subtotal:                      4,300 Rs │
│ Shipping:                        200 Rs │
│ TOTAL (COD):                   4,500 Rs │
└─────────────────────────────────────────┘
```


### 5.4 Updating Tracking Information

**In TacticalHub Admin:**
```
1. Open order by ID
2. Click "Update Shipping Details"
3. Enter:
   - Courier Company (dropdown)
   - Tracking Number
   - Estimated Delivery Date
4. Save Changes
5. Order status automatically changes to SHIPPED
```

**Example Tracking Numbers:**
```
TCS:       TCS123456789
Leopards:  LCS-KHI-2025-12345
BlueEx:    BX987654321
M&P:       MP-4567890
```

### 5.5 Tracking Order Status

**Daily Tracking Routine:**
```
1. Export list of SHIPPED orders
2. Check courier websites for updates
3. Identify delivered orders
4. Update order status to DELIVERED
5. Note any issues (returned, delayed)
```

**Courier Tracking URLs:**
```
TCS:       https://www.tcsexpress.com/track
Leopards:  https://www.leopardscourier.com.pk/tracking
BlueEx:    https://www.blue-ex.com/tracking/
M&P:       https://www.mpexpress.com.pk/tracking
PostEx:    https://postex.pk/track
```

**Tracking Status Meanings:**

| Courier Status | Meaning | Action Required |
|----------------|---------|-----------------|
| Booked | Shipment registered | None, wait for pickup |
| In Transit | On the way to customer | Monitor progress |
| Out for Delivery | Courier is delivering today | None |
| Delivered | Successfully delivered | Update order to DELIVERED |
| Returned | Customer refused/unavailable | Contact customer, investigate |
| On Hold | Issue with shipment | Call courier to resolve |

---

## 6. Cancellation Procedures

### 6.1 When to Cancel Orders

**Valid Cancellation Reasons:**
- Customer requests cancellation
- Customer unreachable after 3 attempts
- Product out of stock
- Customer denies placing order
- Suspicious/fraudulent order
- Address incomplete or invalid
- Duplicate order


### 6.2 Cancellation Process

**Before Shipping:**
```
1. Open order
2. Update status to CANCELLED
3. Select cancellation reason (required)
4. Add detailed note explaining reason
5. Save changes
6. Inventory automatically restored
```

**After Shipping (Before Delivery):**
```
1. Contact courier immediately
2. Request shipment return to origin
3. Update order status to CANCELLED
4. Add note: "Cancelled after shipment - recalled"
5. Wait for courier return
6. Refund courier charges if applicable
```

**Cancellation Reason Categories:**

| Reason | Description | Inventory Impact |
|--------|-------------|------------------|
| Customer Request | Customer called to cancel | Restore inventory |
| Out of Stock | Product unavailable | No change |
| Unreachable | Cannot confirm via phone | Restore inventory |
| Invalid Address | Address incomplete/fake | Restore inventory |
| Duplicate Order | Customer ordered twice | Restore inventory |
| Fraud Suspected | Suspicious order patterns | Restore inventory |
| Payment Issue | COD concerns | Restore inventory |

### 6.3 Customer Communication

**Cancellation Notification (SMS Template):**
```
"TacticalHub: Your order #TH-2025-XXXXX has been cancelled.
Reason: [Brief reason]
For questions, call: 0300-1234567"
```

**If Customer Initiates Cancellation:**
```
Call Script:
"Ji bilkul, main aap ka order cancel kar deta/deti hoon.
Koi specific reason hai?
Agla order hoga to zaroor place karen!"

(Sure, I'll cancel your order.
Any specific reason?
Please order again next time!)
```

---

## 7. Firestore Quota Monitoring

### 7.1 Understanding Firestore Quotas

TacticalHub uses Google Firestore database with free tier limits:

**Daily Free Limits:**
- Read Operations: 50,000 per day
- Write Operations: 20,000 per day
- Delete Operations: 20,000 per day
- Storage: 1 GB

**Typical Usage (per 100 orders):**
- Reads: ~500-1,000 (order viewing, status checks)
- Writes: ~300-500 (order creation, updates)
- Deletes: ~10-50 (old data cleanup)


### 7.2 Monitoring Usage

**Access Firebase Console:**
```
1. Visit https://console.firebase.google.com
2. Select TacticalHub project
3. Navigate to Firestore Database
4. Click "Usage" tab
5. View daily read/write statistics
```

**Warning Signs:**
- Usage approaching 80% of daily limit
- Sudden spike in operations
- Repeated errors in application
- Slow page loading times

### 7.3 Optimizing Quota Usage

**Best Practices:**

✅ **DO:**
- Refresh order list only when needed
- Use filters instead of loading all orders
- Close unused browser tabs
- Log out when not actively working
- Use pagination (10-20 orders per page)

❌ **DON'T:**
- Keep admin dashboard open all day
- Refresh page excessively
- Export entire database frequently
- Run automated scripts without limits

**If Approaching Quota Limit:**
```
1. Stop non-essential operations
2. Notify technical team immediately
3. Prioritize critical orders only
4. Consider upgrading to paid tier if needed
```

### 7.4 Cost Estimation (if exceeding free tier)

**Paid Firestore Pricing:**
- Reads: $0.036 per 100,000 operations
- Writes: $0.108 per 100,000 operations
- Deletes: $0.012 per 100,000 operations

**Example Monthly Cost (1,000 orders):**
```
Reads (100,000):    $0.36
Writes (50,000):    $0.054
Total:              ~$0.50 USD (~130 PKR)
```

> **Note:** Monitor usage weekly. Contact technical team if consistent overages occur.

---

## 8. Daily Administrator Checklist

### Morning (Start of Shift)

```
⏰ 9:00 AM - 10:00 AM

□ Log in to Admin Dashboard
□ Check new PENDING orders (overnight)
□ Review Firestore quota usage
□ Check courier notifications (deliveries, returns)
□ Prioritize high-value orders for confirmation
□ Verify inventory for top-selling products
□ Respond to urgent customer queries
```


### Midday (Order Processing)

```
⏰ 10:00 AM - 2:00 PM

□ Call customers for order confirmations
□ Update order statuses (PENDING → CONFIRMED)
□ Handle customer inquiries via phone
□ Document any order changes or issues
□ Prepare confirmed orders for shipping
□ Update inventory if products sold out
□ Take lunch break (30 minutes)
```

### Afternoon (Dispatch)

```
⏰ 2:00 PM - 5:00 PM

□ Book courier services for confirmed orders
□ Print shipping labels and invoices
□ Pack and seal shipments
□ Update tracking numbers in system
□ Mark orders as SHIPPED
□ Coordinate courier pickups
□ Track ongoing deliveries
□ Update DELIVERED status for completed orders
```

### Evening (Wrap-Up)

```
⏰ 5:00 PM - 6:00 PM

□ Review day's performance metrics
   • Total orders received: ____
   • Orders confirmed: ____
   • Orders shipped: ____
   • Orders delivered: ____
   • Orders cancelled: ____

□ Check pending confirmations for tomorrow
□ Update any delayed shipments
□ Respond to remaining customer queries
□ Document any issues for technical team
□ Log out of all systems
```

### Weekly Tasks

```
📅 Every Monday:
□ Review previous week's performance
□ Identify best-selling products
□ Check inventory levels for restock
□ Analyze cancellation reasons

📅 Every Friday:
□ Export order reports for management
□ Review customer feedback/complaints
□ Update courier performance assessment
□ Plan next week's priorities
```

---

## 9. Common Scenarios & Troubleshooting

### Scenario 1: Customer Says Wrong Product Delivered

**Situation:** Customer calls saying they received different item.

**Steps:**
```
1. Verify order ID and items ordered
2. Ask customer to describe received product
3. Check if packing error on our end
4. Options:
   a) Arrange replacement shipment
   b) Arrange return & refund
   c) Customer keeps item with discount
5. Update order notes with resolution
6. Coordinate courier for return/exchange
```


### Scenario 2: Courier Returns Package (Customer Refused)

**Situation:** Courier returns shipment, customer not available or refused.

**Steps:**
```
1. Check tracking notes for return reason
2. Call customer to understand issue
3. Common reasons:
   a) Customer unavailable (reschedule delivery)
   b) Customer changed mind (cancel order)
   c) Product damaged (send replacement)
   d) Wrong product (arrange exchange)
4. Update order status accordingly
5. Refund or reschedule based on customer preference
6. Document in order notes
```

### Scenario 3: Customer Wants to Change Delivery Address

**Before Shipping:**
```
1. Confirm new address with customer
2. Update order in system
3. Verify new address is serviceable
4. Recalculate shipping cost if different city
5. Proceed with booking to new address
```

**After Shipping:**
```
1. Contact courier immediately
2. Check if address change is possible
3. Most couriers allow ONE address change
4. Some may charge Rs. 50-100 extra
5. Update system with new tracking/address
6. Inform customer of any additional charges
```

### Scenario 4: Multiple Orders from Same Customer

**Situation:** Customer placed multiple orders, wants to combine shipping.

**Steps:**
```
1. Verify all orders are from same phone number
2. Check if addresses match
3. Options:
   a) Cancel duplicate orders, adjust quantities in one order
   b) Ship separately if products different
   c) Combine if items compatible
4. Adjust shipping charges (charge once, not per order)
5. Update order notes with consolidation details
6. Confirm final amount with customer
```

### Scenario 5: System Not Loading / Slow Performance

**Troubleshooting:**
```
1. Check internet connection
2. Clear browser cache and cookies
3. Try different browser (Chrome recommended)
4. Check Firestore quota usage (Section 7)
5. Restart browser
6. If problem persists:
   • Document exact error message
   • Screenshot the issue
   • Contact technical support
   • Use mobile device as backup
```


### Scenario 6: Customer Demands Immediate Delivery

**Situation:** Customer wants same-day or next-day delivery.

**Response Script:**
```
"Ji, main samajh sakta/sakti hoon aap jaldi chahiye.
Standard delivery 2-3 din hai, lekin agar aap [City] mein hain,
hum express delivery arrange kar sakte hain.
Express charges: Rs. 300-500 extra
Kya aap express delivery chahte hain?"

(I understand you need it urgently.
Standard delivery is 2-3 days, but if you're in [City],
we can arrange express delivery.
Extra charges: Rs. 300-500
Would you like express delivery?)
```

**If City Allows Express:**
```
1. Confirm customer willing to pay extra
2. Contact express courier (TCS Express, Leopards Same Day)
3. Update order amount with express charges
4. Mark as priority in system
5. Arrange same-day pickup
```

### Scenario 7: Payment/COD Mismatch

**Situation:** Courier collected different amount than order total.

**Investigation:**
```
1. Check original order total
2. Verify courier invoice/receipt
3. Common causes:
   a) Shipping charges added
   b) Courier service charges
   c) Customer paid less (dispute)
   d) Courier error
4. Reconcile with courier company
5. Update payment records
6. Follow up with customer if underpaid
```

### Scenario 8: Product Damaged in Transit

**Situation:** Customer reports damaged product on delivery.

**Steps:**
```
1. Ask customer to send photos of damage
2. Verify product condition before shipping (our records)
3. File claim with courier company
4. Options for customer:
   a) Full replacement (we ship new one)
   b) Partial refund (if customer keeps item)
   c) Full refund + return
5. Document incident for courier claim
6. Update order with damage report
7. Improve packing procedures to prevent recurrence
```

---

## 10. Security Best Practices

### 10.1 Account Security

**Password Management:**
```
✅ DO:
• Use strong, unique passwords (min 12 characters)
• Mix uppercase, lowercase, numbers, symbols
• Change password every 90 days
• Use password manager

❌ DON'T:
• Share passwords with anyone
• Write passwords on paper/sticky notes
• Use same password for multiple accounts
• Use simple passwords (123456, admin, etc.)
```


**Login Procedures:**
```
1. Always verify you're on correct URL
   ✅ https://tacticalhub.pk/admin
   ❌ http://tacticalhub-login.xyz (fake)

2. Never log in from:
   • Public WiFi without VPN
   • Shared/internet cafe computers
   • Links in emails or messages

3. Always log out when:
   • Leaving workstation
   • End of shift
   • Switching users
```

### 10.2 Customer Data Protection

**Handling Sensitive Information:**

```
📱 Phone Numbers:
• Never share with third parties
• Don't save in personal contacts
• Don't use for personal purposes
• Delete from notes when not needed

📍 Addresses:
• Access only for order processing
• Don't share with unauthorized persons
• Don't screenshot or copy unnecessarily
• Secure physical printouts

💳 Payment Information:
• We use COD only (no card details stored)
• Never ask customers for bank details
• Report phishing attempts immediately
```

**GDPR/Privacy Compliance:**
```
• Only access customer data for legitimate business purposes
• Don't browse orders out of curiosity
• Report data breaches immediately
• Customers have right to data deletion (contact technical team)
```

### 10.3 Preventing Fraud

**Recognize Fraud Patterns:**

```
🚩 RED FLAGS:
□ Orders with multiple different phone numbers
□ Very high-value first-time orders
□ Multiple orders to same address, different names
□ Address is generic or incomplete
□ Customer insists on skipping verification
□ Orders placed with VPN/proxy (system flag)
□ Unusual order combinations (e.g., 10 identical items)
```

**Verification Steps:**
```
1. Check if phone number appears in multiple orders
2. Search address for previous orders
3. Verify address on Google Maps
4. Ask customer security questions:
   • "What product did you order?"
   • "What size/color did you select?"
5. Trust your instincts - cancel if suspicious
```

**Card Testing Fraud (Future Online Payments):**
```
If TacticalHub adds card payments:
• Watch for multiple small transactions
• Verify CVV for all transactions
• Enable 3D Secure authentication
• Set transaction limits
• Monitor for unusual patterns
```


### 10.4 Workstation Security

**Physical Security:**
```
□ Lock screen when leaving desk (Windows+L)
□ Position monitor away from public view
□ Don't leave printed orders unattended
□ Shred old order printouts
□ Secure office access (lock doors)
□ Keep backup devices in safe location
```

**Digital Security:**
```
□ Keep operating system updated
□ Use antivirus software
□ Don't install unauthorized software
□ Avoid clicking suspicious links/emails
□ Backup important data weekly
□ Use secure WiFi (password-protected)
```

### 10.5 Communication Security

**Email Safety:**
```
✅ Official TacticalHub emails:
• @tacticalhub.pk domain only
• From known senders
• Expected content

🚫 Suspicious emails:
• Asking for passwords
• Urgent requests for customer data
• Unknown attachments
• Spelling/grammar errors
• Generic greetings ("Dear User")
```

**Phone Security:**
```
• Only call customers from official business number
• Don't share admin phone numbers publicly
• Verify caller identity before discussing orders
• Report impersonation attempts
• Record important conversations (with consent)
```

**WhatsApp/Social Media:**
```
• Use business WhatsApp account only
• Don't share customer data on social media
• Verify customer identity before discussing orders
• Professional communication always
• Report fake TacticalHub accounts
```

### 10.6 Incident Reporting

**What to Report Immediately:**
```
🚨 CRITICAL:
• Unauthorized access to admin panel
• Customer data leak
• Payment fraud
• System breach
• Multiple failed login attempts

⚠️ IMPORTANT:
• Suspicious order patterns
• Phishing attempts
• Customer complaints about data misuse
• Unusual system behavior
```

**How to Report:**
```
1. Document the incident:
   • Date and time
   • What happened
   • Who was involved
   • Screenshots if applicable

2. Contact immediately:
   • Technical Team Lead: [Contact]
   • Operations Manager: [Contact]
   • Email: security@tacticalhub.pk

3. Don't:
   • Delete evidence
   • Try to fix it yourself
   • Discuss publicly
   • Wait to report
```

---


## Appendix A: Quick Reference Tables

### A.1 Order Status Quick Reference

| Status | Customer Sees | What It Means | Your Action |
|--------|---------------|---------------|-------------|
| PENDING | "Order Received" | Awaiting confirmation | Call customer ASAP |
| CONFIRMED | "Order Confirmed" | Customer verified | Book courier |
| PROCESSING | "Being Prepared" | Packing order | Pack and label |
| SHIPPED | "Shipped" | With courier | Track delivery |
| DELIVERED | "Delivered" | Successfully completed | Mark as delivered |
| CANCELLED | "Cancelled" | Order terminated | No further action |

### A.2 Courier Contact Information

| Courier | Karachi | Lahore | Islamabad | Website |
|---------|---------|--------|-----------|---------|
| **TCS** | 111-123-456 | 111-123-456 | 111-123-456 | tcsexpress.com |
| **Leopards** | 0213-111-5555 | 042-111-5555 | 051-111-5555 | leopardscourier.com.pk |
| **BlueEx** | 0213-111-2583 | 042-111-2583 | 051-111-2583 | blue-ex.com |
| **M&P** | 021-111-111-190 | 042-111-111-190 | 051-111-111-190 | mpexpress.com.pk |
| **PostEx** | 0213-111-7678 | 042-111-7678 | 051-111-7678 | postex.pk |

### A.3 Common Call Scripts (Urdu/English)

| Situation | Urdu | English |
|-----------|------|---------|
| **Greeting** | "Assalam o Alaikum" | "Hello" |
| **Introduce** | "TacticalHub se bol raha/rahi hoon" | "Calling from TacticalHub" |
| **Confirm Order** | "Aap ka order confirm karen?" | "Confirm your order?" |
| **Delivery Time** | "2-3 din mein deliver hoga" | "Will deliver in 2-3 days" |
| **Address Check** | "Kya address sahi hai?" | "Is the address correct?" |
| **Thank You** | "Shukriya" | "Thank you" |
| **Goodbye** | "Allah Hafiz" | "Goodbye" |

### A.4 Common Issues & Solutions

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Order not appearing | Filter applied | Clear all filters |
| Can't update status | Network issue | Refresh page, check internet |
| Tracking not working | Wrong tracking number | Verify with courier |
| Customer unreachable | Wrong number | Verify in order details |
| System slow | Quota limit | Check Firestore usage |
| Courier delayed | Traffic/weather | Call courier for update |

---

## Appendix B: Performance Metrics

### B.1 Daily Targets

```
Target Metrics (Per Administrator):
• Order Confirmations: 50-80 per day
• Shipments Booked: 40-60 per day
• Call Answer Rate: >70%
• Order Cancellation Rate: <15%
• Average Processing Time: <24 hours
```


### B.2 Weekly Performance Review

```
Week of: ________________

Orders Received:         _______
Orders Confirmed:        _______
Orders Shipped:          _______
Orders Delivered:        _______
Orders Cancelled:        _______

Confirmation Rate:       _______% (Target: >85%)
Delivery Success Rate:   _______% (Target: >90%)
Average Processing Time: _______ hours (Target: <24)

Top 3 Cancellation Reasons:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Top Selling Products:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Issues Encountered:
_____________________________________________
_____________________________________________
_____________________________________________

Improvement Actions:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## Appendix C: Emergency Contacts

```
┌──────────────────────────────────────────────┐
│ TACTICALHUB EMERGENCY CONTACTS               │
├──────────────────────────────────────────────┤
│ Technical Support:                           │
│   Email: support@tacticalhub.pk              │
│   Phone: 0300-XXXXXXX                        │
│   Available: Mon-Sat, 9 AM - 6 PM            │
│                                              │
│ Operations Manager:                          │
│   Email: ops@tacticalhub.pk                  │
│   Phone: 0321-XXXXXXX                        │
│   Available: Mon-Sat, 9 AM - 7 PM            │
│                                              │
│ Security Issues:                             │
│   Email: security@tacticalhub.pk             │
│   Phone: 0333-XXXXXXX (24/7)                 │
│                                              │
│ Customer Service (Escalations):              │
│   Email: customercare@tacticalhub.pk         │
│   Phone: 0300-XXXXXXX                        │
│                                              │
│ After-Hours Emergency:                       │
│   Phone: 0345-XXXXXXX                        │
│   (For critical system issues only)          │
└──────────────────────────────────────────────┘
```

> **Note:** Replace placeholder contact information with actual numbers and emails.

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 2025 | Initial release | TacticalHub Team |

---

## Feedback & Improvements

This guide is a living document. If you have suggestions for improvement:

1. Document your suggestion clearly
2. Email: ops@tacticalhub.pk
3. Subject: "Operations Guide Feedback"
4. Include:
   - Section reference
   - Current issue
   - Proposed improvement
   - Why it would help

---

**END OF DOCUMENT**

*Last updated: January 2025*  
*TacticalHub - Tactical Equipment E-Commerce Platform*  
*www.tacticalhub.pk*
