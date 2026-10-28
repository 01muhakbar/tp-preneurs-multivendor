import { DataTypes, Model } from "sequelize";
export class OrderPaymentAttempt extends Model {
    static associate(models) {
        OrderPaymentAttempt.belongsTo(models.Order, {
            foreignKey: { name: "orderId", field: "order_id" },
            as: "order",
        });
        OrderPaymentAttempt.belongsTo(models.User, {
            foreignKey: { name: "createdByUserId", field: "created_by_user_id" },
            as: "createdByUser",
        });
        OrderPaymentAttempt.belongsTo(models.User, {
            foreignKey: { name: "manualReviewedByUserId", field: "manual_reviewed_by_user_id" },
            as: "manualReviewedByUser",
        });
        OrderPaymentAttempt.hasOne(models.OrderCollectionClaim, {
            foreignKey: { name: "orderPaymentAttemptId", field: "order_payment_attempt_id" },
            as: "collectionClaim",
        });
        OrderPaymentAttempt.hasMany(models.DuitkuCallbackInbox, {
            foreignKey: { name: "paymentAttemptId", field: "payment_attempt_id" },
            as: "callbackInboxRows",
        });
        OrderPaymentAttempt.hasMany(models.DuitkuCallbackInbox, {
            foreignKey: { name: "resolvedPaymentAttemptId", field: "resolved_payment_attempt_id" },
            as: "resolvedCallbackInboxRows",
        });
        OrderPaymentAttempt.hasMany(models.OrderPaymentAttemptEvent, {
            foreignKey: { name: "paymentAttemptId", field: "payment_attempt_id" },
            as: "events",
        });
        OrderPaymentAttempt.hasMany(models.Payment, {
            foreignKey: { name: "paidByOrderPaymentAttemptId", field: "paid_by_order_payment_attempt_id" },
            as: "paidAllocations",
        });
    }
    static initModel(sequelize) {
        return OrderPaymentAttempt.init({
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
            provider: {
                type: DataTypes.ENUM("DUITKU"),
                allowNull: false,
                defaultValue: "DUITKU",
            },
            status: {
                type: DataTypes.ENUM("CREATED", "PENDING", "PAID", "FAILED", "CANCELLED", "EXPIRED", "UNKNOWN"),
                allowNull: false,
                defaultValue: "CREATED",
            },
            requiresManualReview: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "requires_manual_review",
            },
            manualReviewReason: {
                type: DataTypes.STRING(120),
                allowNull: true,
                field: "manual_review_reason",
            },
            manualReviewCreatedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "manual_review_created_at",
            },
            manualReviewedByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "manual_reviewed_by_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            manualReviewedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "manual_reviewed_at",
            },
            merchantOrderId: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
                field: "merchant_order_id",
            },
            providerReference: {
                type: DataTypes.STRING(160),
                allowNull: true,
                unique: true,
                field: "provider_reference",
            },
            paymentUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "payment_url",
            },
            amount: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            currency: {
                type: DataTypes.CHAR(3),
                allowNull: false,
                defaultValue: "IDR",
            },
            expiryPeriodMinutes: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 60,
                field: "expiry_period_minutes",
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "expires_at",
            },
            createdAtProvider: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "created_at_provider",
            },
            paidAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "paid_at",
            },
            cancelledAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "cancelled_at",
            },
            expiredAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "expired_at",
            },
            idempotencyKeyHash: {
                type: DataTypes.CHAR(64),
                allowNull: false,
                field: "idempotency_key_hash",
            },
            requestFingerprint: {
                type: DataTypes.CHAR(64),
                allowNull: false,
                field: "request_fingerprint",
            },
            providerLastCode: {
                type: DataTypes.STRING(40),
                allowNull: true,
                field: "provider_last_code",
            },
            providerLastMessage: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "provider_last_message",
            },
            lastReconciledAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "last_reconciled_at",
            },
            reconcileAttemptCount: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                field: "reconcile_attempt_count",
            },
            nextReconcileAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "next_reconcile_at",
            },
            lastReconcileErrorCode: {
                type: DataTypes.STRING(64),
                allowNull: true,
                field: "last_reconcile_error_code",
            },
            lastReconcileErrorAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "last_reconcile_error_at",
            },
            createdByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "created_by_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
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
            modelName: "OrderPaymentAttempt",
            tableName: "order_payment_attempts",
            underscored: true,
        });
    }
}
