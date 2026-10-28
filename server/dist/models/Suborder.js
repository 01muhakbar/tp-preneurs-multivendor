import { DataTypes, Model } from "sequelize";
export class Suborder extends Model {
    static associate(models) {
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
    static initModel(sequelize) {
        return Suborder.init({
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
                type: DataTypes.ENUM("UNPAID", "PENDING_CONFIRMATION", "PAID", "FAILED", "EXPIRED", "CANCELLED"),
                allowNull: false,
                defaultValue: "UNPAID",
                field: "payment_status",
            },
            fulfillmentStatus: {
                type: DataTypes.ENUM("UNFULFILLED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"),
                allowNull: false,
                defaultValue: "UNFULFILLED",
                field: "fulfillment_status",
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
        }, {
            sequelize,
            modelName: "Suborder",
            tableName: "suborders",
            underscored: true,
        });
    }
}
