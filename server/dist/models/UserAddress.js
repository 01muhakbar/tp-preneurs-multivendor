import { DataTypes, Model } from "sequelize";
export class UserAddress extends Model {
    static associate(models) {
        UserAddress.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
        if (models.User && typeof models.User.hasMany === "function") {
            models.User.hasMany(models.UserAddress, {
                foreignKey: "userId",
                as: "addresses",
            });
        }
    }
    static initModel(sequelize) {
        UserAddress.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            fullName: {
                type: DataTypes.STRING(120),
                allowNull: false,
                field: "full_name",
            },
            phoneNumber: {
                type: DataTypes.STRING(30),
                allowNull: false,
                field: "phone_number",
            },
            province: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            city: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            district: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            postalCode: {
                type: DataTypes.STRING(10),
                allowNull: false,
                field: "postal_code",
            },
            streetName: {
                type: DataTypes.STRING(200),
                allowNull: false,
                field: "street_name",
            },
            building: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },
            houseNumber: {
                type: DataTypes.STRING(50),
                allowNull: false,
                field: "house_number",
            },
            otherDetails: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "other_details",
            },
            markAs: {
                type: DataTypes.ENUM("HOME", "OFFICE"),
                allowNull: false,
                defaultValue: "HOME",
                field: "mark_as",
            },
            isPrimary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_primary",
            },
            isStore: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_store",
            },
            isReturn: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "is_return",
            },
        }, {
            sequelize,
            modelName: "UserAddress",
            tableName: "user_addresses",
            underscored: true,
        });
        return UserAddress;
    }
}
