import { DataTypes, Model } from "sequelize";
export class Currency extends Model {
    static initModel(sequelize) {
        Currency.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING(16),
                allowNull: false,
                unique: true,
            },
            symbol: {
                type: DataTypes.STRING(16),
                allowNull: false,
            },
            exchangeRate: {
                type: DataTypes.DECIMAL(18, 6),
                allowNull: false,
                defaultValue: "1",
                field: "exchange_rate",
            },
            published: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        }, {
            sequelize,
            modelName: "Currency",
            tableName: "currencies",
        });
        return Currency;
    }
}
