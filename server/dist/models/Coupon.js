import { DataTypes, Model } from "sequelize";
export class Coupon extends Model {
    static associate(models) {
        Coupon.belongsTo(models.Store, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "store",
        });
    }
    static initModel(sequelize) {
        Coupon.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            code: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false,
            },
            campaignName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "campaign_name",
            },
            discountType: {
                type: DataTypes.ENUM("percent", "fixed"),
                defaultValue: "percent",
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            minSpend: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            bannerImageUrl: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "banner_image_url",
            },
            scopeType: {
                type: DataTypes.ENUM("PLATFORM", "STORE"),
                allowNull: false,
                defaultValue: "PLATFORM",
                field: "scope_type",
            },
            storeId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "store_id",
                references: {
                    model: "stores",
                    key: "id",
                },
            },
            startsAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "starts_at",
            },
            expiresAt: DataTypes.DATE,
        }, {
            sequelize,
            modelName: "Coupon",
            tableName: "coupons",
            underscored: true,
        });
        return Coupon;
    }
}
