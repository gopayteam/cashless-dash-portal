// @core/services/parcel-receipt.service.ts
import { Injectable } from '@angular/core';
import { Parcel } from '../models/parcels/parcel.model';

@Injectable({
  providedIn: 'root'
})
export class ParcelReceiptService {

  /**
   * Generates and downloads a PDF receipt for a parcel
   */
  async generateReceipt1(parcel: Parcel): Promise<void> {
    try {
      // Dynamically import jsPDF and html2canvas
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Create a temporary container for the receipt
      const receiptContainer = this.createReceiptHTML(parcel);
      document.body.appendChild(receiptContainer);

      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convert HTML to canvas
      const canvas = await html2canvas(receiptContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      // Remove temporary container
      document.body.removeChild(receiptContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Handle multi-page PDF if content is taller than one page
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`Parcel_Receipt_${parcel.parcelNumber}.pdf`);
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }

  async generateReceipt(parcel: Parcel): Promise<string> {
    try {
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const receiptContainer = this.createReceiptHTML(parcel);
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

      pdf.save(`Parcel_Receipt_Colorful${parcel.parcelNumber}.pdf`);

      return 'done';
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }


  /**
   * Creates the HTML structure for the receipt - matches the preview design
   */
  private createReceiptHTML(parcel: Parcel): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    // container.style.width = '80mm';  // Changed from 210mm to 80mm
    container.style.padding = '0';
    container.style.backgroundColor = '#f5f5f5';
    container.style.fontFamily = 'Arial, sans-serif';

    container.innerHTML = `
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: #f5f5f5;
        }

        .logo-wrapper {
          height: 150px;
          padding: 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px auto;
        }

        .logo-img {
          height: 40px;
          transform: scale(7.15);
          transform-origin: center;
        }

        .receipt-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #0e2c5a;
        }

        .company-logo {
          max-width: 200px;
          height: auto;
          margin-bottom: 15px;
        }

        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          color: #0e2c5a;
          margin: 10px 0;
        }

        .receipt-number {
          font-size: 16px;
          color: #666;
          font-family: 'Courier New', monospace;
          background: #f0f3ff;
          padding: 8px 16px;
          border-radius: 6px;
          display: inline-block;
          margin-top: 10px;
        }

        .receipt-date {
          font-size: 14px;
          color: #666;
          margin-top: 10px;
        }

        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #0e2c5a;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
        }

        .info-item {
          margin-bottom: 12px;
        }

        .info-label {
          font-size: 11px;
          font-weight: bold;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
        }

        .amount-section {
          background: linear-gradient(135deg, #0e2c5a 0%, #1a4d8f 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 25px 0;
        }

        .amount-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .amount-value {
          font-size: 32px;
          font-weight: bold;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }

        .status-card {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .status-label {
          font-size: 11px;
          font-weight: bold;
          color: #718096;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .status-value {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
        }

        .badge {
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


        .badge-success {
          background: #d4edda;
          color: #155724;
        }

        .badge-warning {
          background: #fff3cd;
          color: #856404;
        }

        .badge-info {
          background: #d1ecf1;
          color: #0c5460;
        }

        .badge-danger {
          background: #f8d7da;
          color: #721c24;
        }

        .badge-primary {
          background: #cce5ff;
          color: #004085;
        }

        .badge-secondary {
          background: #e2e3e5;
          color: #383d41;
        }

        .badge-default {
          background: #f0f0f0;
          color: #666;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #666;
          font-size: 12px;
        }

        .footer-note {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          font-style: italic;
        }
      </style>

      <div style="padding: 20px; background: #f5f5f5;">
        <div class="receipt-container">
          <!-- Header -->
          <div class="receipt-header">
            <div class="logo-wrapper">
              <img src="/logo_2.png" alt="Gopay Logo" class="logo-img" />
            </div>
            <div class="receipt-title">Parcel Receipt</div>
            <div class="receipt-number">${parcel.parcelNumber || 'N/A'}</div>
            <div class="receipt-date">
              Issued: ${this.formatDate(parcel.createdAt)}
            </div>
          </div>

          <!-- Amount Section -->
          <div class="amount-section">
            <div class="amount-label">Total Amount</div>
            <div class="amount-value">
              Ksh ${this.formatCurrency(parcel.amount)}
            </div>
          </div>

          <!-- Status Cards -->
          <div class="status-grid">
            <div class="status-card">
              <div class="status-label">Parcel Status</div>
              <div class="status-value">
                <span class="badge ${this.getStatusClass(parcel.parcelStatus)}">
                  ${parcel.parcelStatus.replace('_', ' ') || 'N/A'}
                </span>
              </div>
            </div>

            <div class="status-card">
              <div class="status-label">Payment Status</div>
              <div class="status-value">
                <span class="badge ${this.getPaymentStatusClass(parcel.paymentStatus)}">
                  ${parcel.paymentStatus || 'N/A'}
                </span>
              </div>
            </div>

            <div class="status-card">
              <div class="status-label">Payment Method</div>
              <div class="status-value">
                <span class="badge ${this.getPaymentMethodClass(parcel.paymentMethod)}">
                  ${parcel.paymentMethod || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <!-- Parcel Information -->
          <div class="section">
            <div class="section-title">Parcel Information</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <div class="info-label">Parcel Number</div>
                  <div class="info-value">${parcel.parcelNumber || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Description</div>
                  <div class="info-value">${parcel.description || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Parcel Value</div>
                  <div class="info-value">Ksh ${this.formatCurrency(Number(parcel.value) || 0)}</div>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <div class="info-label">Service Charge</div>
                  <div class="info-value">Ksh ${this.formatCurrency(parcel.serviceCharge)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Fleet Number</div>
                  <div class="info-value">${parcel.fleetNo || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">M-Pesa Receipt</div>
                  <div class="info-value">${parcel.mpesaReceiptNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sender Information -->
          <div class="section">
            <div class="section-title">Sender Information</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <div class="info-label">Sender Name</div>
                  <div class="info-value">${parcel.senderName || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Sender Phone</div>
                  <div class="info-value">${parcel.senderPhoneNumber || 'N/A'}</div>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <div class="info-label">Source Location</div>
                  <div class="info-value">${parcel.sourceName || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Receiver Information -->
          <div class="section">
            <div class="section-title">Receiver Information</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <div class="info-label">Receiver Name</div>
                  <div class="info-value">${parcel.receiverName || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Receiver Phone</div>
                  <div class="info-value">${parcel.receiverPhoneNumber || 'N/A'}</div>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <div class="info-label">Destination</div>
                  <div class="info-value">${parcel.destinationName || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Last Mile</div>
                  <div class="info-value">${parcel.lastMile || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Parcel Timeline -->
          ${this.generateTimeline(parcel)}

          <!-- Footer -->
          <div class="footer">
            <div>This is a computer-generated receipt and does not require a signature.</div>
            <div class="footer-note">
              For any queries regarding this parcel, please contact customer support
              with your parcel number: ${parcel.parcelNumber}
            </div>
            <div style="margin-top: 15px; font-size: 11px;">
              Generated on: ${this.formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Generates timeline section if tracking dates are available
   */
  private generateTimeline(parcel: Parcel): string {
    const hasTimeline = parcel.dispatchedAt || parcel.arrivedAt || parcel.pickedAt;

    if (!hasTimeline) {
      return '';
    }

    return `
      <div class="section">
        <div class="section-title">Parcel Timeline</div>
        <div class="info-grid">
          ${parcel.dispatchedAt ? `
            <div class="info-item">
              <div class="info-label">Dispatched At</div>
              <div class="info-value">${this.formatDate(parcel.dispatchedAt)}</div>
            </div>
          ` : ''}
          ${parcel.arrivedAt ? `
            <div class="info-item">
              <div class="info-label">Arrived At</div>
              <div class="info-value">${this.formatDate(parcel.arrivedAt)}</div>
            </div>
          ` : ''}
          ${parcel.pickedAt ? `
            <div class="info-item">
              <div class="info-label">Picked At</div>
              <div class="info-value">${this.formatDate(parcel.pickedAt)}</div>
            </div>
          ` : ''}
          ${parcel.pickedBy ? `
            <div class="info-item">
              <div class="info-label">Picked By</div>
              <div class="info-value">${parcel.pickedBy}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Format date to readable string (matches Angular date pipe 'dd MMM yyyy, hh:mm a')
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
   * Format currency with thousand separators (matches Angular number pipe '1.2-2')
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Get status class (matches your component's getStatusClass method)
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
   * Get payment status class (matches your component's getPaymentStatusClass method)
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
   * Get payment method class (matches your component's getPaymentMethodClass method)
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