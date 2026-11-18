import { DataTypes, Model, Sequelize, Optional } from "sequelize";

export interface StoreShowcaseProductAttributes {
  id: number;
  showcaseId: number;
  productId: number;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StoreShowcaseProductCreationAttributes
  extends Optional<StoreShowcaseProductAttributes, "id" | "sortOrder" | "createdAt" | "updatedAt"> {}

export class StoreShowcaseProduct
  extends Model<StoreShowcaseProductAttributes, StoreShowcaseProductCreationAttributes>
  implements StoreShowcaseProductAttributes
{
  declare id: number;
  declare showcaseId: number;
  declare productId: number;
  declare sortOrder: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    StoreShowcaseProduct.belongsTo(models.StoreShowcase, {
      foreignKey: "showcaseId",
      as: "showcase",
    });
    StoreShowcaseProduct.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  }

  static initModel(sequelize: Sequelize): typeof StoreShowcaseProduct {
    StoreShowcaseProduct.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        showcaseId: {
          field: "showcase_id",
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        productId: {
          field: "product_id",
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        sortOrder: {
          field: "sort_order",
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: "StoreShowcaseProduct",
        tableName: "store_showcase_products",
        underscored: true,
      }
    );
    return StoreShowcaseProduct;
  }
}
