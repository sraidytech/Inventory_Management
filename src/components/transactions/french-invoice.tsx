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

// Function to get French translation for payment method
function getFrenchPaymentMethod(method: string | null | undefined): string {
  if (!method) return "Non spécifié";
  
  switch (method) {
    case "CASH":
      return "Espèces";
    case "BANK_TRANSFER":
      return "Virement bancaire";
    case "CHECK":
      return "Chèque";
    default:
      return method;
  }
}

// Format date to dd-mm-yyyy format
function formatDateFrench(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function generateFrenchInvoice(transaction: Transaction) {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Define colors for modern design
    const colors = {
      primary: "#556B2F", // Olive Green
      secondary: "#8FBC8F", // Dark Sea Green
      accent: "#A9A9A9", // Dark Gray
      text: "#1F2937", // Gray 800
      lightGray: "#F3F4F6" // Gray 100
    };
    
    // Add header with logo placeholder and company info
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Zaytoun Selam", 20, 25);
    
    // Add invoice title and number
    doc.setFillColor(colors.lightGray);
    doc.rect(0, 45, doc.internal.pageSize.width, 20, "F");
    
    doc.setTextColor(colors.text);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`FACTURE #${transaction.id.substring(0, 8).toUpperCase()}`, 20, 58);
    
    // Add date and transaction info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const dateText = `Date: ${formatDateFrench(transaction.createdAt)}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, doc.internal.pageSize.width - 20 - dateWidth, 58);
    
    // Add client/supplier information
    doc.setFontSize(11);
    doc.setTextColor(colors.text);
    
    // Left side - Company info
    doc.setFont("helvetica", "bold");
    doc.text("De:", 20, 80);
    doc.setFont("helvetica", "normal");
    doc.text("Zaytoun Selam SARL", 20, 87);
    doc.text("123 Avenue Mohammed V", 20, 94);
    doc.text("Casablanca, Maroc", 20, 101);
    doc.text("contact@zaytounselam.com", 20, 108);
    doc.text("+212 522 123 456", 20, 115);
    
    // Right side - Client/Supplier info
    doc.setFont("helvetica", "bold");
    doc.text("À:", 120, 80);
    doc.setFont("helvetica", "normal");
    
    if (transaction.type === "SALE" && transaction.client) {
      doc.text(transaction.client.name, 120, 87);
    } else if (transaction.type === "PURCHASE" && transaction.supplier) {
      doc.text(transaction.supplier.name, 120, 87);
    }
    
    // Add transaction details
    doc.setFillColor(colors.primary);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    doc.rect(20, 130, 80, 10, "F");
    doc.text("Détails de la transaction", 22, 137);
    
    doc.setTextColor(colors.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (transaction.paymentMethod) {
      doc.text("Méthode de paiement:", 20, 150);
      doc.text(getFrenchPaymentMethod(transaction.paymentMethod), 60, 150);
    }
    
    if (transaction.reference) {
      doc.text("Référence:", 20, 158);
      doc.text(transaction.reference, 60, 158);
    }
    
    // Add items table
    doc.setFontSize(10);
    
    // Define table headers and body
    const tableHeaders = ["Produit", "Quantité", "Prix unitaire", "Total"];
    
    const tableBody = transaction.items.map(item => [
      item.product.name,
      `${item.quantity} ${item.product.unit}`,
      `${item.price.toFixed(2)} DH`,
      `${(item.quantity * item.price).toFixed(2)} DH`
    ]);
    
    // Add table
    autoTable(doc, {
      startY: 185,
      head: [tableHeaders],
      body: tableBody,
      theme: "grid",
      headStyles: { 
        fillColor: [85, 107, 47], // Olive Green
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });
    
    // Add payment information
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;
    
    // Summary box
    doc.setFillColor(colors.lightGray);
    doc.rect(120, finalY + 10, 70, 50, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(colors.text);
    
    doc.setFont("helvetica", "normal");
    doc.text("Sous-total:", 125, finalY + 20);
    doc.text("Total:", 125, finalY + 30);
    doc.text("Montant payé:", 125, finalY + 40);
    doc.text("Reste à payer:", 125, finalY + 50);
    
    doc.setFont("helvetica", "bold");
    doc.text(`${transaction.total.toFixed(2)} DH`, 180, finalY + 20, { align: "right" });
    doc.text(`${transaction.total.toFixed(2)} DH`, 180, finalY + 30, { align: "right" });
    doc.text(`${transaction.amountPaid.toFixed(2)} DH`, 180, finalY + 40, { align: "right" });
    doc.text(`${transaction.remainingAmount.toFixed(2)} DH`, 180, finalY + 50, { align: "right" });
    
    // Add notes if available
    if (transaction.notes) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 20, finalY + 20);
      doc.setFont("helvetica", "normal");
      doc.text(transaction.notes, 20, finalY + 30);
    }
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFillColor(colors.primary);
    doc.rect(0, pageHeight - 25, doc.internal.pageSize.width, 25, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Merci pour votre confiance", doc.internal.pageSize.width / 2, pageHeight - 15, { align: "center" });
    doc.text("Zaytoun Selam SARL | www.zaytounselam.com | +212 522 123 456", doc.internal.pageSize.width / 2, pageHeight - 8, { align: "center" });
    
    // Save the PDF
    const fileName = `facture-${transaction.id.substring(0, 8)}.pdf`;
    doc.save(fileName);
    
    // Show success message
    toast.success("Facture générée avec succès");
    return true;
  } catch (error) {
    console.error("Error generating French invoice:", error);
    toast.error("Échec de la génération de la facture");
    return false;
  }
}
