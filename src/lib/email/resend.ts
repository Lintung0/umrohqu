interface SendVerificationEmailParams {
  to: string
  name: string
  verificationUrl: string
}

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.EMAIL_FROM || "umrahqu@farissulianto.my.id"

  if (!apiKey) {
    console.error("[Email] RESEND_API_KEY is not configured in environment variables.")
    return { success: false, error: "Layanan email belum dikonfigurasi." }
  }

  const senderName = "Umrahqu"
  const formattedFrom = fromEmail.includes("<") ? fromEmail : `${senderName} <${fromEmail}>`

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Email Akun Umrahqu</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 36px 32px; text-align: center;">
              <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 6px;">
                Umrahqu
              </div>
              <div style="font-size: 14px; color: #a7f3d0; font-weight: 500;">
                Marketplace Umrah & Haji Terpercaya
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">
                Assalamu'alaikum ${name ? escapeHtml(name) : "Sahabat Umrahqu"},
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                Terima kasih telah mendaftar di <strong>Umrahqu</strong>. Selangkah lagi untuk mengaktifkan akun Anda dan menikmati kemudahan mencari serta memesan paket ibadah terbaik.
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #475569;">
                Silakan klik tombol di bawah ini untuk mengonfirmasi email dan mengaktifkan akun Anda:
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                      Konfirmasi Akun Saya
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #64748b; line-height: 1.5; word-break: break-all;">
                Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut di browser Anda:<br>
                <a href="${verificationUrl}" target="_blank" style="color: #059669; text-decoration: underline;">
                  ${verificationUrl}
                </a>
              </div>

              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                <p style="margin: 0 0 8px;">
                  Tautan ini berlaku selama 24 jam. Jika Anda merasa tidak pernah mendaftar di Umrahqu, Anda dapat mengabaikan email ini dengan aman.
                </p>
                <p style="margin: 0;">
                  Wassalamu'alaikum Wr. Wb.<br>
                  <strong>Tim Layanan Umrahqu</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              © ${new Date().getFullYear()} Umrahqu. Hak cipta dilindungi undang-undang.<br>
              Marketplace Paket Umrah, Haji, & Wisata Halal.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: formattedFrom,
        to: [to],
        subject: "Konfirmasi Email Akun Umrahqu Anda",
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[Email] Resend API error:", response.status, errorData)
      return {
        success: false,
        error: errorData?.message || "Gagal mengirim email konfirmasi.",
      }
    }

    const data = await response.json()
    console.log("[Email] Verification email sent successfully via Resend. ID:", data?.id)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Kesalahan jaringan saat mengirim email."
    console.error("[Email] Send email exception:", err)
    return { success: false, error: errorMsg }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
