import { DataTypes, Model } from "sequelize";
export class Notification extends Model {
    static initModel(sequelize) {
        Notification.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            type: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_read",
            },
            meta: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: "Notification",
            tableName: "notifications",
            underscored: true,
        });
        return Notification;
    }
}
