import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { User } from "./User.js";

export type BugReportStatus = "NEW" | "INVESTIGATING" | "FIXED" | "CLOSED";
export type BugReportPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface BugReportAttributes {
  id: number;
  ticketNumber: string;
  pageUrl: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string | null;
  userAgent?: string | null;
  reporterEmail: string;
  reporterUserId?: number | null;
  userNote?: string | null;
  status: BugReportStatus;
  priority: BugReportPriority;
  resolutionNote?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type BugReportCreationAttributes = Optional<
  BugReportAttributes,
  | "id"
  | "errorStack"
  | "userAgent"
  | "reporterUserId"
  | "userNote"
  | "status"
  | "priority"
  | "resolutionNote"
  | "resolvedAt"
  | "resolvedBy"
  | "createdAt"
  | "updatedAt"
>;

export class BugReport
  extends Model<BugReportAttributes, BugReportCreationAttributes>
  implements BugReportAttributes
{
  declare id: number;
  declare ticketNumber: string;
  declare pageUrl: string;
  declare errorName: string;
  declare errorMessage: string;
  declare errorStack?: string | null;
  declare userAgent?: string | null;
  declare reporterEmail: string;
  declare reporterUserId?: number | null;
  declare userNote?: string | null;
  declare status: BugReportStatus;
  declare priority: BugReportPriority;
  declare resolutionNote?: string | null;
  declare resolvedAt?: Date | null;
  declare resolvedBy?: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare reporter?: User;
  declare resolver?: User;

  static initModel(sequelize: Sequelize): typeof BugReport {
    BugReport.init(
      {
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
      },
      {
        sequelize,
        modelName: "BugReport",
        tableName: "bug_reports",
        underscored: true,
      }
    );

    return BugReport;
  }

  static associate(models: { User: typeof User }): void {
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
