import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  IsUUID,
  Table,
} from 'sequelize-typescript'
import Base, { type IBaseEntity } from './Base'
import User from './User'
import Live from './Live'

interface LiveSessionEntity extends IBaseEntity {
  live_id: string
  user_id: string
}

export type LiveSessionAttributes = Omit<
  LiveSessionEntity,
  'id' | 'created_at' | 'updated_at'
>

@Table({ tableName: 'live_session' })
class LiveSession extends Base {
  @IsUUID(4)
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  user_id: string

  @BelongsTo(() => User)
  user: Awaited<User>

  @IsUUID(4)
  @ForeignKey(() => Live)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  live_id: string

  @BelongsTo(() => Live)
  live: Awaited<Live>
}

export default LiveSession
