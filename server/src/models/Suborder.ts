import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SuborderAttributes {
  id: number;
  orderId: number;
  suborderNumber: string;
  storeId: number;
  storePaymentProfileId?: number | null;
  appliedCouponId?: number | null;
  appliedCouponCode?: string | null;
  appliedCouponScopeType?: "PLATFORM" | "STORE" | null;
  subtotalAmount: number;
  shippingAmount: number;
  serviceFeeAmount: number;
  totalAmount: number;
  paymentMethod: "QRIS" | "DUITKU";
  paymentStatus:
    | "UNPAID"
    | "PENDING_CONFIRMATION"
    | "PAID"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED";
  fulfillmentStatus:
    | "UNFULFILLED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  returnStatus?:
    | "NONE"
    | "RETURN_REQUESTED"
    | "RETURN_APPROVED"
    | "RETURN_DISPUTED"
    | "RETURN_REJECTED"
    | "REFUNDED"
    | null;
  returnReason?: string | null;
  returnNotes?: string | null;
  returnSolutionType?: "REFUND_ONLY" | "RETURN_AND_REFUND" | null;
  returnBankDetails?: string | null;
  returnRequestedAt?: Date | null;
  returnSellerNotes?: string | null;
  returnSellerRespondedAt?: Date | null;
  returnAdminNotes?: string | null;
  returnAdminDecidedAt?: Date | null;
  expiresAt?: Date | null;
  paidAt?: Date | null;
  internalNotes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SuborderCreationAttributes = Optional<
  SuborderAttributes,
  | "id"
  | "storePaymentProfileId"
  | "appliedCouponId"
  | "appliedCouponCode"
  | "appliedCouponScopeType"
  | "shippingAmount"
  | "serviceFeeAmount"
  | "paymentMethod"
  | "paymentStatus"
  | "fulfillmentStatus"
  | "returnStatus"
  | "returnReason"
  | "returnNotes"
  | "returnSolutionType"
  | "returnBankDetails"
  | "returnRequestedAt"
  | "returnSellerNotes"
  | "returnSellerRespondedAt"
  | "returnAdminNotes"
  | "returnAdminDecidedAt"
  | "expiresAt"
  | "paidAt"
  | "internalNotes"
>;

export class Suborder
  extends Model<SuborderAttributes, SuborderCreationAttributes>
  implements SuborderAttributes
{
  declare id: number;
  declare orderId: number;
  declare suborderNumber: string;
  declare storeId: number;
  declare storePaymentProfileId?: number | null;
  declare appliedCouponId?: number | null;
  declare appliedCouponCode?: string | null;
  declare appliedCouponScopeType?: "PLATFORM" | "STORE" | null;
  declare subtotalAmount: number;
  declare shippingAmount: number;
  declare serviceFeeAmount: number;
  declare totalAmount: number;
  declare paymentMethod: "QRIS" | "DUITKU";
  declare paymentStatus:
    | "UNPAID"
    | "PENDING_CONFIRMATION"
    | "PAID"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED";
  declare fulfillmentStatus:
    | "UNFULFILLED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  declare returnStatus?:
    | "NONE"
    | "RETURN_REQUESTED"
    | "RETURN_APPROVED"
    | "RETURN_DISPUTED"
    | "RETURN_REJECTED"
    | "REFUNDED"
    | null;
  declare returnReason?: string | null;
  declare returnNotes?: string | null;
  declare returnSolutionType?: "REFUND_ONLY" | "RETURN_AND_REFUND" | null;
  declare returnBankDetails?: string | null;
  declare returnRequestedAt?: Date | null;
  declare returnSellerNotes?: string | null;
  declare returnSellerRespondedAt?: Date | null;
  declare returnAdminNotes?: string | null;
  declare returnAdminDecidedAt?: Date | null;
  declare expiresAt?: Date | null;
  declare paidAt?: Date | null;
  declare internalNotes?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    Suborder.belongsTo(models.Order, {
      foreignKey: { name: "orderId", field: "order_id" },
      as: "order",
    });
    Suborder.belongsTo(models.Store, {
      foreignKey: { name: "storeId", field: "store_id" },
      as: "store",
    });
    Suborder.belongsTo(models.StorePaymentProfile, {
      foreignKey: { name: "storePaymentProfileId", field: "store_payment_profile_id" },
      as: "paymentProfile",
    });
    Suborder.belongsTo(models.Coupon, {
      foreignKey: { name: "appliedCouponId", field: "applied_coupon_id" },
      as: "appliedCoupon",
    });
    Suborder.hasMany(models.SuborderItem, {
      foreignKey: { name: "suborderId", field: "suborder_id" },
      as: "items",
    });
    Suborder.hasMany(models.Payment, {
      foreignKey: { name: "suborderId", field: "suborder_id" },
      as: "payments",
    });
    Suborder.hasOne(models.Shipment, {
      foreignKey: { name: "suborderId", field: "suborder_id" },
      as: "shipment",
    });
  }

  static initModel(sequelize: Sequelize) {
    return Suborder.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "order_id",
          references: {
            model: "orders",
            key: "id",
          },
        },
        suborderNumber: {
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: true,
          field: "suborder_number",
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
        appliedCouponId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "applied_coupon_id",
          references: {
            model: "coupons",
            key: "id",
          },
        },
        appliedCouponCode: {
          type: DataTypes.STRING(120),
          allowNull: true,
          field: "applied_coupon_code",
        },
        appliedCouponScopeType: {
          type: DataTypes.ENUM("PLATFORM", "STORE"),
          allowNull: true,
          field: "applied_coupon_scope_type",
        },
        subtotalAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: "subtotal_amount",
        },
        shippingAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
          field: "shipping_amount",
        },
        serviceFeeAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
          field: "service_fee_amount",
        },
        totalAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: "total_amount",
        },
        paymentMethod: {
          type: DataTypes.ENUM("QRIS", "DUITKU"),
          allowNull: false,
          defaultValue: "QRIS",
          field: "payment_method",
        },
        paymentStatus: {
          type: DataTypes.ENUM(
            "UNPAID",
            "PENDING_CONFIRMATION",
            "PAID",
            "FAILED",
            "EXPIRED",
            "CANCELLED"
          ),
          allowNull: false,
          defaultValue: "UNPAID",
          field: "payment_status",
        },
        fulfillmentStatus: {
          type: DataTypes.ENUM(
            "UNFULFILLED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED"
          ),
          allowNull: false,
          defaultValue: "UNFULFILLED",
          field: "fulfillment_status",
        },
        returnStatus: {
          type: DataTypes.STRING(40),
          allowNull: false,
          defaultValue: "NONE",
          field: "return_status",
        },
        returnReason: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "return_reason",
        },
        returnNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "return_notes",
        },
        returnSolutionType: {
          type: DataTypes.STRING(40),
          allowNull: true,
          defaultValue: "REFUND_ONLY",
          field: "return_solution_type",
        },
        returnBankDetails: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "return_bank_details",
        },
        returnRequestedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "return_requested_at",
        },
        returnSellerNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "return_seller_notes",
        },
        returnSellerRespondedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "return_seller_responded_at",
        },
        returnAdminNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "return_admin_notes",
        },
        returnAdminDecidedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "return_admin_decided_at",
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
        internalNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "internal_notes",
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
        modelName: "Suborder",
        tableName: "suborders",
        underscored: true,
      }
    );
  }
}
