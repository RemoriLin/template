'use strict'

import { DataTypes, QueryInterface, Sequelize as SEQUELIZE } from 'sequelize'

export async function up(
  queryInterface: QueryInterface,
  Sequelize: typeof DataTypes
) {
  await queryInterface.createTable('live', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
    is_private: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
    },
    price: {
      allowNull: false,
      type: Sequelize.INTEGER,
    },
    is_live: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
    },
    host_id: {
      allowNull: false,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      references: {
        model: 'user',
        key: 'id',
      },
    },
  })
}

export async function down(
  queryInterface: QueryInterface,
  Sequelize: typeof DataTypes
) {
  await queryInterface.dropTable('live')
}
