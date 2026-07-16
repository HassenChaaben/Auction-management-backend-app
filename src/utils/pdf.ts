import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface ReceiptPdfData {
  auctionUuid: string;
  goodName: string;
  winnerUsername: string;
  amountPaid: number;
  awardedAt: Date;
  transactionId: string;
}

/**
 * Generates a PDF receipt using PDFKit and returns it as a Readable Stream.
 */
export function generateReceiptPdf(data: ReceiptPdfData): Readable {
  const doc = new PDFDocument({ margin: 50 });
  const stream = new Readable().wrap(doc);

  // Design Aesthetics - Premium Title
  doc
    .fillColor('#2C3E50')
    .fontSize(24)
    .text('OFFICIAL AUCTION RECEIPT', { align: 'center' })
    .moveDown(1.5);

  // Decorative Line
  doc
    .strokeColor('#BDC3C7')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(1.5);

  // Metadata / Details Table structure
  doc.fillColor('#34495E').fontSize(12);

  const writeRow = (label: string, value: string) => {
    doc.font('Helvetica-Bold').text(label, 50, doc.y, { continued: true });
    doc.font('Helvetica').text(`: ${value}`, 200, doc.y);
    doc.moveDown(0.8);
  };

  writeRow('Transaction ID', data.transactionId);
  writeRow('Auction ID', data.auctionUuid);
  writeRow('Awarded Good', data.goodName);
  writeRow('Winner Username', data.winnerUsername);
  writeRow('Amount Paid', `$${data.amountPaid.toFixed(2)}`);
  writeRow('Date of Award', data.awardedAt.toLocaleString());

  doc.moveDown(2);

  // Footer / Decorative Sign-off
  doc
    .strokeColor('#BDC3C7')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(1.5);

  doc
    .fillColor('#7F8C8D')
    .fontSize(10)
    .text('Thank you for participating in our Catalog of Goods and Auction Management System.', {
      align: 'center',
    });

  // Finalize PDF file
  doc.end();

  return stream;
}
