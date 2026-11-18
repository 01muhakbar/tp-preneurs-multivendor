import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export interface StoreShowcaseAttributes {
  id: number;
  storeId: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StoreShowcaseCreationAttributes
  extends Optional<StoreShowcaseAttributes, "id" | "sortOrder" | "isActive" | "description" | "icon" | "createdAt" | "updatedAt"> {}

export class StoreShowcase
  extends Model<StoreShowcaseAttributes, StoreShowcaseCreationAttributes>
  implements StoreShowcaseAttributes
{
  declare id: number;
  declare storeId: number;
  declare name: string;
  declare slug: string;
  declare description?: string | null;
  declare icon?: string | null;
  declare sortOrder: number;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    StoreShowcase.belongsTo(models.Store, {
      foreignKey: "storeId",
      as: "store",
    });
    StoreShowcase.belongsToMany(models.Product, {
      through: models.StoreShowcaseProduct,
      foreignKey: "showcaseId",
      otherKey: "productId",
      as: "products",
    });
    StoreShowcase.hasMany(models.StoreShowcaseProduct, {
      foreignKey: "showcaseId",
      as: "showcaseProducts",
    });
  }

  static initModel(sequelize: Sequelize): typeof StoreShowcase {
    StoreShowcase.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        storeId: {
          field: "store_id",
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(140),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        icon: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        sortOrder: {
          field: "sort_order",
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        isActive: {
          field: "is_active",
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: "StoreShowcase",
        tableName: "store_showcases",
        underscored: true,
      }
    );
    return StoreShowcase;
  }
}
