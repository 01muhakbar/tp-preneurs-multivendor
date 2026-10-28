import { DataTypes, Model } from "sequelize";
export class ProductCategory extends Model {
    static associate() {
        return undefined;
    }
    static initModel(sequelize) {
        ProductCategory.init({
            productId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                primaryKey: true,
                field: "product_id",
                references: {
                    model: "products",
                    key: "id",
                },
            },
            categoryId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                primaryKey: true,
                field: "category_id",
                references: {
                    model: "categories",
                    key: "id",
                },
            },
        }, {
            sequelize,
            modelName: "ProductCategory",
            tableName: "product_categories",
            timestamps: false,
            underscored: true,
        });
        return ProductCategory;
    }
}
