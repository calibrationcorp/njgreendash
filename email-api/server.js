const express = require("express");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json({ limit: "20kb" }));

const allowedOrigins = new Set([
  "https://njgreendash.com",
  "https://www.njgreendash.com",
  "https://njgreendash.onrender.com"
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "njgreendash-email" }));

app.post("/api/contact", async (req, res) => {
  const { name, email, phone = "", project = "", details = "" } = req.body || {};
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide your name and a valid email address." });
  }
  if (typeof name !== "string" || typeof email !== "string" ||
      [name, email, phone, project, details].some(v => typeof v !== "string") ||
      [name, email, phone, project, details].some(v => v.length > 5000)) {
    return res.status(400).json({ error: "Invalid form data." });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return res.status(503).json({ error: "Email service is not configured yet." });

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass }
  });

  try {
    await transporter.sendMail({
      from: { name: "NJ Green Dash Website", address: user },
      to: user,
      replyTo: { name, address: email },
      subject: "New NJ Green Dash Website Inquiry",
      text: [
        "New website inquiry",
        "",
        "Name: " + name,
        "Email: " + email,
        "Phone: " + phone,
        "Project: " + project,
        "",
        "Details:",
        details
      ].join("\n")
    });

    await transporter.sendMail({
      from: { name: "NJ Green Dash", address: user },
      to: email,
      replyTo: user,
      subject: "We received your NJ Green Dash inquiry",
      text: "Thank you for contacting NJ Green Dash. We received your message and will follow up with you.\n\nNJ Green Dash\n" + user
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Mail delivery failed:", error.message);
    return res.status(502).json({ error: "We couldn't send your message right now. Please try again or email " + user + "." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log("NJ Green Dash email API listening on " + port));
