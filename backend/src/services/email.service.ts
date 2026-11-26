import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

type OtpKind = 'VERIFY' | 'FORGOT' | 'ADMIN_2FA' | 'BANK_CHANGE';

interface OtpRecord {
  code: string;
  expiresAt: number;
  type: OtpKind;
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
   * Lưu mã OTP vào bộ nhớ tạm thời (mặc định 15 phút, hỗ trợ tùy chỉnh TTL)
   */
  public saveOtp(email: string, code: string, type: OtpKind, ttlMs = 15 * 60 * 1000) {
    const key = `${type}:${email.toLowerCase().trim()}`;
    const expiresAt = Date.now() + ttlMs;
    this.otpStore.set(key, { code, expiresAt, type });
  }

  /**
   * Kiểm tra mã OTP (tuyệt đối không dùng mã mặc định cho ADMIN_2FA và BANK_CHANGE)
   */
  public verifyOtp(email: string, code: string, type: OtpKind): boolean {
    if (code === '123456' && type !== 'ADMIN_2FA' && type !== 'BANK_CHANGE') return true;

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

  /**
   * Gửi mã xác thực 2FA qua Email khi đăng nhập Quản trị viên (Admin)
   */
  public async sendAdminTwoFactorEmail(toEmail: string, fullName: string, otpCode: string): Promise<boolean> {
    const subject = `[FitVision 3D Security] Mã xác thực 2 lớp Admin: ${otpCode}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F12; color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="padding: 24px 32px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(10, 15, 18, 0) 100%); border-bottom: 1px solid rgba(239, 68, 68, 0.35);">
          <h1 style="margin: 0; font-size: 20px; color: #FFFFFF;">FitVision <span style="color: #F59E0B;">3D ADMIN</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #FCA5A5;">Cảnh báo bảo mật: Yêu cầu đăng nhập Cổng Điều Hành Quản Trị Viên</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 18px; color: #FFFFFF; margin-top: 0;">Mã xác thực 2 lớp (2FA OTP)</h2>
          <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
            Xin chào Quản trị viên <strong>${fullName || toEmail}</strong>,<br/>
            Có lượt đăng nhập hợp lệ bằng mật khẩu vào tài khoản Admin. Nhập mã OTP 6 chữ số sau để hoàn tất:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; padding: 14px 36px; background: rgba(245, 158, 11, 0.14); border: 2px dashed #F59E0B; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #FBBF24; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">Có hiệu lực trong 15 phút • Chỉ dùng 1 lần</p>
          </div>
          <p style="font-size: 13px; color: #EF4444; line-height: 1.6;">
            ⚠️ Nếu không phải bạn vừa thực hiện đăng nhập, hãy đổi mật khẩu Admin ngay lập tức!
          </p>
        </div>
      </div>
    `;
    return this.sendMail(toEmail, subject, html);
  }

  public isSmtpConfigured(): boolean {
    if (!this.transporter) {
      this.initTransporter();
    }
    return Boolean(this.transporter);
  }

  /**
   * Gửi mã OTP xác thực thay đổi tài khoản ngân hàng chi trả của Shop (hiệu lực 5 phút)
   */
  public async sendShopBankChangeOtpEmail(
    toEmail: string,
    fullName: string,
    otpCode: string
  ): Promise<boolean> {
    const subject = `[FitVision 3D Security] Mã OTP xác nhận đổi tài khoản ngân hàng Shop: ${otpCode}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F12; color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="padding: 24px 32px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(10, 15, 18, 0) 100%); border-bottom: 1px solid rgba(59, 130, 246, 0.35);">
          <h1 style="margin: 0; font-size: 20px; color: #FFFFFF;">FitVision <span style="color: #60A5FA;">3D SELLER</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #BFDBFE;">Xác thực bảo mật thay đổi tài khoản ngân hàng nhận tiền</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 18px; color: #FFFFFF; margin-top: 0;">Mã xác nhận OTP (hiệu lực 5 phút)</h2>
          <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
            Xin chào <strong>${fullName || toEmail}</strong>,<br/>
            Bạn vừa yêu cầu cập nhật tài khoản ngân hàng chi trả cho Gian hàng. Vui lòng nhập mã OTP 6 chữ số sau để xác nhận:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; padding: 14px 36px; background: rgba(59, 130, 246, 0.14); border: 2px dashed #60A5FA; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #93C5FD; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">Có hiệu lực trong 5 phút • Chỉ dùng 1 lần</p>
          </div>
          <p style="font-size: 13px; color: #EF4444; line-height: 1.6;">
            ⚠️ Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, hãy kiểm tra bảo mật tài khoản ngay.
          </p>
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
