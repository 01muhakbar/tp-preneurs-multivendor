import { DataTypes, Model } from "sequelize";
export class ProductReview extends Model {
    static associate(models) {
        ProductReview.belongsTo(models.User, {
            foreignKey: { name: "userId", field: "user_id" },
            as: "user",
        });
        ProductReview.belongsTo(models.Product, {
            foreignKey: { name: "productId", field: "product_id" },
            as: "product",
        });
        ProductReview.belongsTo(models.User, {
            foreignKey: { name: "repliedByUserId", field: "replied_by_user_id" },
            as: "repliedBy",
        });
        ProductReview.belongsTo(models.User, {
            foreignKey: { name: "reportedByUserId", field: "reported_by_user_id" },
            as: "reportedBy",
        });
    }
    static initModel(sequelize) {
        ProductReview.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                references: { model: "users", key: "id" },
                field: "user_id",
            },
            productId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                references: { model: "products", key: "id" },
                field: "product_id",
            },
            rating: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            comment: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            images: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(24),
                allowNull: false,
                defaultValue: "published",
            },
            moderationReason: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "moderation_reason",
            },
            sellerReply: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: "seller_reply",
            },
            repliedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "replied_at",
            },
            repliedByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                references: { model: "users", key: "id" },
                field: "replied_by_user_id",
            },
            reportedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "reported_at",
            },
            reportReason: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "report_reason",
            },
            reportedByUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                references: { model: "users", key: "id" },
                field: "reported_by_user_id",
            },
            helpfulCount: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                field: "helpful_count",
            },
            notHelpfulCount: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                field: "not_helpful_count",
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
            modelName: "ProductReview",
            tableName: "product_reviews",
            underscored: true,
            indexes: [
                {
                    unique: true,
                    fields: ["user_id", "product_id"],
                },
            ],
        });
        return ProductReview;
    }
}
