# Dashboard Page Implementation Plan

## Overview
Build a dashboard page that displays top spending categories for a user with visual dials showing percentage of spend and points multipliers.

## 1. Backend API Endpoint

### Endpoint: `GET /api/users/{user_id}/spending-categories`

**Purpose**: Get top spending categories for a specific user with percentages and points multipliers.

**Response Structure**:
```json
{
  "user_id": 1,
  "total_spent": 648.31,
  "categories": [
    {
      "category": "E-Commerce",
      "total_spent": 227.0,
      "percentage_of_spend": 35.0,
      "points_multiplier": 5,
      "points_earned": 1135
    },
    {
      "category": "Fuel",
      "total_spent": 129.6,
      "percentage_of_spend": 20.0,
      "points_multiplier": 4,
      "points_earned": 518
    },
    {
      "category": "Travel",
      "total_spent": 97.2,
      "percentage_of_spend": 15.0,
      "points_multiplier": 3,
      "points_earned": 292
    },
    {
      "category": "Fine Dining",
      "total_spent": 32.4,
      "percentage_of_spend": 5.0,
      "points_multiplier": 2,
      "points_earned": 65
    }
  ]
}
```

**Implementation Steps**:
1. Create endpoint in `backend/main.py`
2. Load user's transaction CSV (or query from database)
3. Use `summarize.py` logic to categorize transactions
4. Calculate top 4 categories by spend
5. Map categories to points multipliers (business logic)
6. Return JSON response

**Points Multiplier Mapping** (example):
- E-Commerce: 5x
- Fuel: 4x
- Travel: 3x
- Fine Dining: 2x
- Dining: 2x
- Retail: 1x
- (default: 1x)

## 2. Frontend Components

### Component Structure
```
src/
├── pages/
│   └── DashboardPage.jsx          # Main dashboard page
├── components/
│   ├── CategoryDial.jsx          # Reusable dial component
│   └── DashboardHeader.jsx       # Optional header component
└── services/
    └── api.js                     # Add dashboard API call
```

### 2.1 DashboardPage.jsx
**Responsibilities**:
- Fetch spending data from API
- Display loading/error states
- Render grid of CategoryDial components
- Handle empty states

**Layout**:
- Header with "Top Spending Categories" title
- 2x2 grid of dials (responsive: 1 column on mobile, 2 columns on tablet+)
- Whiteboard/slide-like design with border

### 2.2 CategoryDial.jsx
**Props**:
```javascript
{
  category: string,        // "E-Commerce", "Fuel", etc.
  percentage: number,      // 0-100
  pointsMultiplier: number, // 2, 3, 4, 5, etc.
  totalSpent: number       // Optional: for display
}
```

**Visual Elements**:
- Semi-circular dial (180° arc)
- Blue fill with diagonal lines pattern
- Percentage text below dial
- Points multiplier text (e.g., "5 x Points")
- Category name as label

**Styling**:
- White background card
- Black border (whiteboard effect)
- Responsive sizing

### 2.3 API Service Update
Add to `api.js`:
```javascript
export const getSpendingCategories = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/spending-categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch spending categories');
  }
  return response.json();
};
```

## 3. Visual Design Specifications

### Color Scheme
- Background: Light gray with dotted pattern (whiteboard effect)
- Card: White with black border
- Dial fill: Blue (#3B82F6) with diagonal lines
- Text: Black/dark gray
- Points text: Blue accent

### Typography
- Title: Large, bold, handwritten-style font (or bold sans-serif)
- Category names: Medium weight
- Percentages: Bold, larger
- Points: Medium weight with "x Points" suffix

### Layout
- Container: Max-width, centered
- Grid: 2 columns on desktop/tablet, 1 column on mobile
- Spacing: Generous padding between cards
- Dial size: ~150-200px diameter

## 4. Implementation Steps

### Phase 1: Backend API
1. ✅ Create `/api/users/{user_id}/spending-categories` endpoint
2. ✅ Integrate `summarize.py` logic into FastAPI
3. ✅ Add points multiplier mapping
4. ✅ Return top 4 categories sorted by spend
5. ✅ Test with example user data

### Phase 2: Frontend Components
1. ✅ Create `CategoryDial.jsx` component
2. ✅ Implement semi-circular SVG dial
3. ✅ Add percentage calculation and display
4. ✅ Style with whiteboard aesthetic
5. ✅ Make responsive

### Phase 3: Dashboard Page
1. ✅ Create `DashboardPage.jsx`
2. ✅ Add API integration
3. ✅ Implement 2x2 grid layout
4. ✅ Add loading/error states
5. ✅ Style to match design mockup

### Phase 4: Routing & Navigation
1. ✅ Add route in `App.jsx`: `/dashboard/:userId?`
2. ✅ Update navigation (if needed)
3. ✅ Add link from landing page

### Phase 5: Polish
1. ✅ Add animations (Framer Motion)
2. ✅ Improve empty states
3. ✅ Add error handling
4. ✅ Test with different user IDs
5. ✅ Responsive design testing

## 5. Technical Considerations

### SVG Dial Implementation
- Use SVG `<path>` with arc to create semi-circle
- Calculate arc based on percentage (0-100% = 0-180°)
- Add diagonal line pattern using `<pattern>` element
- Animate fill on load

### Data Handling
- Handle cases where user has < 4 categories
- Handle zero spending
- Handle API errors gracefully
- Cache data if needed (future optimization)

### Performance
- Lazy load dashboard if needed
- Optimize SVG rendering
- Consider virtualization if many categories (future)

## 6. Testing Checklist

- [ ] API returns correct data structure
- [ ] Dials render correctly for various percentages
- [ ] Points multipliers display correctly
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Loading states display properly
- [ ] Error states handle failures gracefully
- [ ] Empty states show when no data
- [ ] Animations are smooth
- [ ] Category names are readable
- [ ] Dials are visually accurate

## 7. Future Enhancements

- Filter by date range
- Show more than 4 categories
- Add drill-down to see transactions
- Compare with previous period
- Export/share dashboard
- Real-time updates
- User authentication integration
