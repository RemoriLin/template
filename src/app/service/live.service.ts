import { type Request } from 'express'
import { validateBoolean } from 'expresso-core'
import { type TOptions } from 'i18next'
import _ from 'lodash'
import { Op, Sequelize } from 'sequelize'
import { env } from '~/config/env'
import { i18n } from '~/config/i18n'
import { type IReqOptions } from '~/core/interface/ReqOptions'
import { type DtoFindAll } from '~/core/interface/dto/Paginate'
import { useQuery } from '~/core/modules/hooks/useQuery'
import ResponseError from '~/core/modules/response/ResponseError'
import { validateUUID } from '~/core/utils/formatter'
import Live, { type LiveAttributes } from '~/database/entities/Live'
import liveSchema from '../schema/live.schema'
import LiveSession from '~/database/entities/LiveSession'
import { UserAttributes, UserEntity } from '~/database/entities/User'

export default class LiveService {
  /**
   *
   * @param req
   * @returns
   */
  public static async findAll(req: Request): Promise<DtoFindAll<Live>> {
    const reqQuery = req.getQuery()

    const defaultLang = reqQuery.lang ?? env.APP_LANG
    const i18nOpt: string | TOptions = { lng: defaultLang }

    const query = useQuery({ entity: Live, reqQuery, includeRule: [] })

    const data = await Live.findAll({
      ...query,
      order: query.order ? query.order : [['created_at', 'desc']],
    })

    const total = await Live.count({
      include: query.includeCount,
      where: query.where,
    })

    const message = i18n.t('success.data_received', i18nOpt)
    return { message: `${total} ${message}`, data, total }
  }

  public static async findById(
    id: string,
    options?: IReqOptions
  ): Promise<Live> {
    const i18nOpt: string | TOptions = { lng: options?.lang }

    const newId = validateUUID(id, { ...options })
    const data = await Live.findOne({
      where: { id: newId },
      paranoid: options?.paranoid,
    })

    if (!data) {
      const options = { ...i18nOpt, entity: 'live' }
      const message = i18n.t('errors.not_found', options)

      throw new ResponseError.NotFound(message)
    }

    return data
  }

  /**
   *
   * @param formData
   * @returns
   */
  public static async create(
    formData: LiveAttributes,
    host_id: string
  ): Promise<Live> {
    const value = liveSchema.create.parse(formData)

    const data = await Live.create({
      ...value,
      is_live: true,
      host_id,
    })

    return data
  }

  /**
   *
   * @param id
   * @param formData
   * @param options
   * @returns
   */
  public static async update(
    id: string,
    formData: LiveAttributes,
    options?: IReqOptions
  ): Promise<Live> {
    const data = await this.findById(id, { ...options })

    const value = liveSchema.create.parse({ ...data, ...formData })

    const newData = await data.update({ ...data, ...value })

    return newData
  }

  /**
   *
   * @param id
   * @param options
   */
  public static async restore(
    id: string,
    options?: IReqOptions
  ): Promise<void> {
    const data = await this.findById(id, { ...options, paranoid: false })
    await data.restore()
  }

  /**
   *
   * @param id
   * @param options
   */
  private static async _delete(
    id: string,
    options?: IReqOptions
  ): Promise<void> {
    // if true = force delete else soft delete
    const isForce = validateBoolean(options?.force)

    const data = await this.findById(id, { ...options })
    await data.destroy({ force: isForce })
  }

  /**
   *
   * @param id
   * @param options
   */
  public static async softDelete(
    id: string,
    options?: IReqOptions
  ): Promise<void> {
    // soft delete
    await this._delete(id, options)
  }

  /**
   *
   * @param id
   * @param options
   */
  public static async forceDelete(
    id: string,
    options?: IReqOptions
  ): Promise<void> {
    // force delete
    await this._delete(id, { ...options, force: true })
  }

  /**
   *
   * @param ids
   * @param options
   */
  private static _validateGetByIds(ids: string[], options?: IReqOptions): void {
    const i18nOpt: string | TOptions = { lng: options?.lang }

    if (_.isEmpty(ids)) {
      const message = i18n.t('errors.cant_be_empty', i18nOpt)
      throw new ResponseError.BadRequest(`ids ${message}`)
    }
  }

  /**
   *
   * @param ids
   * @param options
   */
  public static async multipleRestore(
    ids: string[],
    options?: IReqOptions
  ): Promise<void> {
    this._validateGetByIds(ids, options)

    await Live.restore({ where: { id: { [Op.in]: ids } } })
  }

  /**
   *
   * @param ids
   * @param options
   */
  private static async _multipleDelete(
    ids: string[],
    options?: IReqOptions
  ): Promise<void> {
    // validate empty ids
    this._validateGetByIds(ids, options)

    // if true = force delete else soft delete
    const isForce = validateBoolean(options?.force)

    await Live.destroy({ where: { id: { [Op.in]: ids } }, force: isForce })
  }

  /**
   *
   * @param ids
   * @param options
   */
  public static async multipleSoftDelete(
    ids: string[],
    options?: IReqOptions
  ): Promise<void> {
    // multiple soft delete
    await this._multipleDelete(ids, options)
  }

  /**
   *
   * @param ids
   * @param options
   */
  public static async multipleForceDelete(
    ids: string[],
    options?: IReqOptions
  ): Promise<void> {
    // multiple force delete
    await this._multipleDelete(ids, { ...options, force: true })
  }

  /**
   *
   * @param id
   * @param options
   */
  public static async joinLive(
    id: string,
    user_id: string,
    options?: IReqOptions
  ): Promise<void> {
    const getLive = await Live.findOne({ where: { id } })

    if (!getLive) {
      throw new ResponseError.NotFound('Live tidak ditemukan')
    }

    const getSession = await LiveSession.findOne({
      where: { user_id: String(user_id) },
    })

    if (!getSession) {
      await LiveSession.create({ live_id: getLive.id, user_id })
    } else {
      await getSession.update({ ...getSession })
    }
  }

  /**
   *
   * @param id
   * @param options
   */
  public static async stopLive(
    id: string,
    options?: IReqOptions
  ): Promise<void> {
    const getLive = await Live.findOne({ where: { id } })

    if (!getLive) {
      throw new ResponseError.NotFound('Live tidak ditemukan')
    }
    await getLive.update({ is_live: false })
  }
}
