import { DataTypes, Model } from "sequelize";
export class StoreShowcaseProduct extends Model {
    static associate(models) {
        StoreShowcaseProduct.belongsTo(models.StoreShowcase, {
            foreignKey: "showcaseId",
            as: "showcase",
        });
        StoreShowcaseProduct.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product",
        });
    }
    static initModel(sequelize) {
        StoreShowcaseProduct.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            showcaseId: {
                field: "showcase_id",
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            productId: {
                field: "product_id",
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            sortOrder: {
                field: "sort_order",
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }, {
            sequelize,
            modelName: "StoreShowcaseProduct",
            tableName: "store_showcase_products",
            underscored: true,
        });
        return StoreShowcaseProduct;
    }
}
