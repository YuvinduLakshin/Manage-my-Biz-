import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BusinessProfile, Quotation } from '../types';

export const generateQuotationPDF = async (
  profile: BusinessProfile,
  quotation: Quotation
): Promise<string | null> => {
  try {
    const currency = profile.currency || '$';
    
    // Format items as HTML rows
    const itemsHtml = quotation.items
      .map((item, index) => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        return `
          <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
            <td style="padding: 12px 8px;">
              <div style="font-weight: 600; color: #0F172A;">${item.name}</div>
              ${item.description ? `<div style="font-size: 11px; color: #64748B; margin-top: 4px;">${item.description}</div>` : ''}
            </td>
            <td style="text-align: right; padding: 12px 8px; color: #334155;">${currency}${item.price.toFixed(2)}</td>
            <td style="text-align: center; padding: 12px 8px; color: #334155;">${item.quantity}</td>
            <td style="text-align: right; padding: 12px 8px; font-weight: 600; color: #0F172A;">${currency}${itemTotal}</td>
          </tr>
        `;
      })
      .join('');

    // Generate HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quotation ${quotation.quoteNumber}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333;
              margin: 0;
              padding: 40px;
              line-height: 1.5;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #E2E8F0;
              padding-bottom: 24px;
              margin-bottom: 30px;
            }
            .business-info {
              flex: 1;
            }
            .business-name {
              font-size: 24px;
              font-weight: bold;
              color: #4F46E5;
              margin: 0 0 8px 0;
            }
            .business-details {
              font-size: 12px;
              color: #64748B;
              line-height: 1.6;
            }
            .logo-container {
              max-width: 150px;
              max-height: 75px;
              margin-bottom: 12px;
            }
            .logo {
              max-width: 100%;
              max-height: 75px;
              object-fit: contain;
            }
            .quote-meta-container {
              text-align: right;
              flex: 1;
            }
            .quote-title {
              font-size: 32px;
              font-weight: 800;
              color: #1E293B;
              margin: 0 0 10px 0;
              letter-spacing: -0.5px;
            }
            .meta-details {
              font-size: 13px;
              color: #334155;
              line-height: 1.6;
              display: inline-block;
              text-align: left;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              width: 220px;
              margin-bottom: 4px;
            }
            .meta-label {
              color: #64748B;
              font-weight: 500;
            }
            .meta-value {
              font-weight: 600;
              color: #0F172A;
            }
            .addresses-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              gap: 40px;
            }
            .address-box {
              flex: 1;
              background-color: #F8FAFC;
              border-radius: 8px;
              padding: 16px;
              border: 1px solid #F1F5F9;
            }
            .address-title {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748B;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .address-name {
              font-size: 15px;
              font-weight: 700;
              color: #0F172A;
              margin-bottom: 6px;
            }
            .address-text {
              font-size: 13px;
              color: #475569;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #4F46E5;
              color: white;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
              padding: 10px 8px;
              text-align: left;
            }
            th.qty { text-align: center; }
            th.price, th.total { text-align: right; }
            tr.even { background-color: #F8FAFC; }
            tr.odd { background-color: #FFFFFF; }
            td {
              border-bottom: 1px solid #E2E8F0;
              font-size: 13px;
            }
            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-box {
              width: 280px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 13px;
              color: #475569;
              border-bottom: 1px dashed #E2E8F0;
            }
            .summary-row.total-row {
              border-bottom: none;
              padding-top: 12px;
              margin-top: 8px;
            }
            .total-banner {
              background-color: #4F46E5;
              color: white;
              padding: 12px 16px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-weight: bold;
              font-size: 18px;
            }
            .terms-box {
              margin-top: 60px;
              border-top: 1px solid #E2E8F0;
              padding-top: 20px;
            }
            .terms-title {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .terms-text {
              font-size: 11px;
              color: #64748B;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="business-info">
              ${profile.logo ? `
                <div class="logo-container">
                  <img class="logo" src="${profile.logo}" alt="Logo" />
                </div>
              ` : ''}
              <h1 class="business-name">${profile.name || 'Your Business Name'}</h1>
              <div class="business-details">
                ${profile.address ? `<div>${profile.address}</div>` : ''}
                ${profile.phone ? `<div>Phone: ${profile.phone}</div>` : ''}
                ${profile.email ? `<div>Email: ${profile.email}</div>` : ''}
              </div>
            </div>
            
            <div class="quote-meta-container">
              <h2 class="quote-title">QUOTATION</h2>
              <div class="meta-details">
                <div class="meta-row">
                  <span class="meta-label">Quote Number:</span>
                  <span class="meta-value">${quotation.quoteNumber}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Date:</span>
                  <span class="meta-value">${quotation.date}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Valid Until:</span>
                  <span class="meta-value">${quotation.validUntil}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="addresses-container">
            <div class="address-box">
              <div class="address-title">Quotation For</div>
              <div class="address-name">${quotation.clientName}</div>
              <div class="address-text">
                ${quotation.clientAddress ? `<div>${quotation.clientAddress}</div>` : ''}
                ${quotation.clientEmail ? `<div style="margin-top: 4px;">${quotation.clientEmail}</div>` : ''}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th class="price" style="width: 15%;">Unit Price</th>
                <th class="qty" style="width: 10%;">Qty</th>
                <th class="total" style="width: 25%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${currency}${quotation.subtotal.toFixed(2)}</span>
              </div>
              ${quotation.taxTotal > 0 ? `
                <div class="summary-row">
                  <span>Tax (${quotation.taxRate}%)</span>
                  <span>${currency}${quotation.taxTotal.toFixed(2)}</span>
                </div>
              ` : ''}
              ${quotation.discount > 0 ? `
                <div class="summary-row">
                  <span>Discount</span>
                  <span>-${currency}${quotation.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="summary-row total-row">
                <div class="total-banner" style="width: 100%;">
                  <span>Total</span>
                  <span>${currency}${quotation.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="terms-box">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">
              1. Please review all details and specifications mentioned in this quotation.<br />
              2. Unless stated otherwise, this quotation is valid until the date specified above.<br />
              3. To accept this quote, please contact us by phone or email. Thank you for your business!
            </div>
          </div>
        </body>
      </html>
    `;

    // Compile to PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

export const shareQuotationPDF = async (pdfUri: string, quoteNumber: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert("Sharing is not available on this device");
      return false;
    }
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share Quotation ${quoteNumber}`,
      UTI: 'com.adobe.pdf',
    });
    return true;
  } catch (error) {
    console.error('Error sharing PDF:', error);
    return false;
  }
};
