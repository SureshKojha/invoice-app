import { Box, Container, Typography } from "@mui/material";
import InvoiceForm from "./components/invoiceForm";
import "./App.css";

export default function App() {
  const year = new Date().getFullYear();

  return (
    <Box className="app-shell">
      <Container maxWidth="lg" className="app-container">
        <Box className="hero-panel">
          <Typography variant="h2" component="h1" className="hero-title">
            SK Invoice Generator
          </Typography>
          <Typography className="hero-subtitle">
            Design professional invoices with branding, and instant PDF
            downloads.
          </Typography>
        </Box>
        <InvoiceForm />
        <Typography component="footer" className="app-copyright">
          Copyright {year} SK Invoice Generator. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
