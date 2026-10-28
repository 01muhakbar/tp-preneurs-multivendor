import { DataTypes, Model } from "sequelize";
export class PaymentStatusLog extends Model {
    static associate(models) {
        PaymentStatusLog.belongsTo(models.Payment, {
            foreignKey: { name: "paymentId", field: "payment_id" },
            as: "payment",
        });
        PaymentStatusLog.belongsTo(models.User, {
            foreignKey: { name: "actorId", field: "actor_id" },
            as: "actorUser",
        });
    }
    static initModel(sequelize) {
        return PaymentStatusLog.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            paymentId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "payment_id",
                references: {
                    model: "payments",
                    key: "id",
                },
            },
            oldStatus: {
                type: DataTypes.STRING(80),
                allowNull: true,
                field: "old_status",
            },
            newStatus: {
                type: DataTypes.STRING(80),
                allowNull: false,
                field: "new_status",
            },
            actorType: {
                type: DataTypes.ENUM("SYSTEM", "BUYER", "SELLER", "ADMIN", "WEBHOOK"),
                allowNull: false,
                field: "actor_type",
            },
            actorId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "actor_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            note: {
                type: DataTypes.TEXT,
                allowNull: true,
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
            modelName: "PaymentStatusLog",
            tableName: "payment_status_logs",
            underscored: true,
        });
    }
}
