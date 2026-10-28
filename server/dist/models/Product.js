import { DataTypes, Model } from "sequelize";
class Product extends Model {
    static associate(models) {
        // Define associations here
        Product.belongsTo(models.Category, {
            foreignKey: "categoryId",
            as: "category",
        });
        Product.belongsTo(models.Category, {
            foreignKey: "defaultCategoryId",
            as: "defaultCategory",
        });
        Product.belongsToMany(models.Category, {
            through: models.ProductCategory,
            foreignKey: "productId",
            otherKey: "categoryId",
            as: "categories",
        });
        Product.belongsTo(models.User, {
            foreignKey: "userId",
            as: "seller",
        });
        Product.belongsTo(models.Store, {
            foreignKey: { name: "storeId", field: "store_id" },
            as: "store",
        });
    }
    static initModel(sequelize) {
        return Product.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            name: { type: DataTypes.STRING(255), allowNull: false },
            slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
            sku: { type: DataTypes.STRING(100), allowNull: true, unique: false },
            barcode: { type: DataTypes.STRING(100), allowNull: true },
            gtin: { type: DataTypes.STRING(100), allowNull: true },
            price: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },
            stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            weight: { type: DataTypes.INTEGER, allowNull: true },
            notes: { type: DataTypes.TEXT, allowNull: true },
            parentSku: { type: DataTypes.STRING(100), allowNull: true },
            condition: { type: DataTypes.STRING(50), allowNull: true },
            length: { type: DataTypes.INTEGER, allowNull: true },
            width: { type: DataTypes.INTEGER, allowNull: true },
            height: { type: DataTypes.INTEGER, allowNull: true },
            dangerousProduct: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            preOrder: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            preorderDays: { type: DataTypes.INTEGER, allowNull: true },
            youtubeLink: { type: DataTypes.STRING(255), allowNull: true },
            seo: { type: DataTypes.JSON, allowNull: true },
            variations: { type: DataTypes.JSON, allowNull: true },
            wholesale: { type: DataTypes.JSON, allowNull: true },
            promoImagePath: { type: DataTypes.STRING(255), allowNull: true },
            imagePaths: { type: DataTypes.JSON, allowNull: true },
            videoPath: { type: DataTypes.STRING(255), allowNull: true },
            tags: { type: DataTypes.JSON, allowNull: true },
            userId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            storeId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "store_id",
                references: {
                    model: "stores",
                    key: "id",
                },
            },
            categoryId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                references: {
                    model: "categories",
                    key: "id",
                },
            },
            defaultCategoryId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                references: {
                    model: "categories",
                    key: "id",
                },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            salePrice: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM("active", "inactive", "draft"),
                allowNull: false,
                defaultValue: "draft",
            },
            isPublished: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: "published",
            },
            sellerSubmissionStatus: {
                type: DataTypes.ENUM("none", "submitted", "needs_revision"),
                allowNull: false,
                defaultValue: "none",
                field: "seller_submission_status",
            },
            sellerSubmittedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "seller_submitted_at",
            },
            sellerSubmittedByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "seller_submitted_by_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            sellerRevisionRequestedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "seller_revision_requested_at",
            },
            sellerRevisionRequestedByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "seller_revision_requested_by_user_id",
                references: {
                    model: "users",
                    key: "id",
                },
            },
            sellerRevisionNote: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "seller_revision_note",
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
            modelName: "Product",
            tableName: "products",
            underscored: true,
            hooks: {
                beforeValidate: async (product) => {
                    const ownerUserId = Number(product.get("userId") ?? 0);
                    const currentStoreId = Number(product.get("storeId") ?? 0);
                    if (!Number.isFinite(ownerUserId) || ownerUserId <= 0 || currentStoreId > 0) {
                        return;
                    }
                    const models = product.sequelize?.models ?? {};
                    const StoreModel = models.Store;
                    if (!StoreModel)
                        return;
                    let store = await StoreModel.findOne({
                        where: { ownerUserId },
                        attributes: ["id", "name", "slug", "ownerUserId"],
                    });
                    if (!store) {
                        const UserModel = models.User;
                        const owner = UserModel
                            ? await UserModel.findByPk(ownerUserId, {
                                attributes: ["id", "name", "email"],
                            })
                            : null;
                        const ownerName = String(owner?.get?.("name") ?? owner?.name ?? "").trim();
                        const ownerEmail = String(owner?.get?.("email") ?? owner?.email ?? "").trim();
                        const baseName = ownerName ||
                            (ownerEmail ? ownerEmail.split("@")[0].replace(/[._-]+/g, " ") : "") ||
                            `Store ${ownerUserId}`;
                        const normalizedBase = baseName
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "") || `store-${ownerUserId}`;
                        store = await StoreModel.create({
                            ownerUserId,
                            name: baseName.trim() || `Store ${ownerUserId}`,
                            slug: `${normalizedBase}-${ownerUserId}`,
                            status: "ACTIVE",
                        });
                    }
                    const resolvedStoreId = Number(store?.getDataValue?.("id") ?? store?.get?.("id") ?? store?.id ?? 0);
                    if (Number.isFinite(resolvedStoreId) && resolvedStoreId > 0) {
                        product.set("storeId", resolvedStoreId);
                    }
                },
            },
        });
    }
}
export { Product };
