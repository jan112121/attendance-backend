import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const EmailTemplate = sequelize.define(
  'EmailTemplate',
  {
    key: { type: DataTypes.STRING, unique: true, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.TEXT, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: 'email_templates',
    underscored: true,
    timestamps: true,
  }
);

export default EmailTemplate;