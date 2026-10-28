import { DataTypes, Model } from "sequelize";
export class UserRegistrationVerification extends Model {
    static associate(models) {
        UserRegistrationVerification.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
        if (models.User && typeof models.User.hasMany === "function") {
            models.User.hasMany(models.UserRegistrationVerification, {
                foreignKey: "userId",
                as: "registrationVerifications",
            });
        }
    }
    static initModel(sequelize) {
        UserRegistrationVerification.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            publicId: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true,
                field: "public_id",
            },
            channel: {
                type: DataTypes.STRING(16),
                allowNull: false,
                defaultValue: "EMAIL",
            },
            status: {
                type: DataTypes.STRING(32),
                allowNull: false,
                defaultValue: "PENDING",
            },
            otpHash: {
                type: DataTypes.STRING(128),
                allowNull: false,
                field: "otp_hash",
            },
            otpExpiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
                field: "otp_expires_at",
            },
            resendAvailableAt: {
                type: DataTypes.DATE,
                allowNull: false,
                field: "resend_available_at",
            },
            lastSentAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "last_sent_at",
            },
            attempts: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
            },
            maxAttempts: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 5,
                field: "max_attempts",
            },
            resendCount: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                field: "resend_count",
            },
            maxResends: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 5,
                field: "max_resends",
            },
            verifiedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "verified_at",
            },
            consumedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "consumed_at",
            },
            lastAttemptAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "last_attempt_at",
            },
            blockedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "blocked_at",
            },
            lastDeliveryError: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "last_delivery_error",
            },
        }, {
            sequelize,
            modelName: "UserRegistrationVerification",
            tableName: "user_registration_verifications",
            underscored: true,
            indexes: [
                { name: "user_registration_verifications_user_id_idx", fields: ["user_id"] },
                { name: "user_registration_verifications_status_idx", fields: ["status"] },
            ],
        });
        return UserRegistrationVerification;
    }
}
