import { DataTypes, Model } from "sequelize";
export class Store extends Model {
    static associate(models) {
        models.User.hasOne(Store, {
            foreignKey: { name: "ownerUserId", field: "owner_user_id" },
            as: "store",
        });
        Store.belongsTo(models.User, {
            foreignKey: { name: "ownerUserId", field: "owner_user_id" },
            as: "owner",
        });
        Store.belongsTo(models.StorePaymentProfile, {
            foreignKey: { name: "activeStorePaymentProfileId", field: "active_store_payment_profile_id" },
            as: "activePaymentProfile",
        });
        Store.hasOne(models.StorePaymentProfile, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "paymentProfile",
        });
        Store.hasMany(models.StorePaymentProfileRequest, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "paymentProfileRequests",
        });
        Store.hasMany(models.Suborder, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "suborders",
        });
        Store.hasMany(models.Payment, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "payments",
        });
        Store.hasMany(models.Shipment, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "shipments",
        });
        Store.hasMany(models.Product, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "products",
        });
        Store.hasMany(models.Coupon, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "coupons",
        });
    }
    static initModel(sequelize) {
        return Store.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            ownerUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                unique: true,
                field: "owner_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            activeStorePaymentProfileId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "active_store_payment_profile_id",
                references: {
                    model: "store_payment_profiles",
                    key: "id",
                },
            },
            name: {
                type: DataTypes.STRING(160),
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING(180),
                allowNull: false,
                unique: true,
            },
            status: {
                type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
                allowNull: false,
                defaultValue: "ACTIVE",
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            logoUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                field: "logo_url",
            },
            bannerUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                field: "banner_url",
            },
            email: {
                type: DataTypes.STRING(160),
                allowNull: true,
            },
            phone: {
                type: DataTypes.STRING(64),
                allowNull: true,
            },
            whatsapp: {
                type: DataTypes.STRING(64),
                allowNull: true,
            },
            websiteUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                field: "website_url",
            },
            instagramUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                field: "instagram_url",
            },
            tiktokUrl: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                field: "tiktok_url",
            },
            addressLine1: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "address_line_1",
            },
            addressLine2: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "address_line_2",
            },
            city: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },
            district: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },
            province: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },
            postalCode: {
                type: DataTypes.STRING(32),
                allowNull: true,
                field: "postal_code",
            },
            country: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },
            shippingSetup: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "shipping_setup",
            },
            ownerIdentity: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "owner_identity",
            },
            businessDetails: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "business_details",
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
            modelName: "Store",
            tableName: "stores",
            underscored: true,
        });
    }
}
