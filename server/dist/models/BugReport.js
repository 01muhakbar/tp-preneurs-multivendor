import { DataTypes, Model } from "sequelize";
export class BugReport extends Model {
    static initModel(sequelize) {
        BugReport.init({
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            ticketNumber: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true,
                field: "ticket_number",
            },
            pageUrl: {
                type: DataTypes.STRING(2048),
                allowNull: false,
                field: "page_url",
            },
            errorName: {
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: "ApplicationError",
                field: "error_name",
            },
            errorMessage: {
                type: DataTypes.TEXT,
                allowNull: false,
                field: "error_message",
            },
            errorStack: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "error_stack",
            },
            userAgent: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "user_agent",
            },
            reporterEmail: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: "reporter_email",
            },
            reporterUserId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "reporter_user_id",
            },
            userNote: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "user_note",
            },
            status: {
                type: DataTypes.ENUM("NEW", "INVESTIGATING", "FIXED", "CLOSED"),
                allowNull: false,
                defaultValue: "NEW",
            },
            priority: {
                type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
                allowNull: false,
                defaultValue: "MEDIUM",
            },
            resolutionNote: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: "resolution_note",
            },
            resolvedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "resolved_at",
            },
            resolvedBy: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                field: "resolved_by",
            },
        }, {
            sequelize,
            modelName: "BugReport",
            tableName: "bug_reports",
            underscored: true,
        });
        return BugReport;
    }
    static associate(models) {
        BugReport.belongsTo(models.User, {
            foreignKey: "reporterUserId",
            as: "reporter",
        });
        BugReport.belongsTo(models.User, {
            foreignKey: "resolvedBy",
            as: "resolver",
        });
    }
}
export default BugReport;
