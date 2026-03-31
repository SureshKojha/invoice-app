import { useEffect, useState, type JSX } from "react";
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
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import jsPDF from "jspdf";

const CURRENCIES: {
  code: string;
  symbol: string;
  label: string;
  defaultTax: number;
  taxLabel: string;
}[] = [
  { code: "INR", symbol: "₹",   label: "₹ INR – Indian Rupee",        defaultTax: 18,  taxLabel: "GST" },
  { code: "USD", symbol: "$",   label: "$ USD – US Dollar",           defaultTax: 0,   taxLabel: "Tax (varies by state)" },
  { code: "EUR", symbol: "€",   label: "€ EUR – Euro",                defaultTax: 20,  taxLabel: "VAT" },
  { code: "GBP", symbol: "£",   label: "£ GBP – British Pound",       defaultTax: 20,  taxLabel: "VAT" },
  { code: "AED", symbol: "د.إ", label: "د.إ AED – UAE Dirham",        defaultTax: 5,   taxLabel: "VAT" },
  { code: "SGD", symbol: "S$",  label: "S$ SGD – Singapore Dollar",   defaultTax: 9,   taxLabel: "GST" },
  { code: "AUD", symbol: "A$",  label: "A$ AUD – Australian Dollar",  defaultTax: 10,  taxLabel: "GST" },
  { code: "CAD", symbol: "C$",  label: "C$ CAD – Canadian Dollar",    defaultTax: 5,   taxLabel: "GST" },
  { code: "JPY", symbol: "¥",   label: "¥ JPY – Japanese Yen",        defaultTax: 10,  taxLabel: "Consumption Tax" },
  { code: "CHF", symbol: "CHF", label: "CHF – Swiss Franc",           defaultTax: 8.1, taxLabel: "VAT" },
];

type GstType = "CGST_SGST" | "IGST" | "NONE";

type InvoiceItem = {
  name: string;
  quantity: string;
  rate: string;
};

type LabelSettings = {
  businessName: string;
  companyEmail: string;
  businessPhone: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  discount: string;
  taxRate: string;
  itemName: string;
  itemQty: string;
  itemRate: string;
  paymentTerms: string;
  notes: string;
};

type DefaultSettings = {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyGSTIN: string;
  customerGSTIN: string;
  currency: string;
  discount: string;
  taxRate: string;
  gstType: GstType;
  paymentTerms: string;
  notes: string;
};

const LABELS_STORAGE_KEY = "invoice-app-label-settings";
const DEFAULTS_STORAGE_KEY = "invoice-app-default-settings";

const DEFAULT_LABELS: LabelSettings = {
  businessName: "Business Name",
  companyEmail: "Company Email",
  businessPhone: "Business Mobile",
  customerName: "Customer Name",
  customerEmail: "Client Email",
  customerPhone: "Customer Mobile",
  invoiceNumber: "Invoice Number",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  discount: "Discount",
  taxRate: "Tax Rate",
  itemName: "Item / Service",
  itemQty: "Qty",
  itemRate: "Rate",
  paymentTerms: "Terms",
  notes: "Notes",
};

