import { DataTypes, Model } from "sequelize";
export class TrackingEvent extends Model {
    static associate(models) {
        TrackingEvent.belongsTo(models.Shipment, {
            foreignKey: { name: "shipmentId", field: "shipment_id" },
            as: "shipment",
        });
    }
    static initModel(sequelize) {
        return TrackingEvent.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            shipmentId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                field: "shipment_id",
                references: {
                    model: "shipments",
                    key: "id",
                },
            },
            eventType: {
                type: DataTypes.STRING(64),
                allowNull: false,
                field: "event_type",
            },
            eventLabel: {
                type: DataTypes.STRING(160),
                allowNull: true,
                field: "event_label",
            },
            eventDescription: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "event_description",
            },
            occurredAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "occurred_at",
            },
            source: {
                type: DataTypes.STRING(64),
                allowNull: true,
            },
            actorType: {
                type: DataTypes.STRING(64),
                allowNull: true,
                field: "actor_type",
            },
            actorId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "actor_id",
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
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
            modelName: "TrackingEvent",
            tableName: "tracking_events",
            underscored: true,
            indexes: [
                { fields: ["shipment_id"], name: "tracking_events_shipment_id_idx" },
                { fields: ["occurred_at"], name: "tracking_events_occurred_at_idx" },
                { fields: ["event_type"], name: "tracking_events_event_type_idx" },
            ],
        });
    }
}
