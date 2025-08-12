# Product Discount System Guide

## Overview

The Product Discount System allows you to create and manage product-specific discounts and promotions for your website. You can apply discounts to individual products, entire categories, or specific product selections.

## Features

- **Multiple Discount Types**: Percentage off, fixed amount off, and buy X get Y promotions
- **Flexible Targeting**: Apply discounts to specific products or entire categories
- **Time-based Promotions**: Set start and end dates for campaigns
- **Usage Limits**: Control total usage and per-customer limits
- **Real-time Application**: Apply and remove discounts instantly
- **Visual Indicators**: Discounted products show clear pricing and discount badges

## How to Use

### 1. Access the Discount Management

1. Go to your admin panel (`/admin`)
2. Click on "Product Discounts" in the sidebar
3. You'll see the discount management interface

### 2. Create a New Discount

1. **Basic Information**
   - **Discount Name**: Give your discount a descriptive name (e.g., "Summer Sale 20% Off")
   - **Discount Type**: Choose between:
     - **Percentage Off**: Reduce price by a percentage (e.g., 20% off)
     - **Fixed Amount Off**: Reduce price by a fixed dollar amount (e.g., $10 off)
     - **Buy X Get Y**: Special promotional offers

2. **Discount Value**
   - For percentage: Enter 0-100
   - For fixed amount: Enter dollar amount
   - For buy X get Y: Enter promotional value

3. **Optional Settings**
   - **Minimum Purchase**: Set minimum order value required
   - **Maximum Discount**: Limit maximum discount amount (for percentage discounts)
   - **Start Date**: When the discount becomes active
   - **End Date**: When the discount expires
   - **Usage Limit**: Maximum total uses for this discount
   - **Uses Per Customer**: Maximum times a customer can use this discount

4. **Product Selection**
   - **Applicable Products**: Select specific products to apply the discount to
   - **Applicable Categories**: Select entire categories to apply the discount to
   - You can use both or either option

5. **Save the Discount**
   - Click "Create Discount" to save
   - The discount will be created but not yet applied to products

### 3. Apply Discounts to Products

1. **Find Your Discount**: Locate the discount in the "All Discounts" list
2. **Click "Apply"**: This will apply the discount to all selected products/categories
3. **Verify Application**: Check the test page to see which products now have discounts

### 4. Remove Discounts

1. **Find the Discount**: Locate the discount in the list
2. **Click "Remove"**: This will remove the discount from all affected products
3. **Products Restored**: Original prices will be restored

### 5. Manage Existing Discounts

- **Edit**: Modify discount settings
- **Activate/Deactivate**: Toggle discount status
- **Delete**: Permanently remove the discount

## Discount Types Explained

### Percentage Off
- **Example**: 20% off
- **Calculation**: Original price × (1 - 0.20) = New price
- **Use Case**: General sales, seasonal promotions

### Fixed Amount Off
- **Example**: $10 off
- **Calculation**: Original price - $10 = New price
- **Use Case**: Clear dollar savings, clearance sales

### Buy X Get Y
- **Example**: Buy 2, Get 1 Free
- **Calculation**: Special promotional logic
- **Use Case**: Bundle deals, quantity promotions

## Best Practices

### 1. Clear Naming
- Use descriptive names that customers will understand
- Include the discount amount in the name

### 2. Strategic Timing
- Plan discounts around holidays, seasons, or inventory clearance
- Use start/end dates to create urgency

### 3. Targeted Application
- Apply category discounts for broad promotions
- Use product-specific discounts for featured items
- Consider minimum purchase requirements to increase order value

### 4. Monitor Performance
- Check the test page regularly to see which products have discounts
- Track usage counts to understand discount effectiveness

## Testing Your Discounts

1. **Go to Test Page**: Click "Test Discounts" button on the main discounts page
2. **View Active Discounts**: See all currently active discount campaigns
3. **Check Product Status**: Verify which products have discounts applied
4. **Price Verification**: Confirm original vs. discounted prices

## Technical Details

### Database Structure
- **discounts collection**: Stores discount configurations
- **products collection**: Updated with discount information when applied

### API Endpoints
- **POST /api/apply-discount**: Apply discount to products
- **DELETE /api/apply-discount**: Remove discount from products

### Frontend Integration
- **ProductCard component**: Automatically displays discount information
- **Price display**: Shows original price crossed out, discounted price highlighted
- **Discount badges**: Visual indicators on discounted products

## Troubleshooting

### Discount Not Applying
1. Check if discount is active
2. Verify start/end dates
3. Ensure products/categories are selected
4. Check usage limits

### Prices Not Updating
1. Refresh the page after applying discounts
2. Check browser console for errors
3. Verify discount is active and within date range

### Performance Issues
1. Limit the number of products per discount
2. Use categories instead of individual products when possible
3. Monitor database performance with large product sets

## Security

- Only admin users can create/modify discounts
- Public read access for discount information
- Discount application requires admin authentication

## Support

If you encounter issues:
1. Check the test page to verify discount status
2. Review discount settings and dates
3. Check browser console for error messages
4. Verify product/category selections

---

**Note**: The discount system is designed to be flexible and powerful. Start with simple percentage discounts and gradually explore more advanced features as you become comfortable with the system.
