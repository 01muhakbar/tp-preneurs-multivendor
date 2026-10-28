import { DataTypes, Model } from "sequelize";
export class OrderPaymentSecurityEvent extends Model {
    static initModel(sequelize) {
        return OrderPaymentSecurityEvent.init({
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
        }, {
            sequelize,
            modelName: "OrderPaymentSecurityEvent",
            tableName: "order_payment_security_events",
            underscored: true,
            updatedAt: false,
        });
    }
}
