import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { CertificateType } from "@/types";

export interface GenerateCertOptions {
  recipientName: string;
  recipientEmail?: string;
  recipientRollNumber?: string;
  recipientDepartment?: string;
  eventId?: string;
  eventTitle: string;
  eventDate?: string;
  certificateType: CertificateType;
  certificateNumber: string;
  issuedBy?: string;
  signatories?: Array<{ name: string; role: string }>;
}

/**
 * Generates a cryptographically random alphanumeric credential ID for e-DAM
 */
export function generateCertificateNumber(prefix = "EDAM-IARE-2026"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  }
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(bytes[i] % chars.length);
  }
  return `${prefix}-${random}`;
}

/**
 * Renders an official high-resolution e-DAM PDF certificate
 */
export async function renderCertificatePdf(params: GenerateCertOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 Landscape: 841.89 x 595.28 points (~842 x 595)
  const pageWidth = 842;
  const pageHeight = 595;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Embed Standard Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // e-DAM Palette
  const bgLight = rgb(252 / 255, 250 / 255, 255 / 255); // #FCFAFF subtle lavender white
  const deepPurple = rgb(91 / 255, 33 / 255, 182 / 255); // #5B21B6
  const vibrantPurple = rgb(139 / 255, 92 / 255, 246 / 255); // #8B5CF6
  const darkNavy = rgb(15 / 255, 23 / 255, 42 / 255); // #0F172A
  const goldAccent = rgb(217 / 255, 119 / 255, 6 / 255); // #D97706
  const textMuted = rgb(100 / 255, 116 / 255, 139 / 255); // #64748B
  const textDark = rgb(17 / 255, 24 / 255, 39 / 255); // #111827

  // 1. Background Fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: bgLight,
  });

  // 2. Decorative Outer Border (Deep Purple)
  page.drawRectangle({
    x: 20,
    y: 20,
    width: pageWidth - 40,
    height: pageHeight - 40,
    borderColor: deepPurple,
    borderWidth: 3,
  });

  // 3. Decorative Inner Gold Border
  page.drawRectangle({
    x: 26,
    y: 26,
    width: pageWidth - 52,
    height: pageHeight - 52,
    borderColor: goldAccent,
    borderWidth: 1,
  });

  // 4. Subtle Corner Accents
  const cornerSize = 24;
  // Top-left
  page.drawLine({ start: { x: 32, y: pageHeight - 32 }, end: { x: 32 + cornerSize, y: pageHeight - 32 }, color: vibrantPurple, thickness: 2 });
  page.drawLine({ start: { x: 32, y: pageHeight - 32 }, end: { x: 32, y: pageHeight - 32 - cornerSize }, color: vibrantPurple, thickness: 2 });
  // Top-right
  page.drawLine({ start: { x: pageWidth - 32, y: pageHeight - 32 }, end: { x: pageWidth - 32 - cornerSize, y: pageHeight - 32 }, color: vibrantPurple, thickness: 2 });
  page.drawLine({ start: { x: pageWidth - 32, y: pageHeight - 32 }, end: { x: pageWidth - 32, y: pageHeight - 32 - cornerSize }, color: vibrantPurple, thickness: 2 });
  // Bottom-left
  page.drawLine({ start: { x: 32, y: 32 }, end: { x: 32 + cornerSize, y: 32 }, color: vibrantPurple, thickness: 2 });
  page.drawLine({ start: { x: 32, y: 32 }, end: { x: 32, y: 32 + cornerSize }, color: vibrantPurple, thickness: 2 });
  // Bottom-right
  page.drawLine({ start: { x: pageWidth - 32, y: 32 }, end: { x: pageWidth - 32 - cornerSize, y: 32 }, color: vibrantPurple, thickness: 2 });
  page.drawLine({ start: { x: pageWidth - 32, y: 32 }, end: { x: pageWidth - 32, y: 32 + cornerSize }, color: vibrantPurple, thickness: 2 });

  // 5. Header: Institution & Community Branding
  const instTitle = "INSTITUTE OF AERONAUTICAL ENGINEERING";
  const instSub = "Autonomous Institution | Dundigal, Hyderabad - 500043, Telangana";
  const communityTitle = "e-DAM â€” e-Designing and Marketing Student Community";

  const instTitleWidth = fontBold.widthOfTextAtSize(instTitle, 16);
  page.drawText(instTitle, {
    x: (pageWidth - instTitleWidth) / 2,
    y: pageHeight - 65,
    size: 16,
    font: fontBold,
    color: darkNavy,
  });

  const instSubWidth = fontRegular.widthOfTextAtSize(instSub, 9.5);
  page.drawText(instSub, {
    x: (pageWidth - instSubWidth) / 2,
    y: pageHeight - 80,
    size: 9.5,
    font: fontRegular,
    color: textMuted,
  });

  const commWidth = fontBold.widthOfTextAtSize(communityTitle, 13);
  page.drawText(communityTitle, {
    x: (pageWidth - commWidth) / 2,
    y: pageHeight - 102,
    size: 13,
    font: fontBold,
    color: deepPurple,
  });

  // Dividing Line
  page.drawLine({
    start: { x: 180, y: pageHeight - 115 },
    end: { x: pageWidth - 180, y: pageHeight - 115 },
    color: goldAccent,
    thickness: 1.5,
  });

  // 6. Certificate Title Banner
  let certTypeLabel = "CERTIFICATE OF PARTICIPATION";
  if (params.certificateType === "excellence") certTypeLabel = "CERTIFICATE OF EXCELLENCE";
  else if (params.certificateType === "merit") certTypeLabel = "CERTIFICATE OF MERIT";
  else if (params.certificateType === "appreciation") certTypeLabel = "CERTIFICATE OF APPRECIATION";
  else if (params.certificateType === "speaker") certTypeLabel = "HONORARY SPEAKER COMMENDATION";
  else if (params.certificateType === "coordinator") certTypeLabel = "CERTIFICATE OF LEADERSHIP & COORDINATION";

  const certTypeWidth = fontBold.widthOfTextAtSize(certTypeLabel, 24);
  page.drawText(certTypeLabel, {
    x: (pageWidth - certTypeWidth) / 2,
    y: pageHeight - 155,
    size: 24,
    font: fontBold,
    color: darkNavy,
  });

  const presentationText = "PROUDLY PRESENTED TO";
  const presWidth = fontBold.widthOfTextAtSize(presentationText, 10);
  page.drawText(presentationText, {
    x: (pageWidth - presWidth) / 2,
    y: pageHeight - 185,
    size: 10,
    font: fontBold,
    color: goldAccent,
  });

  // 7. Recipient Name
  const recipient = params.recipientName.toUpperCase();
  const nameSize = recipient.length > 25 ? 24 : 28;
  const nameWidth = fontBold.widthOfTextAtSize(recipient, nameSize);
  page.drawText(recipient, {
    x: (pageWidth - nameWidth) / 2,
    y: pageHeight - 225,
    size: nameSize,
    font: fontBold,
    color: deepPurple,
  });

  // Name underline
  page.drawLine({
    start: { x: Math.max(160, (pageWidth - nameWidth) / 2 - 20), y: pageHeight - 235 },
    end: { x: Math.min(pageWidth - 160, (pageWidth + nameWidth) / 2 + 20), y: pageHeight - 235 },
    color: vibrantPurple,
    thickness: 1,
  });

  // Recipient Sub-details (Roll Number / Department)
  let subDetails = "";
  if (params.recipientRollNumber) subDetails += `Roll No: ${params.recipientRollNumber}`;
  if (params.recipientDepartment) {
    subDetails += subDetails ? `  |  Department: ${params.recipientDepartment}` : `Department: ${params.recipientDepartment}`;
  }
  if (subDetails) {
    const subWidth = fontRegular.widthOfTextAtSize(subDetails, 10.5);
    page.drawText(subDetails, {
      x: (pageWidth - subWidth) / 2,
      y: pageHeight - 255,
      size: 10.5,
      font: fontRegular,
      color: textDark,
    });
  }

  // 8. Body Text
  const bodyText1 = `for exemplary contribution and active participation in the technical initiative`;
  const body1Width = fontRegular.widthOfTextAtSize(bodyText1, 12);
  page.drawText(bodyText1, {
    x: (pageWidth - body1Width) / 2,
    y: pageHeight - 285,
    size: 12,
    font: fontRegular,
    color: textMuted,
  });

  const eventTitleText = `"${params.eventTitle}"`;
  const eventTitleWidth = fontBold.widthOfTextAtSize(eventTitleText, 15);
  page.drawText(eventTitleText, {
    x: (pageWidth - eventTitleWidth) / 2,
    y: pageHeight - 310,
    size: 15,
    font: fontBold,
    color: darkNavy,
  });

  const eventDateText = params.eventDate ? `organized on ${params.eventDate} by e-DAM IARE.` : `organized by e-DAM at Institute of Aeronautical Engineering.`;
  const eventDateWidth = fontOblique.widthOfTextAtSize(eventDateText, 11);
  page.drawText(eventDateText, {
    x: (pageWidth - eventDateWidth) / 2,
    y: pageHeight - 330,
    size: 11,
    font: fontOblique,
    color: textMuted,
  });

  // 9. QR Code Verification Generation
  const verifyOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://e-dam-iare.vercel.app";
  const verificationUrl = `${verifyOrigin}/verify/${encodeURIComponent(params.certificateNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 256,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });
  const base64Data = qrDataUrl.split(",")[1] || "";
  const binaryString = atob(base64Data);
  const qrImageBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    qrImageBytes[i] = binaryString.charCodeAt(i);
  }
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  
  const qrSize = 65;
  const qrX = 65;
  const qrY = 70;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // QR Code Subtext
  page.drawText("Scan to verify", {
    x: qrX,
    y: qrY - 12,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText(params.certificateNumber, {
    x: qrX,
    y: qrY - 22,
    size: 7.5,
    font: fontBold,
    color: deepPurple,
  });

  // 10. Signatures Section
  const defaultSignatories = params.signatories || [
    { name: "Faculty Coordinator", role: "Faculty Advisor, e-DAM" },
    { name: "K. Sai Charan", role: "Community Lead, e-DAM" },
    { name: "Dr. L. V. Narasimha Prasad", role: "Principal, IARE" },
  ];

  const sigStartX = 240;
  const sigSpacing = (pageWidth - sigStartX - 60) / defaultSignatories.length;

  defaultSignatories.forEach((sig, index) => {
    const xPos = sigStartX + index * sigSpacing + 20;
    const yLine = 95;

    // Signature line
    page.drawLine({
      start: { x: xPos, y: yLine },
      end: { x: xPos + 130, y: yLine },
      color: rgb(200 / 255, 205 / 255, 215 / 255),
      thickness: 1,
    });

    // Signature name
    page.drawText(sig.name, {
      x: xPos,
      y: yLine - 15,
      size: 10,
      font: fontBold,
      color: darkNavy,
    });

    // Signature role
    page.drawText(sig.role, {
      x: xPos,
      y: yLine - 27,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });
  });

  // 11. Footer Notice
  const footerNotice = "Official Credential Document â€¢ Verified by e-DAM IARE Institutional Registry";
  const footerNoticeWidth = fontRegular.widthOfTextAtSize(footerNotice, 7.5);
  page.drawText(footerNotice, {
    x: (pageWidth - footerNoticeWidth) / 2,
    y: 35,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });

  return await pdfDoc.save();
}

/**
 * Triggers browser file download of the PDF certificate
 */
export function downloadCertificateBuffer(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

