import { Model, DataTypes, } from "sequelize";
export class Order extends Model {
    static associate(models) {
        Order.belongsTo(models.User, {
            foreignKey: { name: "userId", field: "user_id" },
            as: "customer", // Using 'customer' as alias for User in Order context
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: { name: "orderId", field: "order_id" },
            as: "items",
        });
        Order.hasMany(models.Suborder, {
            foreignKey: { name: "orderId", field: "order_id" },
            as: "suborders",
        });
        Order.hasOne(models.OrderCollectionClaim, {
            foreignKey: { name: "orderId", field: "order_id" },
            as: "collectionClaim",
        });
        Order.hasMany(models.OrderPaymentAttempt, {
            foreignKey: { name: "orderId", field: "order_id" },
            as: "paymentAttempts",
        });
        Order.hasMany(models.Shipment, {
            foreignKey: { name: "orderId", field: "order_id" },
            as: "shipments",
        });
    }
    static initModel(sequelize) {
        Order.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            invoiceNo: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            userId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                references: { model: "users", key: "id" },
                field: 'user_id',
            },
            checkoutMode: {
                type: DataTypes.ENUM("LEGACY", "SINGLE_STORE", "MULTI_STORE"),
                allowNull: true,
                defaultValue: "LEGACY",
                field: "checkout_mode",
            },
            subtotalAmount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                defaultValue: 0,
                field: "subtotal_amount",
            },
            shippingAmount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                defaultValue: 0,
                field: "shipping_amount",
            },
            serviceFeeAmount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                defaultValue: 0,
                field: "service_fee_amount",
            },
            paymentStatus: {
                type: DataTypes.ENUM("UNPAID", "PARTIALLY_PAID", "PAID"),
                allowNull: true,
                defaultValue: "UNPAID",
                field: "payment_status",
            },
            shippingDetails: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "shipping_details",
            },
            customerName: {
                type: DataTypes.STRING(120),
                allowNull: true,
                field: "customer_name",
            },
            customerPhone: {
                type: DataTypes.STRING(30),
                allowNull: true,
                field: "customer_phone",
            },
            customerAddress: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "customer_address",
            },
            customerNotes: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "customer_notes",
            },
            paymentMethod: {
                type: DataTypes.STRING(30),
                allowNull: true,
                field: "payment_method",
            },
            couponCode: {
                type: DataTypes.STRING(50),
                allowNull: true,
                field: "coupon_code",
            },
            discountAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                field: "discount_amount",
            },
            totalAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM("pending", "paid", "processing", "shipped", "delivered", "completed", "cancelled"),
                defaultValue: "pending",
                allowNull: false,
            },
        }, {
            sequelize,
            modelName: "Order",
            tableName: "orders",
            underscored: true,
        });
        return Order;
    }
}
