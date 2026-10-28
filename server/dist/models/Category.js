import { DataTypes, Model } from "sequelize";
export class Category extends Model {
    static associate(_models) {
        const models = _models;
        Category.hasMany(Category, { as: "children", foreignKey: "parentId" });
        Category.belongsTo(Category, { as: "parent", foreignKey: "parentId" });
        Category.hasMany(models.Product, { as: "products", foreignKey: "categoryId" });
        Category.hasMany(models.Product, { as: "defaultProducts", foreignKey: "defaultCategoryId" });
        Category.belongsToMany(models.Product, {
            through: models.ProductCategory,
            foreignKey: "categoryId",
            otherKey: "productId",
            as: "relatedProducts",
        });
    }
    static initModel(sequelize) {
        Category.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            code: {
                type: DataTypes.STRING(32),
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.STRING(120),
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
            published: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            parentId: {
                field: "parent_id",
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: "Category",
            tableName: "categories",
            underscored: true,
        });
        return Category;
    }
}
