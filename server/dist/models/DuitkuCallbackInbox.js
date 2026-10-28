import { DataTypes, Model } from "sequelize";
export class DuitkuCallbackInbox extends Model {
    static associate(models) {
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
    static initModel(sequelize) {
        return DuitkuCallbackInbox.init({
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
            paymentCodeRaw: {
                type: DataTypes.STRING(40),
                allowNull: true,
                field: "payment_code_raw",
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
        }, {
            sequelize,
            modelName: "DuitkuCallbackInbox",
            tableName: "duitku_callback_inbox",
            underscored: true,
        });
    }
}
