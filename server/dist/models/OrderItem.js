import { DataTypes, Model } from "sequelize";
export class OrderItem extends Model {
    static associate(models) {
        OrderItem.belongsTo(models.Order, { foreignKey: "orderId" });
        OrderItem.belongsTo(models.Product, {
            as: "product",
            foreignKey: "productId",
        });
    }
    static initModel(sequelize) {
        OrderItem.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            orderId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: 'order_id',
            },
            productId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: 'product_id',
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            variantKey: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            variantLabel: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            variantSelections: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            skuSnapshot: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            barcodeSnapshot: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            imageSnapshot: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: "OrderItem",
            tableName: "order_items",
            underscored: false,
        });
        return OrderItem;
    }
}
