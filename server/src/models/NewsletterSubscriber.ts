import { DataTypes, Model, Sequelize, Optional } from "sequelize";

interface NewsletterSubscriberAttributes {
  id: number;
  email: string;
  status: "active" | "unsubscribed";
  source: string;
  lang: string;
}

interface NewsletterSubscriberCreationAttributes
  extends Optional<NewsletterSubscriberAttributes, "id" | "status" | "source" | "lang"> {}

export class NewsletterSubscriber
  extends Model<NewsletterSubscriberAttributes, NewsletterSubscriberCreationAttributes>
  implements NewsletterSubscriberAttributes
{
  declare id: number;
  declare email: string;
  declare status: "active" | "unsubscribed";
  declare source: string;
  declare lang: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof NewsletterSubscriber {
    NewsletterSubscriber.init(
      {
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
      },
      {
        sequelize,
        tableName: "newsletter_subscribers",
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ["email"],
          },
        ],
      }
    );

    return NewsletterSubscriber;
  }
}

