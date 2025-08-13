import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { customer, address, items, total, orderId, firestoreOrderId } = data;

    console.log('Sending order email for:', { customerEmail: customer.email, orderId, firestoreOrderId });

    // Setup Nodemailer transporter (Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
        pass: process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr',
      },
    });

    const itemLines = items.map((item: any) => `${item.title} x ${item.quantity} - $${item.price * item.quantity}`).join('<br>');

    // Fetch email templates and logo URL from Firestore
    let logoUrl = '';
    let emailTemplates = null;
    try {
      const docRef = doc(db, 'siteContent', 'emailTemplates');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        logoUrl = data.logoUrl || '';
        emailTemplates = data;
        console.log('Logo URL fetched:', logoUrl);
      }
    } catch (e) {
      console.error('Failed to fetch email templates:', e);
    }

    // Ensure logo URL is properly formatted for email
    if (logoUrl && !logoUrl.startsWith('http')) {
      console.log('Invalid logo URL format:', logoUrl);
      logoUrl = '';
    }

    // Enhanced admin email focused on supply/inventory needs (no pricing)
    const adminSubject = `📦 NEW ORDER #${orderId.slice(-8).toUpperCase()} - ${items.length} ITEM${items.length > 1 ? 'S' : ''}`;
    
    // Create detailed admin email content for supply team
    const adminEmailContent = `
📦 NEW ORDER RECEIVED - READY FOR FULFILLMENT!

📋 ORDER DETAILS:
Order ID: ${orderId}
Firestore ID: ${firestoreOrderId || 'N/A'}
Date: ${new Date().toLocaleString()}
Total Items: ${items.length}

👤 CUSTOMER INFORMATION:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}

📍 SHIPPING ADDRESS:
${address.street}
${address.city}, ${address.state} ${address.zip}
${address.country}

🛍️ ORDER ITEMS TO FULFILL:
${items.map((item: any, index: number) => {
  const skuInfo = item.sku ? `\n     SKU: ${item.sku}` : '';
  const partNumberInfo = item.partNumber ? `\n     Part Number: ${item.partNumber}` : '';
  const manufacturerInfo = item.manufacturer ? `\n     Manufacturer: ${item.manufacturer}` : '';
  const modelInfo = item.model ? `\n     Model: ${item.model}` : '';
  return `${index + 1}. ${item.title}${skuInfo}${partNumberInfo}${manufacturerInfo}${modelInfo}
     Quantity: ${item.quantity}`;
}).join('\n\n')}

🔗 ADMIN LINKS:
View Order: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://instakeysupply.com'}/admin/orders
`;

    // Create HTML version of admin email for better formatting
    const adminHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
        .section { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #2563eb; }
        .section h3 { margin: 0 0 10px 0; color: #1e40af; font-size: 18px; }
        .item { margin: 10px 0; padding: 10px; background: #f1f5f9; border-radius: 4px; }
        .highlight { background: #dbeafe; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .admin-link { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .admin-link:hover { background: #1d4ed8; }
        .total { font-size: 20px; font-weight: bold; color: #059669; }
      </style>
    </head>
    <body>
             <div class="header">
         <h1>📦 NEW ORDER RECEIVED!</h1>
         <h2>Order #${orderId.slice(-8).toUpperCase()} - ${items.length} ITEM${items.length > 1 ? 'S' : ''}</h2>
       </div>
       
       <div class="content">
         <div class="section">
           <h3>📋 ORDER DETAILS</h3>
           <p><strong>Order ID:</strong> ${orderId}</p>
           <p><strong>Firestore ID:</strong> ${firestoreOrderId || 'N/A'}</p>
           <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
           <p><strong>Total Items:</strong> <span class="total">${items.length}</span></p>
         </div>
        
        <div class="section">
          <h3>👤 CUSTOMER INFORMATION</h3>
          <p><strong>Name:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Phone:</strong> ${customer.phone}</p>
        </div>
        
        <div class="section">
          <h3>📍 SHIPPING ADDRESS</h3>
          <p>${address.street}</p>
          <p>${address.city}, ${address.state} ${address.zip}</p>
          <p>${address.country}</p>
        </div>
        
                 <div class="section">
           <h3>🛍️ ORDER ITEMS TO FULFILL</h3>
           ${items.map((item: any, index: number) => {
             const skuInfo = item.sku ? `<br><strong>SKU:</strong> ${item.sku}` : '';
             const partNumberInfo = item.partNumber ? `<br><strong>Part Number:</strong> ${item.partNumber}` : '';
             const manufacturerInfo = item.manufacturer ? `<br><strong>Manufacturer:</strong> ${item.manufacturer}` : '';
             const modelInfo = item.model ? `<br><strong>Model:</strong> ${item.model}` : '';
             return `
             <div class="item">
               <h4>${index + 1}. ${item.title}</h4>
               ${skuInfo}
               ${partNumberInfo}
               ${manufacturerInfo}
               ${modelInfo}
               <p><strong>Quantity:</strong> ${item.quantity}</p>
             </div>`;
           }).join('')}
         </div>
        
                 <div class="section">
           <h3>🔗 SUPPLY TEAM ACTIONS</h3>
           <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://instakeysupply.com'}/admin/orders" class="admin-link">
             📋 View Order Details in Admin Panel
           </a>
           <p style="margin-top: 15px; font-size: 14px; color: #666;">
             <strong>Next Steps:</strong><br>
             • Locate items in inventory using SKU/Part Numbers<br>
             • Verify quantities and item specifications<br>
             • Prepare for shipping to customer address above
           </p>
         </div>
      </div>
    </body>
    </html>
    `;

    const mailOptionsAdmin = {
      from: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
      to: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
      subject: adminSubject,
      text: adminEmailContent,
      html: adminHtmlContent,
    };

    // Prepare customer email content
    let customerSubject = 'Thank you for your order!';
    let customerBody = `Hi ${customer.name || ''},

Thank you for your order! Here is your order summary:

Order Items:
{orderItems}

Shipping To:
{shippingAddress}

Total: ${'{orderTotal}'}

We appreciate your business! If you have any questions, reply to this email.

Best regards,
InstaKey Supply Team`;

    // Use custom template if available
    if (emailTemplates && emailTemplates.orderPlaced) {
      customerSubject = emailTemplates.orderPlaced.subject || customerSubject;
      customerBody = emailTemplates.orderPlaced.body || customerBody;
    }

    // Replace placeholders in the template
    const shippingAddress = `${address.street}\n${address.city}, ${address.state} ${address.zip}, ${address.country}`;
    
    let processedBody = customerBody
      .replace(/{customerName}/g, customer.name || '')
      .replace(/{orderItems}/g, items.map((item: any) => `${item.title} x ${item.quantity} - $${item.price * item.quantity}`).join('\n'))
      .replace(/{shippingAddress}/g, shippingAddress)
      .replace(/{orderTotal}/g, `$${total}`)
      .replace(/{logo}/g, logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width:180px; margin-bottom:16px; display:block; margin-left:auto; margin-right:auto;" />` : '');

    // Convert to HTML and add logo at the top if not already in template
    const logoHtml = logoUrl ? `<div style="text-align:center; margin-bottom:16px;"><img src="${logoUrl}" alt="Logo" style="max-width:180px; margin-bottom:16px; display:block; margin-left:auto; margin-right:auto;" /></div>` : '';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${!customerBody.includes('{logo}') ? logoHtml : ''}
        ${processedBody.replace(/\n/g, '<br>')}
      </div>
    `;

    console.log('Sending admin email to:', process.env.OWNER_EMAIL);
    console.log('Sending customer email to:', customer.email);

    // Send emails
    const adminResult = await transporter.sendMail(mailOptionsAdmin);
    console.log('Admin email sent successfully:', adminResult.messageId);
    
    const customerResult = await transporter.sendMail({
      from: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
      to: customer.email,
      subject: customerSubject,
      html: htmlBody,
    });
    console.log('Customer email sent successfully:', customerResult.messageId);

    return NextResponse.json({ success: true, adminMessageId: adminResult.messageId, customerMessageId: customerResult.messageId });
  } catch (err: any) {
    console.error('ORDER EMAIL ERROR:', err);
    console.error('Error details:', err?.response?.data || '', err?.message || '');
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
} 