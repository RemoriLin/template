import {
  BelongsTo,
  Column,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  IsUUID,
  Table,
} from 'sequelize-typescript'
import Base, { type IBaseEntity } from './Base'
import User from './User'
import LiveSession from './LiveSession'

interface LiveEntity extends IBaseEntity {
  deleted_at?: Date | null
  host_id: string
  is_private: string
  price: number
  is_live: boolean
}

export type LiveAttributes = Omit<
  LiveEntity,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
>

@Table({ tableName: 'live', paranoid: true })
class Live extends Base {
  @DeletedAt
  @Column
  deleted_at?: Date

  @Column({ allowNull: false })
  is_private: boolean

  @Column({ allowNull: true })
  price: number

  @Column({ allowNull: true })
  is_live: boolean

  @IsUUID(4)
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  host_id: string

  @BelongsTo(() => User)
  host: Awaited<User>

  @HasMany(() => LiveSession)
  viewers: Awaited<LiveSession>
}

export default Live
