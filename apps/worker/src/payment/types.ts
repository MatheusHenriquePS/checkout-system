export type ChargeApproved = {
  readonly status: "approved";
  readonly chargeId: string;
};

export type ChargeDeclined = {
  readonly status: "declined";
  readonly reason: string;
};

export type ChargeResult = ChargeApproved | ChargeDeclined;

export type ChargeRequest = {
  readonly orderId: string;
  readonly amountCents: number;
  readonly customerEmail: string;
};

export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
