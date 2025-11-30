import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  description?: string;
  recipientDetails?: {
    name?: string;
  };
}

interface UserData {
  fullName?: string;
  email?: string;
  phone?: string;
}

function formatNumber(num: number | string): string {
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  return parsed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getCurrencySymbol(currency?: string): string {
  const upper = currency?.toUpperCase();
  switch (upper) {
    case 'KES':
      return 'KSh ';
    case 'USD':
      return '$';
    default:
      return '$';
  }
}

export async function generateTransactionPDF(transactions: Transaction[], userData: UserData): Promise<Buffer> {
  const doc = new jsPDF();
  
  const greenColor: [number, number, number] = [34, 197, 94]; // Green-500
  const grayColor: [number, number, number] = [107, 114, 128]; // Gray-500
  const darkColor: [number, number, number] = [17, 24, 39]; // Gray-900
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header with GreenPay branding
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // GreenPay Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GreenPay', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('International Money Transfer & Digital Wallet', 14, 28);
  
  // Statement title
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Statement', 14, 55);
  
  // User Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.text(`Generated: ${currentDate}`, 14, 65);
  if (userData.fullName) {
    doc.text(`Account Holder: ${userData.fullName}`, 14, 71);
  }
  if (userData.email) {
    doc.text(`Email: ${userData.email}`, 14, 77);
  }
  
  // Summary Statistics
  const usdTransactions = transactions.filter(t => t.currency?.toUpperCase() !== 'KES');
  const kesTransactions = transactions.filter(t => t.currency?.toUpperCase() === 'KES');
  
  const totalUsdIn = usdTransactions
    .filter(t => (t.type === 'receive' || t.type === 'deposit') && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalUsdOut = usdTransactions
    .filter(t => (t.type === 'send' || t.type === 'withdraw' || t.type === 'card_purchase') && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalKesIn = kesTransactions
    .filter(t => (t.type === 'receive' || t.type === 'deposit') && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalKesOut = kesTransactions
    .filter(t => (t.type === 'send' || t.type === 'withdraw' || t.type === 'card_purchase') && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  // Summary Box
  doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(14, 85, pageWidth - 28, 35);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Summary', 18, 92);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  let yPos = 100;
  
  if (usdTransactions.length > 0) {
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('USD:', 18, yPos);
    doc.setTextColor(34, 197, 94); // Green for income
    doc.text(`+$${formatNumber(totalUsdIn)}`, 50, yPos);
    doc.setTextColor(239, 68, 68); // Red for expenses
    doc.text(`-$${formatNumber(totalUsdOut)}`, 90, yPos);
    yPos += 6;
  }
  
  if (kesTransactions.length > 0) {
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('KES:', 18, yPos);
    doc.setTextColor(34, 197, 94);
    doc.text(`+KSh ${formatNumber(totalKesIn)}`, 50, yPos);
    doc.setTextColor(239, 68, 68);
    doc.text(`-KSh ${formatNumber(totalKesOut)}`, 90, yPos);
  }
  
  // Transaction Table
  const tableData = transactions.map(transaction => {
    const date = new Date(transaction.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const recipientName = transaction.recipientDetails?.name || 
      (transaction.type === 'deposit' ? 'Wallet Top-up' : 
       transaction.type === 'withdraw' ? 'Bank Withdrawal' : 
       transaction.type === 'card_purchase' ? 'Virtual Card' :
       transaction.type === 'exchange' ? 'Currency Exchange' : 'Transaction');
    
    const prefix = (transaction.type === 'send' || transaction.type === 'withdraw' || 
                    transaction.type === 'card_purchase' || transaction.type === 'exchange') ? '-' : '+';
    
    const amount = `${prefix}${getCurrencySymbol(transaction.currency)}${formatNumber(transaction.amount)}`;
    
    return [
      date,
      recipientName,
      amount,
      transaction.currency?.toUpperCase() || 'USD',
      transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
    ];
  });
  
  autoTable(doc, {
    startY: 130,
    head: [['Date', 'Description', 'Amount', 'Currency', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: greenColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkColor
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      doc.text(
        'GreenPay - Trusted International Money Transfer Service',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
      
      doc.setFontSize(7);
      doc.text(
        'support@greenpay.world | www.greenpay.world',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }
  });
  
  // Return PDF as buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
