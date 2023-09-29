import { validateEmpty } from 'expresso-core'
import { useToken } from 'expresso-hooks'
import { type ExpiresType } from 'expresso-hooks/lib/token/interface'
import { type TOptions } from 'i18next'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { env } from '~/config/env'
import { i18n } from '~/config/i18n'
import ConstRole from '~/core/constants/ConstRole'
import { type IReqOptions } from '~/core/interface/ReqOptions'
import ResponseError from '~/core/modules/response/ResponseError'
import SendMail from '~/core/utils/sendMails'
import User, {
  type UserLoginAttributes,
  type LoginAttributes,
  UserAttributes,
} from '~/database/entities/User'
import { type DtoLogin } from '../interface/dto/Auth'
import userSchema from '../schema/user.schema'
import OpenStreetMapService from './provider/osm.service'
import SessionService from './session.service'
import UserService from './user.service'
import bcrypt from 'bcrypt'
import { hashing } from '~/config/hashing'
import { sendSMS } from '~/core/utils/sendSms'

export default class AuthService {
  /**
   *
   * @param formData
   * @returns
   */
  public static async signUp(formData: any) {
    const uid = uuidv4()

    const { token } = useToken.generate({
      value: { token: uid },
      secretKey: env.JWT_SECRET_ACCESS_TOKEN,
      expires: env.JWT_ACCESS_TOKEN_EXPIRED as ExpiresType,
    })

    let role_id = ConstRole.ID_USER

    // check role
    if (formData.roleAs === 'USER') {
      role_id = ConstRole.ID_USER
    }

    const newFormData: UserAttributes = {
      ...formData,
      is_active: false,
      token_verify: token,
      role_id,
      upload_id: null,
    }

    const value = userSchema.register.parse(newFormData)

    const formRegister: any = {
      ...value,
      password: await hashing.hash(value.confirm_new_password),
    }

    const otpNumber = `${Math.floor(100000 + Math.random() * 900000)}`

    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() + 1)

    const newData = await User.create({
      ...formRegister,
      otp: bcrypt.hashSync(otpNumber, 7),
      otp_expired_date: new Date(new Date().getTime() + 5 * 60000),
    })

    return { newData, otpNumber }
  }

  /**
   *
   * @param id
   * @param otp
   * @param options
   * @returns
   */
  public static async verifyOtp(
    id: string,
    otp: string,
    options?: IReqOptions
  ) {
    const i18nOpt: string | TOptions = { lng: options?.lang }

    const user = await User.findByPk(id)
    if (!user) {
      const message = i18n.t('errors.account_not_found', i18nOpt)
      throw new ResponseError.NotFound(message)
    }
    const compareOtp = bcrypt.compareSync(otp, user.otp)
    if (!compareOtp)
      throw new ResponseError.BadRequest('Harap masukan code otp yang sesuai')
    if (new Date() > new Date(user.otp_expired_date)) {
      throw new ResponseError.BadRequest('Code otp sudah kadaluarsa')
    }
    await user.update({ isActive: true, otp: '' }, { where: { id: user.id } })
    return 'Verifikasi code otp berhasil'
  }

  /**
   *
   * @param formData
   * @param options
   * @returns
   */
  public static async signIn(
    formData: LoginAttributes,
    options?: IReqOptions
  ): Promise<DtoLogin> {
    const i18nOpt: string | TOptions = { lng: options?.lang }

    const value = userSchema.login.parse(formData)

    const getUser = await User.scope('withPassword').findOne({
      where: { email: value.email },
    })

    // check user account
    if (!getUser) {
      const message = i18n.t('errors.account_not_found', i18nOpt)
      throw new ResponseError.NotFound(message)
    }

    // // check active account
    // if (!getUser.is_active) {
    //   const message = i18n.t('errors.please_check_your_email', i18nOpt)
    //   throw new ResponseError.BadRequest(message)
    // }

    const matchPassword = await getUser.comparePassword(value.password)

    // compare password
    if (!matchPassword) {
      const message = i18n.t('errors.incorrect_email_or_pass', i18nOpt)
      throw new ResponseError.BadRequest(message)
    }

    const user_id = getUser.id

    if (value.latitude && value.longitude) {
      // get address from lat long maps
      const response = await OpenStreetMapService.getByCoordinate(
        String(value.latitude),
        String(value.longitude)
      )
      const address = _.get(response, 'display_name', '')

      // update address
      await User.update({ address }, { where: { id: user_id } })
    }

    const payloadToken = { uid: user_id }

    const { token, expiresIn } = useToken.generate({
      value: payloadToken,
      secretKey: env.JWT_SECRET_ACCESS_TOKEN,
      expires: env.JWT_ACCESS_TOKEN_EXPIRED as ExpiresType,
    })

    const message = i18n.t('success.login', i18nOpt)

    const newData = {
      message,
      accessToken: token,
      expiresIn,
      tokenType: 'Bearer',
      user: payloadToken,
      username: getUser.username,
    }

    return newData
  }

  /**
   *
   * @param user_id
   * @param token
   * @param options
   * @returns
   */
  public static async verifySession(
    user_id: string,
    token: string,
    options?: IReqOptions
  ): Promise<User | null> {
    const getSession = await SessionService.findByUserToken(user_id, token)

    const validateToken = useToken.verify({
      token: getSession.token,
      secretKey: env.JWT_SECRET_ACCESS_TOKEN,
    })

    const userToken = validateToken?.data as UserLoginAttributes

    if (!_.isEmpty(userToken.uid)) {
      const getUser = await UserService.findById(userToken.uid, { ...options })

      return getUser
    }

    return null
  }

  /**
   *
   * @param user_id
   * @param token
   * @param options
   * @returns
   */
  public static async logout(
    user_id: string,
    token: string,
    options?: IReqOptions
  ): Promise<string> {
    const i18nOpt: string | TOptions = { lng: options?.lang }

    const getUser = await UserService.findById(user_id, { ...options })

    // clean session
    await SessionService.deleteByUserToken(getUser.id, token)
    const message = i18n.t('success.logout', i18nOpt)

    return message
  }
}
