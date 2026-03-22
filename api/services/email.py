import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from api.config import get_settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    settings = get_settings()

    if not settings.smtp_email or not settings.smtp_app_password:
        if "localhost" in settings.frontend_base_url:
            logger.warning("SMTP not configured — logging reset link (dev only)")
            logger.info("Password reset link for %s: %s", to_email, reset_url)
            return
        raise RuntimeError("SMTP not configured")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your Password"
    msg["From"] = settings.smtp_email
    msg["To"] = to_email

    text = f"Reset your password by visiting:\n\n{reset_url}\n\nThis link expires in 1 hour."
    html = f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:20px; font-family:Georgia, serif; background-color:#fdf6e3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:8px; padding:32px;">
<tr><td>
<h2 style="margin:0 0 16px 0; color:#1a1a1a; font-family:Georgia, serif;">Reset Your Password</h2>
<p style="color:#4a4a4a; line-height:1.5;">Click the button below to reset your password:</p>
<p style="text-align:center; margin:24px 0;">
<a href="{reset_url}" style="display:inline-block; padding:12px 24px; background-color:#8b0000; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">Reset Password</a>
</p>
<p style="color:#8a8a7a; font-size:13px; line-height:1.5;">If the button doesn't work, copy and paste this link into your browser:</p>
<p style="color:#8b0000; font-size:13px; word-break:break-all;">{reset_url}</p>
<p style="color:#8a8a7a; font-size:13px; margin-top:24px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
</td></tr>
</table>
</body>
</html>"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    def _send():
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_email, settings.smtp_app_password)
            server.sendmail(settings.smtp_email, to_email, msg.as_string())

    await asyncio.to_thread(_send)
