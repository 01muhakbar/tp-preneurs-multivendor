import { DataTypes, Model } from "sequelize";
export class StoreRole extends Model {
    static associate(models) {
        StoreRole.hasMany(models.StoreMember, {
            foreignKey: { name: "storeRoleId", field: "store_role_id" },
            as: "members",
        });
    }
    static initModel(sequelize) {
        return StoreRole.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            code: {
                type: DataTypes.STRING(64),
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
            isSystem: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: "is_system",
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: "is_active",
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
            modelName: "StoreRole",
            tableName: "store_roles",
            underscored: true,
        });
    }
}
