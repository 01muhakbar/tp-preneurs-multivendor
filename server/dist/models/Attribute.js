import { DataTypes, Model } from "sequelize";
export class Attribute extends Model {
    static initModel(sequelize) {
        Attribute.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            displayName: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "display_name",
            },
            type: {
                type: DataTypes.ENUM("dropdown", "radio", "checkbox"),
                allowNull: false,
                defaultValue: "dropdown",
            },
            published: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            scope: {
                type: DataTypes.ENUM("global", "store"),
                allowNull: false,
                defaultValue: "global",
            },
            storeId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "store_id",
            },
            createdByRole: {
                type: DataTypes.ENUM("admin", "seller"),
                allowNull: false,
                defaultValue: "admin",
                field: "created_by_role",
            },
            createdByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "created_by_user_id",
            },
            status: {
                type: DataTypes.ENUM("active", "archived"),
                allowNull: false,
                defaultValue: "active",
            },
        }, {
            sequelize,
            modelName: "Attribute",
            tableName: "attributes",
            underscored: true,
        });
        return Attribute;
    }
}
