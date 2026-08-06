import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface PaymentAttributes {
  id: number;
  suborderId: number;
  storeId: number;
  storePaymentProfileId?: number | null;
  paymentChannel: "QRIS" | "DUITKU";
  paymentType: "QRIS_STATIC" | "DUITKU_POP";
  externalReference?: string | null;
  internalReference: string;
  amount: number;
  qrImageUrl?: string | null;
  qrPayload?: string | null;
  allocationKey?: string | null;
  paidByOrderPaymentAttemptId?: number | null;
  status:
    | "CREATED"
    | "PENDING_CONFIRMATION"
    | "PAID"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED"
    | "REJECTED";
  expiresAt?: Date | null;
  paidAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  | "id"
  | "storePaymentProfileId"
  | "externalReference"
  | "paymentChannel"
  | "paymentType"
  | "qrImageUrl"
  | "qrPayload"
  | "allocationKey"
  | "paidByOrderPaymentAttemptId"
  | "status"
  | "expiresAt"
  | "paidAt"
>;

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  declare id: number;
  declare suborderId: number;
  declare storeId: number;
  declare storePaymentProfileId?: number | null;
  declare paymentChannel: "QRIS" | "DUITKU";
  declare paymentType: "QRIS_STATIC" | "DUITKU_POP";
  declare externalReference?: string | null;
  declare internalReference: string;
  declare amount: number;
  declare qrImageUrl?: string | null;
  declare qrPayload?: string | null;
  declare allocationKey?: string | null;
  declare paidByOrderPaymentAttemptId?: number | null;
  declare status:
    | "CREATED"
    | "PENDING_CONFIRMATION"
    | "PAID"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED"
    | "REJECTED";
  declare expiresAt?: Date | null;
  declare paidAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    Payment.belongsTo(models.Suborder, {
      foreignKey: { name: "suborderId", field: "suborder_id" },
      as: "suborder",
    });
    Payment.belongsTo(models.Store, {
      foreignKey: { name: "storeId", field: "store_id" },
      as: "store",
    });
    Payment.belongsTo(models.StorePaymentProfile, {
      foreignKey: { name: "storePaymentProfileId", field: "store_payment_profile_id" },
      as: "paymentProfile",
    });
    Payment.hasMany(models.PaymentProof, {
      foreignKey: { name: "paymentId", field: "payment_id" },
      as: "proofs",
    });
    Payment.hasMany(models.PaymentStatusLog, {
      foreignKey: { name: "paymentId", field: "payment_id" },
      as: "statusLogs",
    });
    Payment.belongsTo(models.OrderPaymentAttempt, {
      foreignKey: { name: "paidByOrderPaymentAttemptId", field: "paid_by_order_payment_attempt_id" },
      as: "paidByOrderPaymentAttempt",
    });
  }

  static initModel(sequelize: Sequelize) {
    return Payment.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        suborderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "suborder_id",
          references: {
            model: "suborders",
            key: "id",
          },
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "store_id",
          references: {
            model: "stores",
            key: "id",
          },
        },
        storePaymentProfileId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "store_payment_profile_id",
          references: {
            model: "store_payment_profiles",
            key: "id",
          },
        },
        paymentChannel: {
          type: DataTypes.ENUM("QRIS", "DUITKU"),
          allowNull: false,
          defaultValue: "QRIS",
          field: "payment_channel",
        },
        paymentType: {
          type: DataTypes.ENUM("QRIS_STATIC", "DUITKU_POP"),
          allowNull: false,
          defaultValue: "QRIS_STATIC",
          field: "payment_type",
        },
        externalReference: {
          type: DataTypes.STRING(160),
          allowNull: true,
          field: "external_reference",
        },
        internalReference: {
          type: DataTypes.STRING(160),
          allowNull: false,
          unique: true,
          field: "internal_reference",
        },
        amount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
        },
        qrImageUrl: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
          field: "qr_image_url",
        },
        qrPayload: {
          type: DataTypes.TEXT("long"),
          allowNull: true,
          field: "qr_payload",
        },
        allocationKey: {
          type: DataTypes.STRING(160),
          allowNull: true,
          unique: true,
          field: "allocation_key",
        },
        paidByOrderPaymentAttemptId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "paid_by_order_payment_attempt_id",
          references: {
            model: "order_payment_attempts",
            key: "id",
          },
        },
        status: {
          type: DataTypes.ENUM(
            "CREATED",
            "PENDING_CONFIRMATION",
            "PAID",
            "FAILED",
            "CANCELLED",
            "EXPIRED",
            "REJECTED"
          ),
          allowNull: false,
          defaultValue: "CREATED",
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "expires_at",
        },
        paidAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "paid_at",
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
        modelName: "Payment",
        tableName: "payments",
        underscored: true,
      }
    );
  }
}
