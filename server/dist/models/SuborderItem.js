import { DataTypes, Model } from "sequelize";
export class SuborderItem extends Model {
    static associate(models) {
        SuborderItem.belongsTo(models.Suborder, {
            foreignKey: { name: "suborderId", field: "suborder_id" },
            as: "suborder",
        });
        SuborderItem.belongsTo(models.Product, {
            foreignKey: { name: "productId", field: "product_id" },
            as: "product",
        });
        SuborderItem.belongsTo(models.Store, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "store",
        });
    }
    static initModel(sequelize) {
        return SuborderItem.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            suborderId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "suborder_id",
                references: {
                    model: "suborders",
                    key: "id",
                },
            },
            productId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "product_id",
                references: {
                    model: "products",
                    key: "id",
                },
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
            productNameSnapshot: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: "product_name_snapshot",
            },
            skuSnapshot: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: "sku_snapshot",
            },
            productTypeSnapshot: {
                type: DataTypes.STRING(30),
                allowNull: true,
                field: "product_type_snapshot",
            },
            variantKey: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "variant_key",
            },
            variantLabel: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "variant_label",
            },
            variantSelections: {
                type: DataTypes.JSON,
                allowNull: true,
                field: "variant_selections",
            },
            barcodeSnapshot: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: "barcode_snapshot",
            },
            imageSnapshot: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "image_snapshot",
            },
            priceSnapshot: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                field: "price_snapshot",
            },
            qty: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            totalPrice: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                field: "total_price",
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
            modelName: "SuborderItem",
            tableName: "suborder_items",
            underscored: true,
        });
    }
}
