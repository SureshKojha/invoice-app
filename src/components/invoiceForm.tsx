import { useState, type JSX } from "react";
import {
  Box,
  Chip,
  TextField,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
  Divider,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import jsPDF from "jspdf";

type InvoiceItem = {
  name: string;
  quantity: string;
  rate: string;
};

const InvoiceForm = (): JSX.Element => {
  const [companyName, setCompanyName] = useState<string>("");
  const [companyEmail, setCompanyEmail] = useState<string>("");
  const [companyPhone, setCompanyPhone] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toLocaleDateString("en-GB"),
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [discount, setDiscount] = useState<string>("0");
  const [taxRate, setTaxRate] = useState<string>("18");
  const [notes, setNotes] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [isPro, setIsPro] = useState<boolean>(true);

  const [items, setItems] = useState<InvoiceItem[]>([
    { name: "", quantity: "1", rate: "" },
  ]);

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string,
  ) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: "1", rate: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      return;
    }
    const updated = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(updated);
  };

  const handleLogoUpload = (file: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.rate || 0);
    return sum + qty * rate;
  }, 0);
  const discountValue = Number(discount || 0);
  const taxableAmount = Math.max(subtotal - discountValue, 0);
  const taxAmount = taxableAmount * (Number(taxRate || 0) / 100);
  const total = taxableAmount + taxAmount;

  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getLogoFormat = (dataUrl: string): "PNG" | "JPEG" =>
    dataUrl.includes("image/png") ? "PNG" : "JPEG";

  const formatDateForPdf = (value: string): string => {
    if (!value) {
      return "";
    }

    if (value.includes("/")) {
      return value;
    }

    const parts = value.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }

    return value;
  };

  const addLine = (
    doc: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    maxWidth: number,
  ) => {
    const textLines = value ? doc.splitTextToSize(value, maxWidth) : [""];
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(textLines, x + 42, y);

    return y + textLines.length * 6;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 16;
    let invoiceMetaStartY = y + 14;

    if (logoDataUrl) {
      const logoBoxX = 14;
      const logoBoxY = y - 5;
      const logoBoxWidth = 32;
      const logoBoxHeight = 20;
      const logoPadding = 2;

      doc.setDrawColor(220);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        logoBoxX,
        logoBoxY,
        logoBoxWidth,
        logoBoxHeight,
        2,
        2,
        "FD",
      );
      doc.addImage(
        logoDataUrl,
        getLogoFormat(logoDataUrl),
        logoBoxX + logoPadding,
        logoBoxY + logoPadding,
        logoBoxWidth - logoPadding * 2,
        logoBoxHeight - logoPadding * 2,
      );

      const logoBottomY = logoBoxY + logoBoxHeight;
      invoiceMetaStartY = Math.max(invoiceMetaStartY, logoBottomY + 8);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("INVOICE", 150, y + 4);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    y = addLine(doc, "Invoice #", invoiceNumber, 14, invoiceMetaStartY, 150);
    y = addLine(doc, "Invoice Date", formatDateForPdf(invoiceDate), 14, y, 150);
    y = addLine(doc, "Due Date", formatDateForPdf(dueDate), 14, y, 150);

    y += 4;
    doc.setDrawColor(210);
    doc.line(14, y, 196, y);
    y += 8;

    y = addLine(
      doc,
      "From",
      `${companyName} (${companyEmail})${companyPhone ? `, ${companyPhone}` : ""}`,
      14,
      y,
      150,
    );
    y = addLine(
      doc,
      "Bill To",
      `${customer} (${customerEmail})${customerPhone ? `, ${customerPhone}` : ""}`,
      14,
      y,
      150,
    );

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Items", 14, y);
    y += 4;

    const tableX = 14;
    const tableW = 182;
    const colItemW = 104;
    const colQtyW = 18;
    const colRateW = 30;
    //const colTotalW = 30;
    const headerH = 8;

    const xItem = tableX;
    const xQty = xItem + colItemW;
    const xRate = xQty + colQtyW;
    const xTotal = xRate + colRateW;
    const xEnd = tableX + tableW;

    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(tableX, y, tableW, headerH, "FD");
    doc.rect(tableX, y, tableW, headerH);
    doc.line(xQty, y, xQty, y + headerH);
    doc.line(xRate, y, xRate, y + headerH);
    doc.line(xTotal, y, xTotal, y + headerH);

    doc.text("Item", xItem + 2, y + 5.5);
    doc.text("Qty", xQty + colQtyW / 2, y + 5.5, { align: "center" });
    doc.text("Rate", xRate + colRateW - 2, y + 5.5, { align: "right" });
    doc.text("Total", xEnd - 2, y + 5.5, { align: "right" });
    y += headerH;

    doc.setFont("helvetica", "normal");
    items.forEach((item, index) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const lineTotal = qty * rate;
      const itemLabel = `${index + 1}. ${item.name || "Service"}`;
      const itemLines = doc.splitTextToSize(itemLabel, colItemW - 4);
      const rowH = Math.max(8, itemLines.length * 5 + 2);

      doc.rect(tableX, y, tableW, rowH);
      doc.line(xQty, y, xQty, y + rowH);
      doc.line(xRate, y, xRate, y + rowH);
      doc.line(xTotal, y, xTotal, y + rowH);

      doc.text(itemLines, xItem + 2, y + 5);
      doc.text(String(qty), xQty + colQtyW / 2, y + rowH / 2 + 1.5, {
        align: "center",
      });
      doc.text(money(rate), xRate + colRateW - 2, y + rowH / 2 + 1.5, {
        align: "right",
      });
      doc.text(money(lineTotal), xEnd - 2, y + rowH / 2 + 1.5, {
        align: "right",
      });

      y += rowH;
    });

    y += 4;
    doc.setDrawColor(210);
    doc.line(14, y, 196, y);
    y += 8;

    y = addLine(doc, "Subtotal", money(subtotal), 120, y, 74);
    y = addLine(doc, "Discount", money(discountValue), 120, y, 74);
    y = addLine(doc, `Tax (${taxRate || 0}%)`, money(taxAmount), 120, y, 74);

    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: ${money(total)}`, 120, y + 2);

    y += 12;
    if (paymentTerms) {
      y = addLine(doc, "Payment Terms", paymentTerms, 14, y, 176);
    }
    if (notes) {
      addLine(doc, "Notes", notes, 14, y, 176);
    }

    if (!isPro) {
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(52);
      doc.setTextColor(230, 230, 230);
      doc.text("SK Invoice", pageW / 2, pageH / 2, {
        align: "center",
        angle: 45,
      });
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`${invoiceNumber || "invoice"}.pdf`);
  };

  return (
    <Paper className="invoice-paper" elevation={0}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h5" className="section-title">
              Invoice Builder
            </Typography>
            {isPro ? (
              <Chip
                label="PRO"
                size="small"
                sx={{
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                }}
              />
            ) : (
              <Tooltip title="Upgrade to Pro to remove watermark from PDF">
                <Chip
                  label="FREE"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.7rem", cursor: "pointer" }}
                  onClick={() => setIsPro(true)}
                />
              </Tooltip>
            )}
          </Stack>
          {!isPro && (
            <Typography variant="caption" sx={{ color: "#e67e22", mt: 0.5, display: "block" }}>
              Free version — PDF includes watermark.{" "}
              <Box
                component="span"
                sx={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={() => setIsPro(true)}
              >
                Upgrade to Pro
              </Box>
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={generatePDF}>
            Download PDF
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            Business Details
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Business Name"
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Company Email"
            fullWidth
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Business Mobile"
            fullWidth
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sx={{ pt: { xs: 2, md: 1 } }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            Customer Details
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Customer Name"
            fullWidth
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Client Email"
            fullWidth
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Customer Mobile"
            fullWidth
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Invoice Number"
            fullWidth
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Invoice Date"
            placeholder="dd/mm/yyyy"
            fullWidth
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Due Date"
            placeholder="dd/mm/yyyy"
            fullWidth
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Currency"
            fullWidth
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Discount"
            type="number"
            fullWidth
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">{currency}</InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Tax Rate"
            type="number"
            fullWidth
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>

      <Box
        className="logo-upload-zone"
        sx={{ mt: 3, opacity: isPro ? 1 : 0.55, pointerEvents: isPro ? "auto" : "none" }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2">Company Logo</Typography>
          {!isPro && (
            <Chip
              label="PRO only"
              size="small"
              sx={{ fontSize: "0.65rem", height: 18, bgcolor: "#fef3c7", color: "#92400e", pointerEvents: "auto" }}
            />
          )}
        </Stack>
        {!isPro && (
          <Typography variant="caption" sx={{ color: "#b45309", display: "block", mb: 0.5 }}>
            Logo on PDF is a Pro feature.{" "}
            <Box
              component="span"
              sx={{ textDecoration: "underline", cursor: "pointer", pointerEvents: "auto" }}
              onClick={() => setIsPro(true)}
            >
              Upgrade to Pro
            </Box>
          </Typography>
        )}
        <Button variant="text" component="label" sx={{ mt: 0.5 }} disabled={!isPro}>
          Upload Logo
          <input
            hidden
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
          />
        </Button>
        {logoDataUrl ? (
          <Box
            component="img"
            src={logoDataUrl}
            alt="Company logo"
            className="logo-preview"
          />
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            PNG or JPEG logo appears on invoice PDFs.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Line Items
      </Typography>
      {items.map((item, index) => (
        <Grid container spacing={2} key={index} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={5}>
            <TextField
              label="Item / Service"
              fullWidth
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Qty"
              type="number"
              fullWidth
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(index, "quantity", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Rate"
              type="number"
              fullWidth
              value={item.rate}
              onChange={(e) => handleItemChange(index, "rate", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              color="error"
              variant="outlined"
              fullWidth
              onClick={() => removeItem(index)}
            >
              Remove
            </Button>
          </Grid>
        </Grid>
      ))}

      <Button sx={{ mt: 1 }} onClick={addItem}>
        Add Item
      </Button>

      <Box className="totals-panel" sx={{ mt: 3 }}>
        <Typography>Subtotal: {money(subtotal)}</Typography>
        <Typography>Discount: {money(discountValue)}</Typography>
        <Typography>
          Tax ({taxRate || 0}%): {money(taxAmount)}
        </Typography>
        <Typography variant="h6">Grand Total: {money(total)}</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Payment Remarks / Terms"
            multiline
            minRows={3}
            fullWidth
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Internal Notes"
            multiline
            minRows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InvoiceForm;
