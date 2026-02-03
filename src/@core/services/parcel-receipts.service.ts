// @core/services/parcel-receipt.service.ts
import { Injectable } from '@angular/core';
import { Parcel } from '../models/parcels/parcel.model';

@Injectable({
  providedIn: 'root'
})
export class ParcelReceiptGenerationService {

  /**
   * Generates and downloads a colorful thermal-style PDF receipt
   */
  async generateThermalReceipt(parcel: Parcel): Promise<void> {
    try {
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const receiptContainer = this.createThermalReceiptHTML(parcel);
      document.body.appendChild(receiptContainer);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 800));

      // Convert HTML to canvas with higher scale for small format
      const canvas = await html2canvas(receiptContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      document.body.removeChild(receiptContainer);

      // Thermal printer standard: 80mm width
      const receiptWidth = 80;
      const imgHeight = (canvas.height * receiptWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [receiptWidth, imgHeight + 10]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 5, receiptWidth, imgHeight);

      pdf.save(`Parcel_Receipt_${parcel.parcelNumber}.pdf`);
    } catch (error) {
      console.error('Error generating thermal receipt:', error);
      throw error;
    }
  }

  /**
   * Generates and downloads a simple monochrome supermarket-style PDF receipt
   */
  async generateSimpleReceipt(parcel: Parcel): Promise<void> {
    try {
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const receiptContainer = this.createSimpleReceiptHTML(parcel);
      document.body.appendChild(receiptContainer);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 800));

      // Convert HTML to canvas
      const canvas = await html2canvas(receiptContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      document.body.removeChild(receiptContainer);

      // Thermal printer standard: 80mm width
      const receiptWidth = 80;
      const imgHeight = (canvas.height * receiptWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [receiptWidth, imgHeight + 10]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 5, receiptWidth, imgHeight);

      pdf.save(`Parcel_Receipt_Simple_${parcel.parcelNumber}.pdf`);
    } catch (error) {
      console.error('Error generating simple receipt:', error);
      throw error;
    }
  }

  /**
   * Creates the HTML structure for a colorful thermal-style receipt
   */
  private createThermalReceiptHTML(parcel: Parcel): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '80mm';
    container.style.padding = '0';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';

    container.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .thermal-receipt {
          width: 80mm;
          padding: 15px;
          background: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.4;
        }

        .logo-section {
          height: 100px;
          display: flex;
          align-items: center;
          /* vertical */
          justify-content: center;
          /* horizontal */
          margin: 0 auto 0 auto;
        }

        .logo-img {
          height: 40px;
          transform: scale(3.15);
          transform-origin: center;
        }

        .header-title {
          font-size: 18px;
          font-weight: bold;
          color: #0e2c5a;
          text-align: center;
          margin: 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .divider {
          border-top: 2px dashed #333;
          margin: 12px 0;
        }

        .divider-solid {
          margin: 12px 0;
        }

        .receipt-number {
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          background: #f0f3ff;
          padding: 8px;
          margin: 10px 0;
          border-radius: 4px;
          color: #0e2c5a;
        }

        .receipt-date {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-bottom: 12px;
        }

        .amount-highlight {
          background: linear-gradient(135deg, #0e2c5a 0%, #1a4d8f 100%);
          color: white;
          padding: 15px;
          text-align: center;
          margin: 15px 0;
          border-radius: 6px;
        }

        .amount-label {
          font-size: 11px;
          opacity: 0.9;
          margin-bottom: 5px;
        }

        .amount-value {
          font-size: 22px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .section-title {
          font-size: 12px;
          font-weight: bold;
          color: #0e2c5a;
          margin: 12px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding-bottom: 4px;
          border-bottom: none ;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
          font-size: 11px;
        }

        .info-label {
          color: #555;
          font-weight: bold;
          flex: 0 0 45%;
        }

        .info-value {
          color: #000;
          flex: 1;
          text-align: right;
          word-wrap: break-word;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;     /* vertical center */
          justify-content: center; /* horizontal center */
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          line-height: 1;          /* remove baseline gap */
        }



        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-primary { background: #cce5ff; color: #004085; }
        .badge-secondary { background: #e2e3e5; color: #383d41; }
        .badge-default { background: #f0f0f0; color: #666; }

        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 12px;
          border-top: 2px dashed #333;
          font-size: 10px;
          color: #666;
        }

        .footer-note {
          background: #f8f9fa;
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
          font-style: italic;
          font-size: 9px;
        }

        .generated-date {
          font-size: 9px;
          color: #999;
          margin-top: 8px;
        }
      </style>

      <div class="thermal-receipt">
        <!-- Logo and Header -->
        <div class="logo-section">
          <img src="/logo_2.png" alt="Gopay Logo" class="logo-img" />
        </div>
        
        <div class="header-title">Parcel Receipt</div>
        
        <div class="receipt-number">${parcel.parcelNumber || 'N/A'}</div>
        <div class="receipt-date">Issued: ${this.formatDate(parcel.createdAt)}</div>
        
        <div class="divider-solid"></div>

        <!-- Amount Highlight -->
        <div class="amount-highlight">
          <div class="amount-label">TOTAL AMOUNT</div>
          <div class="amount-value">KSH ${this.formatCurrency(parcel.amount)}</div>
        </div>

        <!-- Status Information -->
        <div class="section-title">Status Information</div>
        <div class="info-row">
          <span class="info-label">Parcel Status:</span>
          <span class="info-value">
            <span class="status-badge ${this.getStatusClass(parcel.parcelStatus)}">
              ${parcel.parcelStatus.replace('_', ' ')}
            </span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Status:</span>
          <span class="info-value">
            <span class="status-badge ${this.getPaymentStatusClass(parcel.paymentStatus)}">
              ${parcel.paymentStatus}
            </span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">
            <span class="status-badge ${this.getPaymentMethodClass(parcel.paymentMethod)}">
              ${parcel.paymentMethod}
            </span>
          </span>
        </div>

        <div class="divider"></div>

        <!-- Parcel Details -->
        <div class="section-title">Parcel Details</div>
        <div class="info-row">
          <span class="info-label">Description:</span>
          <span class="info-value">${parcel.description || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Parcel Value:</span>
          <span class="info-value">KSH ${this.formatCurrency(Number(parcel.value) || 0)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Service Charge:</span>
          <span class="info-value">KSH ${this.formatCurrency(parcel.serviceCharge)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fleet Number:</span>
          <span class="info-value">${parcel.fleetNo || 'N/A'}</span>
        </div>
        ${parcel.mpesaReceiptNumber ? `
        <div class="info-row">
          <span class="info-label">M-Pesa Receipt:</span>
          <span class="info-value">${parcel.mpesaReceiptNumber}</span>
        </div>
        ` : ''}

        <div class="divider"></div>

        <!-- Sender Information -->
        <div class="section-title">Sender Information</div>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${parcel.senderName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${parcel.senderPhoneNumber || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Source:</span>
          <span class="info-value">${parcel.sourceName || 'N/A'}</span>
        </div>

        <div class="divider"></div>

        <!-- Receiver Information -->
        <div class="section-title">Receiver Information</div>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${parcel.receiverName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${parcel.receiverPhoneNumber || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Destination:</span>
          <span class="info-value">${parcel.destinationName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Last Mile:</span>
          <span class="info-value">${parcel.lastMile || 'N/A'}</span>
        </div>

        ${this.generateThermalTimeline(parcel)}

        <!-- Footer -->
        <div class="footer">
          <div>This is a computer-generated receipt</div>
          <div>and does not require a signature.</div>
          <div class="footer-note">
            For queries regarding this parcel, contact customer support with parcel number: ${parcel.parcelNumber}
          </div>
          <div class="generated-date">
            Generated: ${this.formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Creates the HTML structure for a simple monochrome supermarket-style receipt
   */
  private createSimpleReceiptHTML(parcel: Parcel): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '80mm';
    container.style.padding = '0';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Courier New, monospace';

    container.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .simple-receipt {
          width: 80mm;
          padding: 10px;
          background: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.3;
          color: #000;
        }

        // .simple-logo {
        //   text-align: center;
        //   margin-bottom: 10px;
        // }

        // .simple-logo img {
        //   height: 35px;
        //   filter: grayscale(100%);
        // }

        .simple-logo{
          height: 100px;
          display: flex;
          align-items: center;
          /* vertical */
          justify-content: center;
          /* horizontal */
          margin: 0 auto 0 auto;
        }

        .simple-logo img {
          height: 40px;
          transform: scale(3.15);
          transform-origin: center;
        }

        .simple-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .simple-title {
          font-size: 14px;
          font-weight: bold;
          margin: 5px 0;
        }

        .simple-divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

        .simple-divider-double {
          // border-top: 2px solid #000;
          margin: 8px 0;
        }

        .simple-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }

        .simple-label {
          flex: 0 0 50%;
        }

        .simple-value {
          flex: 1;
          text-align: right;
          word-wrap: break-word;
        }

        .simple-center {
          text-align: center;
          margin: 5px 0;
        }

        .simple-bold {
          font-weight: bold;
        }

        .simple-amount {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          padding: 8px;
          border: 2px solid #000;
        }

        .simple-section {
          margin: 10px 0;
        }

        .simple-section-title {
          font-weight: bold;
          // border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 5px;
        }

        .simple-footer {
          text-align: center;
          margin-top: 15px;
          font-size: 8px;
        }

        .simple-spacer {
          height: 5px;
        }
      </style>

      <div class="simple-receipt">
        <!-- Logo -->
        <div class="simple-logo">
          <img src="/logo_2.png" alt="Logo" />
        </div>

        <!-- Header -->
        <div class="simple-header">
          <div class="simple-title">PARCEL RECEIPT</div>
          <div>${parcel.parcelNumber || 'N/A'}</div>
        </div>

        <div class="simple-divider-double"></div>

        <!-- Date -->
        <div class="simple-center">
          ${this.formatDateSimple(parcel.createdAt)}
        </div>

        <div class="simple-divider"></div>

        <!-- Amount -->
        <div class="simple-amount">
          TOTAL: KSH ${this.formatCurrency(parcel.amount)}
        </div>

        <div class="simple-divider"></div>

        <!-- Status -->
        <div class="simple-section">
          <div class="simple-row">
            <span>Parcel Status:</span>
            <span class="simple-bold">${parcel.parcelStatus.replace('_', ' ')}</span>
          </div>
          <div class="simple-row">
            <span>Payment Status:</span>
            <span class="simple-bold">${parcel.paymentStatus}</span>
          </div>
          <div class="simple-row">
            <span>Payment Method:</span>
            <span class="simple-bold">${parcel.paymentMethod}</span>
          </div>
        </div>

        <div class="simple-divider"></div>

        <!-- Parcel Details -->
        <div class="simple-section">
          <div class="simple-section-title">PARCEL DETAILS</div>
          <div class="simple-row">
            <span>Description:</span>
            <span>${parcel.description || 'N/A'}</span>
          </div>
          <div class="simple-row">
            <span>Parcel Value:</span>
            <span>KSH ${this.formatCurrency(Number(parcel.value) || 0)}</span>
          </div>
          <div class="simple-row">
            <span>Service Charge:</span>
            <span>KSH ${this.formatCurrency(parcel.serviceCharge)}</span>
          </div>
          <div class="simple-row">
            <span>Fleet Number:</span>
            <span>${parcel.fleetNo || 'N/A'}</span>
          </div>
          ${parcel.mpesaReceiptNumber ? `
          <div class="simple-row">
            <span>M-Pesa Receipt:</span>
            <span>${parcel.mpesaReceiptNumber}</span>
          </div>
          ` : ''}
        </div>

        <div class="simple-divider"></div>

        <!-- Sender -->
        <div class="simple-section">
          <div class="simple-section-title">SENDER</div>
          <div class="simple-row">
            <span>Name:</span>
            <span>${parcel.senderName || 'N/A'}</span>
          </div>
          <div class="simple-row">
            <span>Phone:</span>
            <span>${parcel.senderPhoneNumber || 'N/A'}</span>
          </div>
          <div class="simple-row">
            <span>Source:</span>
            <span>${parcel.sourceName || 'N/A'}</span>
          </div>
        </div>

        <div class="simple-divider"></div>

        <!-- Receiver -->
        <div class="simple-section">
          <div class="simple-section-title">RECEIVER</div>
          <div class="simple-row">
            <span>Name:</span>
            <span>${parcel.receiverName || 'N/A'}</span>
          </div>
          <div class="simple-row">
            <span>Phone:</span>
            <span>${parcel.receiverPhoneNumber || 'N/A'}</span>
          </div>
          <div class="simple-row">
            <span>Destination:</span>
            <span>${parcel.destinationName || 'N/A'}</span>
          </div>
          <div class="simple-row">
            <span>Last Mile:</span>
            <span>${parcel.lastMile || 'N/A'}</span>
          </div>
        </div>

        ${this.generateSimpleTimeline(parcel)}

        <div class="simple-divider-double"></div>

        <!-- Footer -->
        <div class="simple-footer">
          <div>COMPUTER GENERATED RECEIPT</div>
          <div>NO SIGNATURE REQUIRED</div>
          <div class="simple-spacer"></div>
          <div>For support, quote parcel number:</div>
          <div class="simple-bold">${parcel.parcelNumber}</div>
          <div class="simple-spacer"></div>
          <div>Generated: ${this.formatDateSimple(new Date().toISOString())}</div>
        </div>

        <div class="simple-spacer"></div>
        <div class="simple-spacer"></div>
      </div>
    `;

    return container;
  }

  /**
   * Generates timeline section for thermal receipt
   */
  private generateThermalTimeline(parcel: Parcel): string {
    const hasTimeline = parcel.dispatchedAt || parcel.arrivedAt || parcel.pickedAt;

    if (!hasTimeline) {
      return '';
    }

    return `
      <div class="divider"></div>
      <div class="section-title">Parcel Timeline</div>
      ${parcel.dispatchedAt ? `
        <div class="info-row">
          <span class="info-label">Dispatched:</span>
          <span class="info-value">${this.formatDate(parcel.dispatchedAt)}</span>
        </div>
      ` : ''}
      ${parcel.arrivedAt ? `
        <div class="info-row">
          <span class="info-label">Arrived:</span>
          <span class="info-value">${this.formatDate(parcel.arrivedAt)}</span>
        </div>
      ` : ''}
      ${parcel.pickedAt ? `
        <div class="info-row">
          <span class="info-label">Picked:</span>
          <span class="info-value">${this.formatDate(parcel.pickedAt)}</span>
        </div>
      ` : ''}
      ${parcel.pickedBy ? `
        <div class="info-row">
          <span class="info-label">Picked By:</span>
          <span class="info-value">${parcel.pickedBy}</span>
        </div>
      ` : ''}
    `;
  }

  /**
   * Generates timeline section for simple receipt
   */
  private generateSimpleTimeline(parcel: Parcel): string {
    const hasTimeline = parcel.dispatchedAt || parcel.arrivedAt || parcel.pickedAt;

    if (!hasTimeline) {
      return '';
    }

    return `
      <div class="simple-divider"></div>
      <div class="simple-section">
        <div class="simple-section-title">TIMELINE</div>
        ${parcel.dispatchedAt ? `
          <div class="simple-row">
            <span>Dispatched:</span>
            <span>${this.formatDateSimple(parcel.dispatchedAt)}</span>
          </div>
        ` : ''}
        ${parcel.arrivedAt ? `
          <div class="simple-row">
            <span>Arrived:</span>
            <span>${this.formatDateSimple(parcel.arrivedAt)}</span>
          </div>
        ` : ''}
        ${parcel.pickedAt ? `
          <div class="simple-row">
            <span>Picked:</span>
            <span>${this.formatDateSimple(parcel.pickedAt)}</span>
          </div>
        ` : ''}
        ${parcel.pickedBy ? `
          <div class="simple-row">
            <span>Picked By:</span>
            <span>${parcel.pickedBy}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Format date to readable string
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format date in simple format for supermarket-style receipt
   */
  private formatDateSimple(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Format currency with thousand separators
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Get status class for badges
   */
  private getStatusClass(status: Parcel['parcelStatus']): string {
    switch (status) {
      case 'COLLECTED':
        return 'badge-success';
      case 'IN_TRANSIT':
        return 'badge-warning';
      case 'ARRIVED':
        return 'badge-info';
      case 'CANCELLED':
        return 'badge-danger';
      case 'REGISTERED':
      default:
        return 'badge-default';
    }
  }

  /**
   * Get payment status class
   */
  private getPaymentStatusClass(status: Parcel['paymentStatus']): string {
    switch (status) {
      case 'PAID':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'UNPAID':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }

  /**
   * Get payment method class
   */
  private getPaymentMethodClass(method: Parcel['paymentMethod']): string {
    switch (method) {
      case 'CASH':
        return 'badge-primary';
      case 'CASHLESS':
        return 'badge-secondary';
      default:
        return 'badge-default';
    }
  }
}