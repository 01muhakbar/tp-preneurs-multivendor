import { DataTypes, Model } from "sequelize";
export class NewsletterSubscriber extends Model {
    static initModel(sequelize) {
        NewsletterSubscriber.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING(191),
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            status: {
                type: DataTypes.STRING(32),
                allowNull: false,
                defaultValue: "active",
            },
            source: {
                type: DataTypes.STRING(64),
                allowNull: false,
                defaultValue: "storefront_footer",
            },
            lang: {
                type: DataTypes.STRING(16),
                allowNull: false,
                defaultValue: "id",
            },
        }, {
            sequelize,
            tableName: "newsletter_subscribers",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["email"],
                },
            ],
        });
        return NewsletterSubscriber;
    }
}
