import { DataTypes, Model } from "sequelize";
export class StoreShowcase extends Model {
    static associate(models) {
        StoreShowcase.belongsTo(models.Store, {
            foreignKey: "storeId",
            as: "store",
        });
        StoreShowcase.belongsToMany(models.Product, {
            through: models.StoreShowcaseProduct,
            foreignKey: "showcaseId",
            otherKey: "productId",
            as: "products",
        });
        StoreShowcase.hasMany(models.StoreShowcaseProduct, {
            foreignKey: "showcaseId",
            as: "showcaseProducts",
        });
    }
    static initModel(sequelize) {
        StoreShowcase.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            storeId: {
                field: "store_id",
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING(140),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            icon: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            sortOrder: {
                field: "sort_order",
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            isActive: {
                field: "is_active",
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        }, {
            sequelize,
            modelName: "StoreShowcase",
            tableName: "store_showcases",
            underscored: true,
        });
        return StoreShowcase;
    }
}
