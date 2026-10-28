import { DataTypes, Model } from "sequelize";
export class StoreApplication extends Model {
    static associate(models) {
        models.User.hasMany(StoreApplication, {
            foreignKey: { name: "applicantUserId", field: "applicant_user_id" },
            as: "storeApplications",
        });
        models.User.hasMany(StoreApplication, {
            foreignKey: { name: "reviewedByUserId", field: "reviewed_by_user_id" },
            as: "reviewedStoreApplications",
        });
        StoreApplication.belongsTo(models.User, {
            foreignKey: { name: "applicantUserId", field: "applicant_user_id" },
            as: "applicantUser",
        });
        StoreApplication.belongsTo(models.User, {
            foreignKey: { name: "reviewedByUserId", field: "reviewed_by_user_id" },
            as: "reviewedByUser",
        });
    }
    static initModel(sequelize) {
        return StoreApplication.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            applicantUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "applicant_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            status: {
                type: DataTypes.ENUM("draft", "submitted", "under_review", "revision_requested", "approved", "rejected", "cancelled"),
                allowNull: false,
                defaultValue: "draft",
            },
            currentStep: {
                type: DataTypes.ENUM("owner_identity", "store_information", "operational_address", "payout_payment", "compliance", "review"),
                allowNull: false,
                defaultValue: "store_information",
                field: "current_step",
            },
            ownerIdentitySnapshot: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "owner_identity_snapshot",
            },
            storeInformationSnapshot: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "store_information_snapshot",
            },
            operationalAddressSnapshot: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "operational_address_snapshot",
            },
            payoutPaymentSnapshot: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "payout_payment_snapshot",
            },
            complianceSnapshot: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "compliance_snapshot",
            },
            submittedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "submitted_at",
            },
            reviewedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "reviewed_at",
            },
            reviewedByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "reviewed_by_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            revisionNote: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "revision_note",
            },
            rejectReason: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "reject_reason",
            },
            internalMetadata: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "internal_metadata",
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
            modelName: "StoreApplication",
            tableName: "store_applications",
            underscored: true,
        });
    }
}
