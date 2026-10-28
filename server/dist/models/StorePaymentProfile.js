import { DataTypes, Model } from "sequelize";
export class StorePaymentProfile extends Model {
    static associate(models) {
        StorePaymentProfile.belongsTo(models.Store, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "store",
        });
        StorePaymentProfile.belongsTo(models.User, {
            foreignKey: { name: "verifiedByAdminId", field: "verified_by_admin_id" },
            as: "verifiedByAdmin",
        });
        StorePaymentProfile.belongsTo(models.User, {
            foreignKey: { name: "activatedByAdminId", field: "activated_by_admin_id" },
            as: "activatedByAdmin",
        });
        StorePaymentProfile.belongsTo(models.StorePaymentProfileRequest, {
            foreignKey: { name: "sourceRequestId", field: "source_request_id" },
            as: "sourceRequest",
        });
        StorePaymentProfile.belongsTo(models.StorePaymentProfile, {
            foreignKey: { name: "supersededByProfileId", field: "superseded_by_profile_id" },
            as: "supersededByProfile",
        });
        StorePaymentProfile.hasMany(models.Suborder, {
            foreignKey: { name: "storePaymentProfileId", field: "store_payment_profile_id" },
            as: "suborders",
        });
        StorePaymentProfile.hasMany(models.Payment, {
            foreignKey: { name: "storePaymentProfileId", field: "store_payment_profile_id" },
            as: "payments",
        });
        StorePaymentProfile.hasMany(models.StorePaymentProfileRequest, {
            foreignKey: { name: "basedOnProfileId", field: "based_on_profile_id" },
            as: "basedOnRequests",
        });
        StorePaymentProfile.hasMany(models.StorePaymentProfileRequest, {
            foreignKey: { name: "promotedProfileId", field: "promoted_profile_id" },
            as: "promotedRequests",
        });
    }
    static initModel(sequelize) {
        return StorePaymentProfile.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
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
            providerCode: {
                type: DataTypes.ENUM("MANUAL_QRIS"),
                allowNull: false,
                defaultValue: "MANUAL_QRIS",
                field: "provider_code",
            },
            paymentType: {
                type: DataTypes.ENUM("QRIS_STATIC"),
                allowNull: false,
                defaultValue: "QRIS_STATIC",
                field: "payment_type",
            },
            version: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 1,
            },
            snapshotStatus: {
                type: DataTypes.ENUM("ACTIVE", "SUPERSEDED", "INACTIVE"),
                allowNull: false,
                defaultValue: "INACTIVE",
                field: "snapshot_status",
            },
            accountName: {
                type: DataTypes.STRING(160),
                allowNull: false,
                field: "account_name",
            },
            merchantName: {
                type: DataTypes.STRING(160),
                allowNull: false,
                field: "merchant_name",
            },
            merchantId: {
                type: DataTypes.STRING(160),
                allowNull: true,
                field: "merchant_id",
            },
            bankName: {
                type: DataTypes.STRING(160),
                allowNull: true,
                field: "bank_name",
            },
            accountNumber: {
                type: DataTypes.STRING(120),
                allowNull: true,
                field: "account_number",
            },
            accountHolderName: {
                type: DataTypes.STRING(160),
                allowNull: true,
                field: "account_holder_name",
            },
            payoutProofImageUrl: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                field: "payout_proof_image_url",
            },
            qrisImageUrl: {
                type: DataTypes.TEXT("long"),
                allowNull: false,
                field: "qris_image_url",
            },
            qrisPayload: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                field: "qris_payload",
            },
            instructionText: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "instruction_text",
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_active",
            },
            verificationStatus: {
                type: DataTypes.ENUM("PENDING", "ACTIVE", "REJECTED", "INACTIVE"),
                allowNull: false,
                defaultValue: "PENDING",
                field: "verification_status",
            },
            sourceRequestId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "source_request_id",
                references: {
                    model: "store_payment_profile_requests",
                    key: "id",
                },
            },
            verifiedByAdminId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "verified_by_admin_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            verifiedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "verified_at",
            },
            activatedByAdminId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "activated_by_admin_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            activatedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "activated_at",
            },
            supersededByProfileId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "superseded_by_profile_id",
                references: {
                    model: "store_payment_profiles",
                    key: "id",
                },
            },
            supersededAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "superseded_at",
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
            modelName: "StorePaymentProfile",
            tableName: "store_payment_profiles",
            underscored: true,
        });
    }
}
