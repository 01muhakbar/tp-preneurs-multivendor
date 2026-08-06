import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type CollectionRail = "DUITKU_POP" | "QRIS_STATIC";
export type CollectionClaimState = "CLAIMED" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
export type CollectionClaimSource =
  | "DUITKU_CREATE_INVOICE"
  | "QRIS_FALLBACK"
  | "ADMIN_RECOVERY";

export interface OrderCollectionClaimAttributes {
  id: number;
  orderId: number;
  rail: CollectionRail;
  claimState: CollectionClaimState;
  claimSource: CollectionClaimSource;
  orderPaymentAttemptId?: number | null;
  claimedAt?: Date;
  paidAt?: Date | null;
  terminalAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type OrderCollectionClaimCreationAttributes = Optional<
  OrderCollectionClaimAttributes,
  "id" | "claimState" | "orderPaymentAttemptId" | "claimedAt" | "paidAt" | "terminalAt"
>;

export class OrderCollectionClaim
  extends Model<OrderCollectionClaimAttributes, OrderCollectionClaimCreationAttributes>
  implements OrderCollectionClaimAttributes
{
  declare id: number;
  declare orderId: number;
  declare rail: CollectionRail;
  declare claimState: CollectionClaimState;
  declare claimSource: CollectionClaimSource;
  declare orderPaymentAttemptId?: number | null;
  declare claimedAt: Date;
  declare paidAt?: Date | null;
  declare terminalAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    OrderCollectionClaim.belongsTo(models.Order, {
      foreignKey: { name: "orderId", field: "order_id" },
      as: "order",
    });
    OrderCollectionClaim.belongsTo(models.OrderPaymentAttempt, {
      foreignKey: { name: "orderPaymentAttemptId", field: "order_payment_attempt_id" },
      as: "paymentAttempt",
    });
  }

  static initModel(sequelize: Sequelize) {
    return OrderCollectionClaim.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          unique: true,
          field: "order_id",
          references: {
            model: "orders",
            key: "id",
          },
        },
        rail: {
          type: DataTypes.ENUM("DUITKU_POP", "QRIS_STATIC"),
          allowNull: false,
        },
        claimState: {
          type: DataTypes.ENUM("CLAIMED", "PAID", "FAILED", "EXPIRED", "CANCELLED"),
          allowNull: false,
          defaultValue: "CLAIMED",
          field: "claim_state",
        },
        claimSource: {
          type: DataTypes.ENUM("DUITKU_CREATE_INVOICE", "QRIS_FALLBACK", "ADMIN_RECOVERY"),
          allowNull: false,
          field: "claim_source",
        },
        orderPaymentAttemptId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "order_payment_attempt_id",
          references: {
            model: "order_payment_attempts",
            key: "id",
          },
        },
        claimedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: "claimed_at",
        },
        paidAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "paid_at",
        },
        terminalAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "terminal_at",
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
        modelName: "OrderCollectionClaim",
        tableName: "order_collection_claims",
        underscored: true,
      }
    );
  }
}
