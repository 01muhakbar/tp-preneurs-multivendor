import { DataTypes, Model } from "sequelize";
export class Language extends Model {
    static initModel(sequelize) {
        Language.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },
            isoCode: {
                type: DataTypes.STRING(16),
                allowNull: false,
                unique: true,
            },
            flag: {
                type: DataTypes.STRING(8),
                allowNull: true,
            },
            published: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        }, {
            sequelize,
            modelName: "Language",
            tableName: "languages",
        });
        return Language;
    }
}
