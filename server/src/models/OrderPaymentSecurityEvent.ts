import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type OrderPaymentSecurityEventType =
  | "CALLBACK_INVALID_SIGNATURE"
  | "CALLBACK_MALFORMED"
  | "CALLBACK_OVERSIZED";

export type OrderPaymentSecuritySignatureState = "INVALID" | "NOT_CHECKED";

export interface OrderPaymentSecurityEventAttributes {
  id: number;
  eventType: OrderPaymentSecurityEventType;
  merchantCodePrefix?: string | null;
  merchantOrderIdPrefix?: string | null;
  providerReferencePrefix?: string | null;
  amountPrefix?: string | null;
  resultCodePrefix?: string | null;
  signatureState: OrderPaymentSecuritySignatureState;
  rawBodyDigest?: string | null;
  fieldValuesDigest?: string | null;
  sourceIpHash?: string | null;
  userAgentHash?: string | null;
  receivedAt?: Date;
  createdAt?: Date;
}

type OrderPaymentSecurityEventCreationAttributes = Optional<
  OrderPaymentSecurityEventAttributes,
  | "id"
  | "merchantCodePrefix"
  | "merchantOrderIdPrefix"
  | "providerReferencePrefix"
  | "amountPrefix"
  | "resultCodePrefix"
  | "signatureState"
  | "rawBodyDigest"
  | "fieldValuesDigest"
  | "sourceIpHash"
  | "userAgentHash"
  | "receivedAt"
>;

export class OrderPaymentSecurityEvent
  extends Model<OrderPaymentSecurityEventAttributes, OrderPaymentSecurityEventCreationAttributes>
  implements OrderPaymentSecurityEventAttributes
{
  declare id: number;
  declare eventType: OrderPaymentSecurityEventType;
  declare merchantCodePrefix?: string | null;
  declare merchantOrderIdPrefix?: string | null;
  declare providerReferencePrefix?: string | null;
  declare amountPrefix?: string | null;
  declare resultCodePrefix?: string | null;
  declare signatureState: OrderPaymentSecuritySignatureState;
  declare rawBodyDigest?: string | null;
  declare fieldValuesDigest?: string | null;
  declare sourceIpHash?: string | null;
  declare userAgentHash?: string | null;
  declare receivedAt: Date;
  declare readonly createdAt: Date;

  static initModel(sequelize: Sequelize) {
    return OrderPaymentSecurityEvent.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        eventType: {
          type: DataTypes.ENUM("CALLBACK_INVALID_SIGNATURE", "CALLBACK_MALFORMED", "CALLBACK_OVERSIZED"),
          allowNull: false,
          field: "event_type",
        },
        merchantCodePrefix: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: "merchant_code_prefix",
        },
        merchantOrderIdPrefix: {
          type: DataTypes.STRING(128),
          allowNull: true,
          field: "merchant_order_id_prefix",
        },
        providerReferencePrefix: {
          type: DataTypes.STRING(192),
          allowNull: true,
          field: "provider_reference_prefix",
        },
        amountPrefix: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: "amount_prefix",
        },
        resultCodePrefix: {
          type: DataTypes.STRING(40),
          allowNull: true,
          field: "result_code_prefix",
        },
        signatureState: {
          type: DataTypes.ENUM("INVALID", "NOT_CHECKED"),
          allowNull: false,
          defaultValue: "NOT_CHECKED",
          field: "signature_state",
        },
        rawBodyDigest: {
          type: DataTypes.CHAR(64),
          allowNull: true,
          field: "raw_body_digest",
        },
        fieldValuesDigest: {
          type: DataTypes.CHAR(64),
          allowNull: true,
          field: "field_values_digest",
        },
        sourceIpHash: {
          type: DataTypes.CHAR(64),
          allowNull: true,
          field: "source_ip_hash",
        },
        userAgentHash: {
          type: DataTypes.CHAR(64),
          allowNull: true,
          field: "user_agent_hash",
        },
        receivedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: "received_at",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
      },
      {
        sequelize,
        modelName: "OrderPaymentSecurityEvent",
        tableName: "order_payment_security_events",
        underscored: true,
        updatedAt: false,
      }
    );
  }
}
