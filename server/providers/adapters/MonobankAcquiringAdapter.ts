import crypto from 'node:crypto';
import type { PaymentProvider, PaymentIntent } from '../../../shared/mobility/interfaces';

export interface MonobankConfig {
  token?: string;
  publicKeyBase64?: string;
}

export class MonobankAcquiringAdapter implements PaymentProvider {
  readonly id = 'monobank';
  private readonly config: MonobankConfig;
  private readonly apiUrl = 'https://api.monobank.ua/api/merchant';

  constructor(config: MonobankConfig = {}) {
    this.config = config;
  }

  async createInvoice(
    amountMinor: number,
    currency: string,
    description: string,
    orderReference: string,
    redirectUrl: string,
    webhookUrl: string
  ): Promise<PaymentIntent> {
    if (!this.config.token) {
      throw new Error('Monobank merchant token is not configured in environment.');
    }

    // Currency code ISO 4217 numeric (980 = UAH, 840 = USD, 978 = EUR)
    const ccy = currency.toUpperCase() === 'UAH' ? 980 : currency.toUpperCase() === 'USD' ? 840 : 978;

    const payload = {
      amount: amountMinor,
      ccy,
      merchantPaymInfo: {
        reference: orderReference,
        destination: description,
      },
      redirectUrl,
      webHookUrl: webhookUrl,
      validity: 3600, // 1 hour
    };

    const res = await fetch(`${this.apiUrl}/invoice/create`, {
      method: 'POST',
      headers: {
        'X-Token': this.config.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Monobank invoice creation failed [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as { invoiceId: string; pageUrl: string };

    return {
      invoiceId: data.invoiceId,
      paymentUrl: data.pageUrl,
      status: 'PENDING',
      amountMinor,
      currency,
    };
  }

  verifyWebhook(payload: unknown, signatureBase64: string): boolean {
    if (!this.config.publicKeyBase64) {
      console.warn('[MonobankAcquiring] Webhook verification skipped: no public key configured.');
      return false;
    }

    try {
      const verifier = crypto.createVerify('SHA256');
      const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      verifier.update(bodyString);
      verifier.end();

      const publicKey = Buffer.from(this.config.publicKeyBase64, 'base64').toString('utf-8');
      return verifier.verify(publicKey, Buffer.from(signatureBase64, 'base64'));
    } catch (err) {
      console.error('[MonobankAcquiring] Webhook signature verification error:', err);
      return false;
    }
  }

  async checkStatus(invoiceId: string): Promise<'PENDING' | 'SUCCESS' | 'FAILURE'> {
    if (!this.config.token) {
      throw new Error('Monobank merchant token is not configured.');
    }

    const res = await fetch(`${this.apiUrl}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`, {
      headers: { 'X-Token': this.config.token },
    });

    if (!res.ok) {
      throw new Error(`Monobank status check failed [${res.status}]`);
    }

    const body = (await res.json()) as { status: string };
    switch (body.status) {
      case 'success':
        return 'SUCCESS';
      case 'failure':
      case 'reversed':
      case 'expired':
        return 'FAILURE';
      default:
        return 'PENDING';
    }
  }

  async refund(invoiceId: string, amountMinor: number): Promise<boolean> {
    if (!this.config.token) {
      throw new Error('Monobank merchant token is not configured.');
    }

    const res = await fetch(`${this.apiUrl}/invoice/cancel`, {
      method: 'POST',
      headers: {
        'X-Token': this.config.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceId, extRef: `refund-${Date.now()}`, amount: amountMinor }),
    });

    return res.ok;
  }
}
