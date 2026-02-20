const Visitor = require("../models/visitor");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

/* ================= SMTP TRANSPORT ================= */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP ERROR:", err);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

/* ================= TWILIO CLIENT ================= */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ================= CREATE VISITOR ================= */
exports.createVisitor = async (req, res) => {
  try {
    console.log("🚀 Creating visitor...");

    const visitor = await Visitor.create(req.body);
    console.log("✅ Visitor saved:", visitor.phone);

    /* ---------- EMAIL TO ADMIN ---------- */
    console.log("📧 Sending email to admin...");
    await transporter.sendMail({
      from: `"HP Connect VMS" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Visitor Registered",
      text: `
New visitor registered:

Name: ${visitor.firstName} ${visitor.lastName}
Email: ${visitor.email}
Phone: ${visitor.phone}
Company: ${visitor.companyName}
Purpose: ${visitor.purposeOfVisit}
      `,
    });
    console.log("✅ Admin email sent");

    /* ---------- EMAIL TO VISITOR ---------- */
    console.log("📧 Sending email to visitor...");
    await transporter.sendMail({
      from: `"HP Connect VMS" <${process.env.SMTP_USER}>`,
      to: visitor.email,
      subject: "Visit Registration Confirmed",
      html: `
        <h2>Hi ${visitor.firstName},</h2>
        <p>Your visit has been <b>successfully registered</b>.</p>

        <p><b>Company:</b> HP</p>
        <p><b>Purpose:</b> ${visitor.purposeOfVisit}</p>

        <p>Please carry a valid ID when you arrive.</p>

        <br/>
        <p>Regards,<br/><b>HP Connect Team</b></p>
      `,
    });
    console.log("✅ Visitor email sent");

    /* ---------- WHATSAPP TO VISITOR (NON-BLOCKING) ---------- */
    let whatsappStatus = "not-attempted";

    try {
      // sanitize phone (10 digits only)
      const rawPhone = String(visitor.phone).replace(/\D/g, "");
      const whatsappTo = `whatsapp:+91${rawPhone}`;

      console.log("📱 WhatsApp FROM:", process.env.TWILIO_WHATSAPP_FROM);
      console.log("📱 WhatsApp TO:", whatsappTo);

      const msg = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM, // MUST be whatsapp:+14155238886
        to: whatsappTo,
        body: `Hello ${visitor.firstName} 👋

Your visit to HP has been successfully registered.

🏢 Company: HP
📝 Purpose: ${visitor.purposeOfVisit}

Please carry a valid ID.

– HP Connect Team`,
      });

      console.log("✅ WhatsApp SENT");
      console.log("📨 SID:", msg.sid);
      console.log("📨 STATUS:", msg.status);

      whatsappStatus = "sent";
    } catch (waError) {
      whatsappStatus = "failed";

      console.error("❌ WHATSAPP ERROR FULL OBJECT:");
      console.error(waError);

      if (waError.code) console.error("❌ CODE:", waError.code);
      if (waError.moreInfo) console.error("❌ MORE INFO:", waError.moreInfo);
    }

    res.status(201).json({
      visitor,
      emailSent: true,
      whatsappStatus,
    });

  } catch (error) {
    console.error("❌ CREATE VISITOR ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET ALL VISITORS ================= */
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= DELETE VISITOR ================= */
exports.deleteVisitor = async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ message: "Visitor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
