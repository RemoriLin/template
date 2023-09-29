'use strict'

import { DataTypes, QueryInterface, Sequelize as SEQUELIZE } from 'sequelize'

export async function up(
  queryInterface: QueryInterface,
  Sequelize: typeof DataTypes
) {
  await queryInterface.createTable('user', {
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
    username: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    email: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    password: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    phone: {
      allowNull: false,
      type: Sequelize.STRING('20'),
    },
    saldo: {
      allowNull: true,
      type: Sequelize.INTEGER,
    },
    photo: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    is_active: {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    is_blocked: {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    role_id: {
      allowNull: false,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      references: {
        model: 'role',
        key: 'id',
      },
    },
    otp: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    otp_expired_date: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  })

  await queryInterface.addConstraint('user', {
    type: 'unique',
    fields: ['email'],
    name: 'UNIQUE_USERS_EMAIL',
  })

  await queryInterface.addConstraint('user', {
    type: 'unique',
    fields: ['phone'],
    name: 'UNIQUE_USERS_PHONE',
  })
}

export async function down(
  queryInterface: QueryInterface,
  Sequelize: typeof DataTypes
) {
  await queryInterface.dropTable('user')
}