const DEFAULT_SETTINGS: DefaultSettings = {
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyGSTIN: "",
  customerGSTIN: "",
  currency: "INR",
  discount: "0",
  taxRate: "18",
  gstType: "CGST_SGST",
  paymentTerms: "",
  notes: "",
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

  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
    const found = CURRENCIES.find((c) => c.code === newCode);
    setTaxRate(String(found?.defaultTax ?? 0));
  };
  const [notes, setNotes] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [isPro, setIsPro] = useState<boolean>(true);
  const [gstType, setGstType] = useState<GstType>("CGST_SGST");
  const [companyGSTIN, setCompanyGSTIN] = useState<string>("");
  const [customerGSTIN, setCustomerGSTIN] = useState<string>("");
  const [labels, setLabels] = useState<LabelSettings>(DEFAULT_LABELS);
  const [defaultSettings, setDefaultSettings] =
    useState<DefaultSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(true);

  const [items, setItems] = useState<InvoiceItem[]>([
    { name: "", quantity: "1", rate: "" },
  ]);

  useEffect(() => {
    try {
      const savedLabels = localStorage.getItem(LABELS_STORAGE_KEY);
      if (savedLabels) {
        setLabels({ ...DEFAULT_LABELS, ...(JSON.parse(savedLabels) as Partial<LabelSettings>) });
      }

      const savedDefaults = localStorage.getItem(DEFAULTS_STORAGE_KEY);
      if (savedDefaults) {
        const parsed = {
          ...DEFAULT_SETTINGS,
          ...(JSON.parse(savedDefaults) as Partial<DefaultSettings>),
        };
        setDefaultSettings(parsed);
        setCompanyName(parsed.companyName);
        setCompanyEmail(parsed.companyEmail);
        setCompanyPhone(parsed.companyPhone);
        setCompanyGSTIN(parsed.companyGSTIN);
        setCustomerGSTIN(parsed.customerGSTIN);
        setCurrency(parsed.currency);
        setDiscount(parsed.discount);
        setTaxRate(parsed.taxRate);
        setGstType(parsed.gstType);
        setPaymentTerms(parsed.paymentTerms);
        setNotes(parsed.notes);
      }
    } catch {
      // Ignore malformed storage values and continue with defaults.
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels));
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(defaultSettings));
  };

  const applyDefaultValues = () => {
    setCompanyName(defaultSettings.companyName);
    setCompanyEmail(defaultSettings.companyEmail);
    setCompanyPhone(defaultSettings.companyPhone);
    setCompanyGSTIN(defaultSettings.companyGSTIN);
    setCustomerGSTIN(defaultSettings.customerGSTIN);
    setCurrency(defaultSettings.currency);
    setDiscount(defaultSettings.discount);
    setTaxRate(defaultSettings.taxRate);
    setGstType(defaultSettings.gstType);
    setPaymentTerms(defaultSettings.paymentTerms);
    setNotes(defaultSettings.notes);
  };

  const resetSettings = () => {
    setLabels(DEFAULT_LABELS);
    setDefaultSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(LABELS_STORAGE_KEY);
    localStorage.removeItem(DEFAULTS_STORAGE_KEY);
  };

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

  const isInr = currency === "INR";
  const cgst = isInr && gstType === "CGST_SGST" ? taxAmount / 2 : 0;
  const sgst = isInr && gstType === "CGST_SGST" ? taxAmount / 2 : 0;
  const igst = isInr && gstType === "IGST" ? taxAmount : 0;

  const currencyMeta = CURRENCIES.find((c) => c.code === currency);
  const currencySymbol = currencyMeta?.symbol ?? currency;
  const taxLabel = currencyMeta?.taxLabel ?? "Tax";
  const money = (value: number) =>
    `${currencySymbol} ${value.toLocaleString("en-IN", {
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

    y = addLine(doc, labels.invoiceNumber, invoiceNumber, 14, invoiceMetaStartY, 150);
    y = addLine(doc, labels.invoiceDate, formatDateForPdf(invoiceDate), 14, y, 150);
    y = addLine(doc, labels.dueDate, formatDateForPdf(dueDate), 14, y, 150);

    y += 4;
    doc.setDrawColor(210);
    doc.line(14, y, 196, y);
    y += 8;

    y = addLine(
      doc,
      "From",
      `${companyName} (${companyEmail})${companyPhone ? `, ${companyPhone}` : ""}${companyGSTIN ? ` | GSTIN: ${companyGSTIN}` : ""}`,
      14,
      y,
      150,
    );
    y = addLine(
      doc,
      "Bill To",
      `${customer} (${customerEmail})${customerPhone ? `, ${customerPhone}` : ""}${customerGSTIN ? ` | GSTIN: ${customerGSTIN}` : ""}`,
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
    if (isInr && gstType === "CGST_SGST") {
      y = addLine(doc, `CGST (${(Number(taxRate || 0) / 2).toFixed(1)}%)`, money(cgst), 120, y, 74);
      y = addLine(doc, `SGST (${(Number(taxRate || 0) / 2).toFixed(1)}%)`, money(sgst), 120, y, 74);
    } else if (isInr && gstType === "IGST") {
      y = addLine(doc, `IGST (${taxRate || 0}%)`, money(igst), 120, y, 74);
    } else {
      y = addLine(doc, `${taxLabel} (${taxRate || 0}%)`, money(taxAmount), 120, y, 74);
    }

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
      <Grid container spacing={2.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4} lg={3} sx={{ order: { xs: 0, md: 2 } }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #d7e3ee",
              background: "linear-gradient(160deg, #f4f8ff, #eef6f1)",
              position: { md: "sticky" },
              top: 12,
              fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
              "& .MuiInputLabel-root": {
                fontWeight: 600,
                fontSize: "0.82rem",
                letterSpacing: "0.01em",
              },
              "& .MuiInputBase-input": {
                fontSize: "0.88rem",
                fontWeight: 500,
              },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Form Settings
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() => setSettingsOpen((prev) => !prev)}
                sx={{ minWidth: 0, fontSize: "0.75rem", textTransform: "none" }}
              >
                {settingsOpen ? "Collapse" : "Expand"}
              </Button>
            </Stack>
            <Typography variant="caption" sx={{ display: "block", mb: 1.5, opacity: 0.75 }}>
              Customize field labels and save your defaults locally.
            </Typography>

            <Collapse in={settingsOpen}>
              <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 800, letterSpacing: "0.03em", color: "#174a7d" }}
                >
                  Label Settings
                </Typography>
                <Stack spacing={1.1}>
                  <TextField
                    label="Label: Business Name"
                    size="small"
                    value={labels.businessName}
                    onChange={(e) => setLabels((prev) => ({ ...prev, businessName: e.target.value }))}
                  />
                  <TextField
                    label="Label: Company Email"
                    size="small"
                    value={labels.companyEmail}
                    onChange={(e) => setLabels((prev) => ({ ...prev, companyEmail: e.target.value }))}
                  />
                  <TextField
                    label="Label: Business Mobile"
                    size="small"
                    value={labels.businessPhone}
                    onChange={(e) => setLabels((prev) => ({ ...prev, businessPhone: e.target.value }))}
                  />
                  <TextField
                    label="Label: Customer Name"
                    size="small"
                    value={labels.customerName}
                    onChange={(e) => setLabels((prev) => ({ ...prev, customerName: e.target.value }))}
                  />
                  <TextField
                    label="Label: Client Email"
                    size="small"
                    value={labels.customerEmail}
                    onChange={(e) => setLabels((prev) => ({ ...prev, customerEmail: e.target.value }))}
                  />
                  <TextField
                    label="Label: Customer Mobile"
                    size="small"
                    value={labels.customerPhone}
                    onChange={(e) => setLabels((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  />
                  <TextField
                    label="Label: Invoice Number"
                    size="small"
                    value={labels.invoiceNumber}
                    onChange={(e) => setLabels((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                  />
                  <TextField
                    label="Label: Discount"
                    size="small"
                    value={labels.discount}
                    onChange={(e) => setLabels((prev) => ({ ...prev, discount: e.target.value }))}
                  />
                  <TextField
                    label="Label: Tax Rate"
                    size="small"
                    value={labels.taxRate}
                    onChange={(e) => setLabels((prev) => ({ ...prev, taxRate: e.target.value }))}
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 800, letterSpacing: "0.03em", color: "#174a7d" }}
                >
                  Default Values
                </Typography>
                <Stack spacing={1.1}>
                  <TextField
                    label="Default Business Name"
                    size="small"
                    value={defaultSettings.companyName}
                    onChange={(e) =>
                      setDefaultSettings((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                  />
                  <TextField
                    label="Default Company Email"
                    size="small"
                    value={defaultSettings.companyEmail}
                    onChange={(e) =>
                      setDefaultSettings((prev) => ({ ...prev, companyEmail: e.target.value }))
                    }
                  />
                  <TextField
                    label="Default Business Mobile"
                    size="small"
                    value={defaultSettings.companyPhone}
                    onChange={(e) =>
                      setDefaultSettings((prev) => ({ ...prev, companyPhone: e.target.value }))
                    }
                  />
                  {defaultSettings.currency === "INR" && (
                    <>
                      <TextField
                        label="Default Business GSTIN"
                        size="small"
                        value={defaultSettings.companyGSTIN}
                        inputProps={{ maxLength: 15 }}
                        onChange={(e) =>
                          setDefaultSettings((prev) => ({
                            ...prev,
                            companyGSTIN: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                      <TextField
                        label="Default Customer GSTIN"
                        size="small"
                        value={defaultSettings.customerGSTIN}
                        inputProps={{ maxLength: 15 }}
                        onChange={(e) =>
                          setDefaultSettings((prev) => ({
                            ...prev,
                            customerGSTIN: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </>
                  )}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Default Currency</InputLabel>
                    <Select
                      label="Default Currency"
                      value={defaultSettings.currency}
                      onChange={(e) =>
                        setDefaultSettings((prev) => {
                          const selected = e.target.value;
                          const tax = CURRENCIES.find((c) => c.code === selected)?.defaultTax ?? 0;
                          return { ...prev, currency: selected, taxRate: String(tax) };
                        })
                      }
                    >
                      {CURRENCIES.map((c) => (
                        <MenuItem key={c.code} value={c.code}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Default Tax Rate (%)"
                    size="small"
                    type="number"
                    value={defaultSettings.taxRate}
                    onChange={(e) =>
                      setDefaultSettings((prev) => ({ ...prev, taxRate: e.target.value }))
                    }
                  />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={saveSettings}>
                  Save Defaults
                </Button>
                <Button variant="outlined" size="small" onClick={applyDefaultValues}>
                  Apply Now
                </Button>
                <Button color="inherit" size="small" onClick={resetSettings}>
                  Reset
                </Button>
              </Stack>
              </Stack>
            </Collapse>
          </Box>
        </Grid>

        <Grid item xs={12} md={8} lg={9} sx={{ order: { xs: 1, md: 1 } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" className="section-title">
            Invoice
          </Typography>
          <Typography variant="body2" className="section-subtitle">
            Create and download professional invoices quickly.
          </Typography>
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
            label={labels.businessName}
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.companyEmail}
            fullWidth
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.businessPhone}
            fullWidth
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
          />
        </Grid>
        {isInr && (
          <Grid item xs={12} md={4}>
            <TextField
              label="Business GSTIN"
              fullWidth
              value={companyGSTIN}
              onChange={(e) => setCompanyGSTIN(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 15 }}
              placeholder="22AAAAA0000A1Z5"
            />
          </Grid>
        )}
        <Grid item xs={12} sx={{ pt: { xs: 2, md: 1 } }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            Customer Details
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.customerName}
            fullWidth
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.customerEmail}
            fullWidth
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.customerPhone}
            fullWidth
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </Grid>
        {isInr && (
          <Grid item xs={12} md={4}>
            <TextField
              label="Customer GSTIN"
              fullWidth
              value={customerGSTIN}
              onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 15 }}
              placeholder="22AAAAA0000A1Z5"
            />
          </Grid>
        )}
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.invoiceNumber}
            fullWidth
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.invoiceDate}
            placeholder="dd/mm/yyyy"
            fullWidth
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.dueDate}
            placeholder="dd/mm/yyyy"
            fullWidth
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
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
              label={labels.itemName}
              fullWidth
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label={labels.itemQty}
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
              label={labels.itemRate}
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

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            Pricing Settings
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.discount}
            type="number"
            fullWidth
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">{currencySymbol}</InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label={labels.taxRate || `${taxLabel} Rate`}
            type="number"
            fullWidth
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            helperText={`Default for ${currency}: ${currencyMeta?.defaultTax ?? 0}%`}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        {isInr && (
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>GST Type</InputLabel>
              <Select
                label="GST Type"
                value={gstType}
                onChange={(e) => setGstType(e.target.value as GstType)}
              >
                <MenuItem value="CGST_SGST">CGST + SGST (Intra-state)</MenuItem>
                <MenuItem value="IGST">IGST (Inter-state)</MenuItem>
                <MenuItem value="NONE">No GST Breakdown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      <Box className="totals-panel" sx={{ mt: 3 }}>
        <Typography>Subtotal: {money(subtotal)}</Typography>
        <Typography>Discount: {money(discountValue)}</Typography>
        {isInr && gstType === "CGST_SGST" ? (
          <>
            <Typography>
              CGST ({(Number(taxRate || 0) / 2).toFixed(1)}%): {money(cgst)}
            </Typography>
            <Typography>
              SGST ({(Number(taxRate || 0) / 2).toFixed(1)}%): {money(sgst)}
            </Typography>
          </>
        ) : isInr && gstType === "IGST" ? (
          <Typography>
            IGST ({taxRate || 0}%): {money(igst)}
          </Typography>
        ) : (
          <Typography>
            {taxLabel} ({taxRate || 0}%): {money(taxAmount)}
          </Typography>
        )}
        <Typography variant="h6">Grand Total: {money(total)}</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label={labels.paymentTerms}
            multiline
            minRows={3}
            fullWidth
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label={labels.notes}
            multiline
            minRows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Grid>
      </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InvoiceForm;
