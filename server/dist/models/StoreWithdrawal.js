import { Model, DataTypes } from "sequelize";
export class StoreWithdrawal extends Model {
    static associate(models) {
        models.Store.hasMany(StoreWithdrawal, {
            foreignKey: { name: "storeId", field: "storeId" },
            as: "withdrawals",
        });
        StoreWithdrawal.belongsTo(models.Store, {
            foreignKey: { name: "storeId", field: "storeId" },
            as: "store",
        });
    }
}
export function initStoreWithdrawal(sequelizeInstance) {
    StoreWithdrawal.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "stores",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        adminFeeAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 6500,
        },
        netTransferAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "PROCESSING", "COMPLETED", "REJECTED"),
            allowNull: false,
            defaultValue: "PENDING",
        },
        bankName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        proofImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        adminNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        requestedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize: sequelizeInstance,
        tableName: "store_withdrawals",
        timestamps: true,
    });
}
