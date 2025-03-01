/**
 * This file adds Arabic font support to jsPDF
 */

import { jsPDF } from "jspdf";

// Function to add Arabic fonts to jsPDF
export function addFonts(doc: jsPDF) {
  // Add Amiri font (a popular Arabic font)
  // In a real implementation, you would need to include the actual font files
  // and use doc.addFont() to load them
  
  // For demonstration purposes, we're using the default font
  // In a production environment, you would:
  // 1. Download the Amiri font files (regular, bold, etc.)
  // 2. Convert them to base64 or include them in your project
  // 3. Add them to jsPDF using doc.addFont()
  
  // Example of how you would add a real font:
  // import amiriRegular from './fonts/Amiri-Regular.ttf';
  // doc.addFont(amiriRegular, "Amiri", "normal");
  
  // For now, we'll just use the default font
  doc.setFont("Helvetica", "normal");
}
