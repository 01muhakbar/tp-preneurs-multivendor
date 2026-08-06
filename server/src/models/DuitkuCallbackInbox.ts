import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type DuitkuCallbackBindingState = "BOUND" | "UNBOUND" | "AMBIGUOUS" | "RESOLVED";
export type DuitkuCallbackProcessingResult = "APPLIED" | "IGNORED" | "QUARANTINED" | "ERROR";

export interface DuitkuCallbackInboxAttributes {
  id: number;
  paymentAttemptId?: number | null;
  resolvedPaymentAttemptId?: number | null;
  merchantCodeRaw: string;
  merchantOrderIdRaw: string;
  providerReferenceRaw?: string | null;
  amountRaw: string;
  resultCodeRaw: string;
  signatureState: "VALID";
  bindingState: DuitkuCallbackBindingState;
  processingResult: DuitkuCallbackProcessingResult;
  quarantineReason?: string | null;
  occurrenceKey: string;
  eventHash: string;
  rawBodyDigest: string;
  fieldValuesDigest: string;
  duplicateCount: number;
  firstReceivedAt?: Date;
  lastReceivedAt?: Date;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type DuitkuCallbackInboxCreationAttributes = Optional<
  DuitkuCallbackInboxAttributes,
  | "id"
  | "paymentAttemptId"
  | "resolvedPaymentAttemptId"
  | "providerReferenceRaw"
  | "signatureState"
  | "bindingState"
  | "processingResult"
  | "quarantineReason"
  | "duplicateCount"
  | "firstReceivedAt"
  | "lastReceivedAt"
  | "resolvedAt"
>;

export class DuitkuCallbackInbox
  extends Model<DuitkuCallbackInboxAttributes, DuitkuCallbackInboxCreationAttributes>
  implements DuitkuCallbackInboxAttributes
{
  declare id: number;
  declare paymentAttemptId?: number | null;
  declare resolvedPaymentAttemptId?: number | null;
  declare merchantCodeRaw: string;
  declare merchantOrderIdRaw: string;
  declare providerReferenceRaw?: string | null;
  declare amountRaw: string;
  declare resultCodeRaw: string;
  declare signatureState: "VALID";
  declare bindingState: DuitkuCallbackBindingState;
  declare processingResult: DuitkuCallbackProcessingResult;
  declare quarantineReason?: string | null;
  declare occurrenceKey: string;
  declare eventHash: string;
  declare rawBodyDigest: string;
  declare fieldValuesDigest: string;
  declare duplicateCount: number;
  declare firstReceivedAt: Date;
  declare lastReceivedAt: Date;
  declare resolvedAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    DuitkuCallbackInbox.belongsTo(models.OrderPaymentAttempt, {
      foreignKey: { name: "paymentAttemptId", field: "payment_attempt_id" },
      as: "paymentAttempt",
    });
    DuitkuCallbackInbox.belongsTo(models.OrderPaymentAttempt, {
      foreignKey: { name: "resolvedPaymentAttemptId", field: "resolved_payment_attempt_id" },
      as: "resolvedPaymentAttempt",
    });
    DuitkuCallbackInbox.hasOne(models.OrderPaymentAttemptEvent, {
      foreignKey: { name: "callbackInboxId", field: "callback_inbox_id" },
      as: "attemptEvent",
    });
  }

  static initModel(sequelize: Sequelize) {
    return DuitkuCallbackInbox.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        paymentAttemptId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "payment_attempt_id",
          references: {
            model: "order_payment_attempts",
            key: "id",
          },
        },
        resolvedPaymentAttemptId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "resolved_payment_attempt_id",
          references: {
            model: "order_payment_attempts",
            key: "id",
          },
        },
        merchantCodeRaw: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "merchant_code_raw",
        },
        merchantOrderIdRaw: {
          type: DataTypes.STRING(128),
          allowNull: false,
          field: "merchant_order_id_raw",
        },
        providerReferenceRaw: {
          type: DataTypes.STRING(192),
          allowNull: true,
          field: "provider_reference_raw",
        },
        amountRaw: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "amount_raw",
        },
        resultCodeRaw: {
          type: DataTypes.STRING(40),
          allowNull: false,
          field: "result_code_raw",
        },
        signatureState: {
          type: DataTypes.ENUM("VALID"),
          allowNull: false,
          defaultValue: "VALID",
          field: "signature_state",
        },
        bindingState: {
          type: DataTypes.ENUM("BOUND", "UNBOUND", "AMBIGUOUS", "RESOLVED"),
          allowNull: false,
          defaultValue: "UNBOUND",
          field: "binding_state",
        },
        processingResult: {
          type: DataTypes.ENUM("APPLIED", "IGNORED", "QUARANTINED", "ERROR"),
          allowNull: false,
          defaultValue: "QUARANTINED",
          field: "processing_result",
        },
        quarantineReason: {
          type: DataTypes.STRING(120),
          allowNull: true,
          field: "quarantine_reason",
        },
        occurrenceKey: {
          type: DataTypes.CHAR(64),
          allowNull: false,
          unique: true,
          field: "occurrence_key",
        },
        eventHash: {
          type: DataTypes.CHAR(64),
          allowNull: false,
          field: "event_hash",
        },
        rawBodyDigest: {
          type: DataTypes.CHAR(64),
          allowNull: false,
          field: "raw_body_digest",
        },
        fieldValuesDigest: {
          type: DataTypes.CHAR(64),
          allowNull: false,
          field: "field_values_digest",
        },
        duplicateCount: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "duplicate_count",
        },
        firstReceivedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: "first_received_at",
        },
        lastReceivedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: "last_received_at",
        },
        resolvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "resolved_at",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
        },
      },
      {
        sequelize,
        modelName: "DuitkuCallbackInbox",
        tableName: "duitku_callback_inbox",
        underscored: true,
      }
    );
  }
}
