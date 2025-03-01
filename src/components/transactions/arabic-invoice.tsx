"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface Transaction {
  id: string;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  total: number;
  amountPaid: number;
  remainingAmount: number;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "CHECK" | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
  } | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
  items: TransactionItem[];
}

export function generateArabicInvoice(transaction: Transaction) {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add company logo and header
    doc.setFontSize(24);
    doc.text("Olive Peace - زيتون سلام", doc.internal.pageSize.width / 2, 20, { align: "center" });
    
    // Add invoice title
    doc.setFontSize(18);
    doc.text("INVOICE - فاتورة", doc.internal.pageSize.width / 2, 30, { align: "center" });
    
    // Add invoice information
    doc.setFontSize(12);
    
    // Left side information (English)
    doc.text("Invoice Number:", 20, 45);
    doc.text(transaction.id.substring(0, 8), 80, 45);
    
    doc.text("Date:", 20, 55);
    doc.text(new Date(transaction.createdAt).toLocaleDateString("en-US"), 80, 55);
    
    doc.text("Transaction Type:", 20, 65);
    doc.text(transaction.type, 80, 65);
    
    // Right side information (English)
    if (transaction.type === "SALE" && transaction.client) {
      doc.text("Client:", 120, 45);
      doc.text(transaction.client.name, 160, 45);
    } else if (transaction.type === "PURCHASE" && transaction.supplier) {
      doc.text("Supplier:", 120, 45);
      doc.text(transaction.supplier.name, 160, 45);
    }
    
    doc.text("Status:", 120, 55);
    doc.text(transaction.status, 160, 55);
    
    // Add items table
    doc.setFontSize(10);
    
    // Define table headers and body
    const tableHeaders = ["Product", "Quantity", "Price", "Total"];
    
    const tableBody = transaction.items.map(item => [
      item.product.name,
      `${item.quantity} ${item.product.unit}`,
      `DH ${item.price.toFixed(2)}`,
      `DH ${(item.quantity * item.price).toFixed(2)}`,
    ]);
    
    // Add table
    autoTable(doc, {
      startY: 80,
      head: [tableHeaders],
      body: tableBody,
      theme: "grid",
      headStyles: { 
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      }
    });
    
    // Add payment information
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
    
    doc.setFontSize(14);
    doc.text("Payment Information", doc.internal.pageSize.width / 2, finalY + 10, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("Total Amount:", 20, finalY + 25);
    doc.text(`DH ${transaction.total.toFixed(2)}`, 80, finalY + 25);
    
    doc.text("Amount Paid:", 20, finalY + 35);
    doc.text(`DH ${transaction.amountPaid.toFixed(2)}`, 80, finalY + 35);
    
    doc.text("Remaining Amount:", 20, finalY + 45);
    doc.text(`DH ${transaction.remainingAmount.toFixed(2)}`, 80, finalY + 45);
    
    if (transaction.paymentMethod) {
      doc.text("Payment Method:", 120, finalY + 25);
      doc.text(transaction.paymentMethod.replace("_", " "), 160, finalY + 25);
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.text("Thank you for your business - شكرا لتعاملكم معنا", doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: "center" });
    doc.text("Olive Peace - زيتون سلام", doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
    
    // Save the PDF
    const fileName = `invoice-${transaction.id.substring(0, 8)}.pdf`;
    doc.save(fileName);
    
    // Show success message in English
    toast.success("Invoice generated successfully");
    return true;
  } catch (error) {
    console.error("Error generating invoice:", error);
    toast.error("Failed to generate invoice");
    return false;
  }
}
