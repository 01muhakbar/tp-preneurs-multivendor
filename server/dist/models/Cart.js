import { DataTypes, Model } from "sequelize";
export class Cart extends Model {
    static associate(models) {
        // Definisikan relasi di sini
        Cart.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
        });
        Cart.belongsToMany(models.Product, {
            through: { model: models.CartItem, unique: false }, // Gunakan model langsung
            as: "Products",
            foreignKey: "cartId", // GUNAKAN camelCase agar konsisten
        });
    }
    static initModel(sequelize) {
        Cart.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            // --- PERBAIKAN DI SINI ---
            // Pastikan tipe data sama dengan primary key di tabel User
            userId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                references: {
                    model: "users", // Nama tabel yang direferensikan
                    key: "id",
                },
            },
        }, {
            sequelize,
            modelName: "Cart",
            tableName: "carts",
            underscored: true,
        });
        return Cart;
    }
}
