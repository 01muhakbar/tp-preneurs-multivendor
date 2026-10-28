import { DataTypes, Model } from "sequelize";
export class OrderPaymentAttemptEvent extends Model {
    static associate(models) {
        OrderPaymentAttemptEvent.belongsTo(models.OrderPaymentAttempt, {
            foreignKey: { name: "paymentAttemptId", field: "payment_attempt_id" },
            as: "paymentAttempt",
        });
        OrderPaymentAttemptEvent.belongsTo(models.DuitkuCallbackInbox, {
            foreignKey: { name: "callbackInboxId", field: "callback_inbox_id" },
            as: "callbackInbox",
        });
    }
    static initModel(sequelize) {
        return OrderPaymentAttemptEvent.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            paymentAttemptId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "payment_attempt_id",
                references: {
                    model: "order_payment_attempts",
                    key: "id",
                },
            },
            callbackInboxId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                unique: true,
                field: "callback_inbox_id",
                references: {
                    model: "duitku_callback_inbox",
                    key: "id",
                },
            },
            eventType: {
                type: DataTypes.ENUM("CREATE_INVOICE", "CALLBACK", "STATUS_CHECK", "RECOVERY", "RETURN_OBSERVED"),
                allowNull: false,
                field: "event_type",
            },
            occurrenceKey: {
                type: DataTypes.CHAR(64),
                allowNull: false,
                field: "occurrence_key",
            },
            providerCallId: {
                type: DataTypes.CHAR(36),
                allowNull: true,
                field: "provider_call_id",
            },
            reconciliationRunId: {
                type: DataTypes.CHAR(36),
                allowNull: true,
                field: "reconciliation_run_id",
            },
            merchantOrderId: {
                type: DataTypes.STRING(50),
                allowNull: true,
                field: "merchant_order_id",
            },
            providerReference: {
                type: DataTypes.STRING(160),
                allowNull: true,
                field: "provider_reference",
            },
            providerAmountRaw: {
                type: DataTypes.STRING(64),
                allowNull: true,
                field: "provider_amount_raw",
            },
            amountNormalized: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                field: "amount_normalized",
            },
            providerResultCode: {
                type: DataTypes.STRING(40),
                allowNull: true,
                field: "provider_result_code",
            },
            providerStatusCode: {
                type: DataTypes.STRING(40),
                allowNull: true,
                field: "provider_status_code",
            },
            paymentCode: {
                type: DataTypes.STRING(40),
                allowNull: true,
                field: "payment_code",
            },
            signatureState: {
                type: DataTypes.ENUM("VALID", "NOT_APPLICABLE", "NOT_CHECKED"),
                allowNull: false,
                defaultValue: "NOT_CHECKED",
                field: "signature_state",
            },
            processingResult: {
                type: DataTypes.ENUM("APPLIED", "IGNORED", "QUARANTINED", "ERROR"),
                allowNull: false,
                field: "processing_result",
            },
            eventHash: {
                type: DataTypes.CHAR(64),
                allowNull: false,
                field: "event_hash",
            },
            rawBodyDigest: {
                type: DataTypes.CHAR(64),
                allowNull: true,
                field: "raw_body_digest",
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
            modelName: "OrderPaymentAttemptEvent",
            tableName: "order_payment_attempt_events",
            underscored: true,
        });
    }
}
