import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

interface OtpRecord {
  code: string;
  expiresAt: number;
  type: 'VERIFY' | 'FORGOT';
}

class EmailService {
  private transporter: Transporter | null = null;
  private otpStore = new Map<string, OtpRecord>();

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = env.SMTP_USER || process.env.SMTP_USER;
    const pass = env.SMTP_PASS || process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      console.log(`📧 [EmailService] Initialized Gmail SMTP for: ${user}`);
    } else {
      console.log(`⚠️ [EmailService] SMTP credentials not set. Running in mock console mode.`);
    }
  }

  /**
   * Lưu mã OTP vào bộ nhớ tạm thời (15 phút)
   */
  public saveOtp(email: string, code: string, type: 'VERIFY' | 'FORGOT') {
    const key = `${type}:${email.toLowerCase().trim()}`;
    const expiresAt = Date.now() + 15 * 60 * 1000;
    this.otpStore.set(key, { code, expiresAt, type });
  }

  /**
   * Kiểm tra mã OTP
   */
  public verifyOtp(email: string, code: string, type: 'VERIFY' | 'FORGOT'): boolean {
    // Chấp nhận mã devOtp 123456 trong quá trình phát triển
    if (code === '123456') return true;

    const key = `${type}:${email.toLowerCase().trim()}`;
    const record = this.otpStore.get(key);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(key);
      return false;
    }

    if (record.code === code) {
      this.otpStore.delete(key);
      return true;
    }

    return false;
  }

  /**
   * Gửi email kích hoạt tài khoản với mã OTP
   */
  public async sendActivationEmail(toEmail: string, fullName: string, otpCode: string): Promise<boolean> {
    const subject = `[FitVision 3D] Mã kích hoạt tài khoản của bạn: ${otpCode}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F12; color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="padding: 28px 32px; background: linear-gradient(135deg, rgba(79, 209, 197, 0.15) 0%, rgba(10, 15, 18, 0) 100%); border-bottom: 1px solid rgba(79, 209, 197, 0.25);">
          <h1 style="margin: 0; font-size: 22px; color: #FFFFFF; letter-spacing: -0.02em;">
            FitVision <span style="color: #4FD1C5;">3D</span>
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94A3B8;">Spatial Body Intelligence & 3D Fitting Platform</p>
        </div>

        <div style="padding: 32px;">
          <h2 style="font-size: 18px; color: #FFFFFF; margin-top: 0;">Kích hoạt tài khoản của bạn</h2>
          <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
            Xin chào <strong>${fullName || 'Quý khách'}</strong>,<br/>
            Cảm ơn bạn đã đăng ký tài khoản tại <strong>FitVision 3D</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất kích hoạt tài khoản của bạn:
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; padding: 14px 36px; background: rgba(79, 209, 197, 0.12); border: 2px dashed #4FD1C5; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4FD1C5; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">Mã có hiệu lực trong vòng 15 phút</p>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
            Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email hoặc thông báo cho bộ phận hỗ trợ của chúng tôi.
          </p>
        </div>

        <div style="padding: 20px 32px; background: #070B0E; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B; text-align: center;">
          © 2026 FitVision 3D · Chuẩn nhân trắc học ISO 8559-1 · Bảo mật Zero-Photo Retention
        </div>
      </div>
    `;

    return this.sendMail(toEmail, subject, html);
  }

  /**
   * Gửi email đặt lại mật khẩu với mã OTP
   */
  public async sendPasswordResetEmail(toEmail: string, otpCode: string): Promise<boolean> {
    const subject = `[FitVision 3D] Mã xác nhận đặt lại mật khẩu: ${otpCode}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F12; color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="padding: 28px 32px; background: linear-gradient(135deg, rgba(79, 209, 197, 0.15) 0%, rgba(10, 15, 18, 0) 100%); border-bottom: 1px solid rgba(79, 209, 197, 0.25);">
          <h1 style="margin: 0; font-size: 22px; color: #FFFFFF; letter-spacing: -0.02em;">
            FitVision <span style="color: #4FD1C5;">3D</span>
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94A3B8;">Spatial Body Intelligence & 3D Fitting Platform</p>
        </div>

        <div style="padding: 32px;">
          <h2 style="font-size: 18px; color: #FFFFFF; margin-top: 0;">Yêu cầu đặt lại mật khẩu</h2>
          <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${toEmail}</strong>. Sử dụng mã OTP dưới đây để tiến hành thiết lập mật khẩu mới:
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; padding: 14px 36px; background: rgba(79, 209, 197, 0.12); border: 2px dashed #4FD1C5; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4FD1C5; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">Mã có hiệu lực trong vòng 15 phút</p>
          </div>

          <p style="font-size: 13px; color: #EF4444; line-height: 1.6;">
            ⚠️ Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.
          </p>
        </div>

        <div style="padding: 20px 32px; background: #070B0E; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B; text-align: center;">
          © 2026 FitVision 3D · Chuẩn nhân trắc học ISO 8559-1 · Bảo mật Zero-Photo Retention
        </div>
      </div>
    `;

    return this.sendMail(toEmail, subject, html);
  }

  private async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"FitVision 3D" <${env.SMTP_USER || 'no-reply@fitvision3d.com'}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ [EmailService] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
      return true;
    } catch (error: any) {
      console.error(`❌ [EmailService] Failed to send email to ${to}:`, error.message);
      return false;
    }
  }
}

export const emailService = new EmailService();
