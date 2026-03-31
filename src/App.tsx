import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import InvoiceForm from "./components/invoiceForm";
import "./App.css";
import invoiceLogo from "./assets/invoiceGeneratorLogo.svg";

const FEATURES = [
  { icon: "🔒", label: "No Login Required" },
  { icon: "📄", label: "Free PDF Download" },
  { icon: "🎨", label: "Add Your Logo" },
  { icon: "🌍", label: "Multi-Currency" },
  { icon: "🏷️", label: "Customize Labels" },
  { icon: "⚙️", label: "Default Selection" },
  { icon: "⚡", label: "Ready in 30 Seconds" },
];

function FooterSection({ year }: { year: number }) {
  const [open, setOpen] = useState<{ contact: boolean; help: boolean; more: boolean }>({
    contact: false,
    help: false,
    more: false,
  });

  const toggle = (key: keyof typeof open) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Box component="footer" className="app-footer">
      {/* Brand row */}
      <Box className="app-footer-brand">
        <Typography className="app-footer-tagline">
          Professional invoices — fast, free, and secure.
        </Typography>
      </Box>

      <Box className="app-footer-divider" />

      {/* Columns */}
      <Box className="app-footer-row">
        <Box className="app-footer-col">
          <Typography
            className="app-footer-section-title app-footer-toggle"
            onClick={() => toggle("contact")}
          >
            Contact {open.contact ? "▾" : "▸"}
          </Typography>
          <Collapse in={open.contact}>
            <Box sx={{ mt: 0.5 }}>
              <Typography className="app-footer-text">
                Need help? Reach us at
              </Typography>
              <Box
                component="a"
                href="mailto:surya.k.0.2026@gmail.com"
                className="app-footer-link"
              >
                ✉ surya.k.0.2026@gmail.com
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Box className="app-footer-col">
          <Typography
            className="app-footer-section-title app-footer-toggle"
            onClick={() => toggle("help")}
          >
            How It Works {open.help ? "▾" : "▸"}
          </Typography>
          <Collapse in={open.help}>
            <Box sx={{ mt: 0.5 }}>
              <Typography className="app-footer-text">1. Fill business & customer details.</Typography>
              <Typography className="app-footer-text">2. Add items, taxes & discounts.</Typography>
              <Typography className="app-footer-text">3. Click Download PDF.</Typography>
            </Box>
          </Collapse>
        </Box>

        <Box className="app-footer-col">
          <Typography
            className="app-footer-section-title app-footer-toggle"
            onClick={() => toggle("more")}
          >
            Features {open.more ? "▾" : "▸"}
          </Typography>
          <Collapse in={open.more}>
            <Box sx={{ mt: 0.5 }}>
              <Typography className="app-footer-text">✓ No login required</Typography>
              <Typography className="app-footer-text">✓ Multi-currency support</Typography>
              <Typography className="app-footer-text">✓ Custom labels & defaults</Typography>
            </Box>
          </Collapse>
        </Box>
      </Box>

      <Box className="app-footer-divider" />

      {/* Bottom bar */}
      <Box className="app-footer-bottom">
        <Typography className="app-copyright">
          © {year} SK Invoice Generator. All rights reserved.
        </Typography>
        <Typography className="app-footer-built">
          Built with ❤ for small businesses
        </Typography>
      </Box>
    </Box>
  );
}

export default function App() {
  const year = new Date().getFullYear();

  return (
    <Box className="app-shell">
      <Container maxWidth="lg" className="app-container">
        <Box className="app-header">
          <Box className="app-title-row">
            <Box
              component="img"
              src={invoiceLogo}
              alt="SK Invoice logo"
              className="app-title-logo"
            />
            <Box>
              <Typography variant="overline" className="hero-eyebrow">
                Free Invoice Generator
              </Typography>
              <Typography variant="h2" component="h1" className="hero-title">
                Create Invoice in{" "}
                <Box component="span" className="hero-title-accent">
                  30 Seconds
                </Box>
              </Typography>
              <Typography className="hero-subtitle">
                Professional invoices with your branding — no account needed, download PDF instantly.
              </Typography>
            </Box>
          </Box>

          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ mt: 2, mb: 2.5 }}
          >
            {FEATURES.map((f) => (
              <Chip
                key={f.label}
                icon={<Box component="span" sx={{ fontSize: "1rem", ml: 0.5 }}>{f.icon}</Box>}
                label={f.label}
                className="hero-feature-chip"
              />
            ))}
          </Stack>

          <Button
            variant="contained"
            size="large"
            className="hero-cta-btn"
            href="#invoice-form"
          >
            Create Invoice Now →
          </Button>
        </Box>

        <Box id="invoice-form">
          <InvoiceForm />
        </Box>

        <FooterSection year={year} />
      </Container>
    </Box>
  );
}
